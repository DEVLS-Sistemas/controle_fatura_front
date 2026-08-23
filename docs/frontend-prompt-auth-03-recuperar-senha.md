# Etapa 3 — Recuperar senha

Índice: [`frontend-prompt-auth.md`](frontend-prompt-auth.md) · Back: [`modules/auth.md`](modules/auth.md) (etapa 3).

## Objetivo

Três telas (ou um wizard na mesma rota), nesta ordem:

```
[1. E-mail]  →  [2. Código · 6 inputs]  →  [3. Nova senha]  →  /dashboard
```

**Não** avisar se o e-mail existe. Depois do passo 1, sempre a mesma mensagem do back e seguir para o código.

Se o e-mail não estiver na base, o back **não envia** e-mail e **não** conta isso ao client. O front trata o passo 1 como sucesso genérico do mesmo jeito.

---

## Estado atual

- Rota `/forgot-password` aponta para `ForgetPassword.tsx` (template Velzon): inglês, Redux `userForgetPassword`, botão “Send Reset Link”, sem API real.
- Existe UI de 4 dígitos em `AuthenticationInner/TwoStepVerification/BasicTwosVerify.tsx` — **não usar** (4 dígitos, stub). Servir só de referência visual.
- Login **não** tem link “Esqueci a senha”.

Esta etapa **substitui** o stub. Não completar o fluxo fake do Velzon.

---

## Rotas de UI

| Rota | Uso |
|------|-----|
| `/recuperar-senha` | Wizard (passos 1–3). Query `?passo=email\|codigo\|senha` ou estado interno |
| `/forgot-password` | `Navigate` para `/recuperar-senha` (não quebrar link antigo) |

Arquivo sugerido: `src/pages/Authentication/RecuperarSenha.tsx` (um componente com 3 passos). Remover a lógica Redux de `ForgetPassword.tsx` ou apagar o arquivo depois do redirect.

Estado do fluxo **em memória** (useState / location state). Não precisa `localStorage` para e-mail/código.

---

## Tela 1 — Informar e-mail

- Campo e-mail + botão “Enviar código”.
- Link voltar ao `/login`.
- Loading no botão.

```http
POST /api/v1/auth/recuperar-senha
{ "email": "leo@email.com" }
```

Sucesso (sempre 200 se o e-mail for **válido** como formato):

> Se o e-mail informado estiver cadastrado, um código será enviado.

1. Mostrar essa mensagem (toast ou alert).
2. Guardar o e-mail no estado do wizard.
3. Ir para a tela 2.

422 só se e-mail inválido/vazio. **Não** ir à tela 2 se a request falhar.

**Proibido:** “e-mail não encontrado”, “usuário inexistente”, ou qualquer copy que confirme ausência.

---

## Tela 2 — Código de 6 dígitos

- Texto: código enviado para o e-mail (mostrar mascarado, ex. `le***@email.com`, ou o e-mail completo).
- **6 inputs** separados, um dígito cada.
- Link “Reenviar código” → de novo `POST /recuperar-senha` com o mesmo e-mail (throttle silencioso no back; mesma mensagem genérica).
- **Não** ícone de olho (não há senha nesta tela).

### UX dos 6 inputs

| Comportamento | Detalhe |
|---------------|---------|
| Tipo | `inputMode="numeric"`, `maxLength={1}`, aceitar só `0-9` |
| Digitar | ao preencher um dígito, focar o próximo |
| Backspace | se o campo atual estiver vazio, focar o anterior e apagar |
| Colar | colar `123456` (ou `123-456`) preenche os seis de uma vez |
| Submit | botão “Verificar”; opcional: submeter ao completar o 6º |

Referência visual: inputs grandes centralizados do `BasicTwosVerify`, porém **6 colunas** (`Col` com `col-2` ou flex).

```http
POST /api/v1/auth/verificar-codigo
{ "email": "leo@email.com", "codigo": "123456" }
```

Sucesso (`codigo_valido: true`) → tela 3, mantendo e-mail + código no estado.

Erro 422 `Código inválido ou expirado` → limpar os 6 inputs, focar o primeiro, mostrar a mensagem. **Não** dizer que o e-mail não existe.

O código **não** é consumido neste endpoint — o usuário pode errar a senha no passo 3 e tentar de novo enquanto o código valer (15 min no back).

---

## Tela 3 — Nova senha

- Senha + confirmação (min 6). **Sem** ícone de olho (igual ao cadastro).
- Botão “Redefinir senha”.

```http
POST /api/v1/auth/redefinir-senha
{
  "email": "leo@email.com",
  "codigo": "123456",
  "password": "novaSenha1",
  "password_confirmation": "novaSenha1"
}
```

Sucesso 200: mesmo envelope do login (`token` + `user`).

1. `AuthService.persistSession` (token + user).
2. Invalidar caches/sessão antiga (etapa 2).
3. Entrar no app (`/dashboard`).
4. Toast `Senha redefinida com sucesso!` (ou `auth.message`).

Código expirado no meio do passo 3: mensagem da API e voltar à tela 1 ou 2. Não inventar “e-mail não cadastrado”.

---

## Ligação com o login

Na tela de login, link **Esqueci a senha** → `/recuperar-senha` (passo 1).

Colocar o link perto do campo senha (padrão Velzon), em PT-BR.

---

## Service

Estender `src/services/Auth/AuthService.ts` (não criar service paralelo):

```ts
recuperarSenha({ email })
verificarCodigo({ email, codigo })
redefinirSenha({ email, codigo, password, password_confirmation })
```

Rotas públicas: **não** exigir Bearer. O interceptor só manda token se existir sessão — ok se sobrar um token velho, o back ignora nessas rotas.

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Authentication/RecuperarSenha.tsx` | **Novo** — wizard 3 passos |
| `src/pages/Authentication/ForgetPassword.tsx` | Redirect ou deletar |
| `src/pages/Authentication/Login.tsx` | Link “Esqueci a senha” |
| `src/services/Auth/AuthService.ts` | 3 métodos novos; `redefinirSenha` reusa `persistSession` |
| `src/Routes/allRoutes.tsx` | `/recuperar-senha` em `publicRoutes`; `/forgot-password` → redirect |

---

## Fora de escopo

- Link mágico / token na URL (só código de 6 dígitos).
- Troca de senha autenticada em configurações/perfil.
- Revelar se o e-mail existe, em qualquer passo.

---

## Checklist

- [x] Passo 1: mensagem genérica; nunca “e-mail não encontrado”
- [x] Sempre vai ao passo 2 após 200 (e-mail exista ou não)
- [x] Passo 2: 6 inputs, foco automático, suporte a colar
- [x] Reenviar código sem quebrar o fluxo (mesma mensagem)
- [x] Passo 3 redefine e **já autentica** com o token da resposta
- [x] Senha do passo 3 **sem** ícone de olho
- [x] Erros de código inválido/expirado sem vazar existência do e-mail
- [x] Login tem “Esqueci a senha”
