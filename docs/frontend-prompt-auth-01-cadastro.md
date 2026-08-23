# Etapa 1 — Cadastro de usuário (já logado)

Índice: [`frontend-prompt-auth.md`](frontend-prompt-auth.md) · Back: [`modules/auth.md`](modules/auth.md) (etapa 1).

## Objetivo

1. Tela de cadastro com nome, e-mail, senha e confirmação.
2. **Não exibir ícone de olho** para revelar a senha (nem no campo senha, nem na confirmação). Inputs `type="password"` sem toggle.
3. No sucesso, persistir o token e **entrar no app** (mesmo fluxo pós-login). Não redirecionar para a tela de login.

Quem se cadastra **já está logado**. Não existe passo “agora faça login”.

---

## Estado atual

`Register.tsx` **já atende** o essencial:

- Campos: nome, e-mail, senha, confirmar senha.
- **Sem** ícone de olho nos dois campos de senha.
- Validação Yup: e-mail válido, senha ≥ 6, confirmação igual.
- `AuthService.register` persiste `sessionStorage.authUser` e a tela navega para `/dashboard`.

Ajustes desta etapa (não reinventar a tela):

| Gap | Arquivo | O que fazer |
|-----|---------|-------------|
| Payload sem confirmação | `Register.tsx` + `AuthService` | Enviar `password_confirmation` (o back valida) |
| Toast fixo | `Register.tsx` | Preferir `auth.message` da API (`Usuário cadastrado com sucesso!`) |
| Login com demo preenchido | `Login.tsx` | Esvaziar `initialValues` (o e-mail lembrado entra na etapa 4) |
| `GET /me` lê envelope errado | `AuthService.me` | Ler `auth.data` (hoje lê `response.body?.data`) |
| Já logado abre `/login` ou `/register` | rotas / layout | Redirect para `/dashboard` |

O ícone de olho **do login** pode permanecer nesta etapa (não é o cadastro). Não adicionar olho no cadastro.

---

## Tela de cadastro

Rota existente: `/register` (`src/pages/Authentication/Register.tsx`).

| Campo | Tipo | Observação |
|-------|------|------------|
| Nome | text | obrigatório |
| E-mail | email | obrigatório |
| Senha | password | min 6; **sem** ícone de olho |
| Confirmar senha | password | deve coincidir; **sem** ícone de olho |

Link “Já tem conta?” → `/login` (já existe).

Validação no client **antes** do POST: campos preenchidos, e-mail válido, senha ≥ 6, confirmação igual.

Layout: manter `ParticlesAuth` + card Velzon, textos em PT-BR.

---

## API

```http
POST /api/v1/auth/register
```

```json
{
  "name": "Leonardo",
  "email": "leo@email.com",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

### Sucesso (200)

Envelope `auth.data` com `user`, `token`, `token_type`.

1. Guardar token no mesmo storage do login (`sessionStorage.authUser` via `AuthService.persistSession`).
2. Guardar `user` no objeto persistido (já feito).
3. O interceptor em `ApiConfig.ts` coloca `Authorization: Bearer {token}` nas próximas requests.
4. Redirecionar para `/dashboard`.
5. Toast com a mensagem da API.

### Erro

Exibir `message` (422 e-mail duplicado, senha curta, etc.). Não limpar sessão se a request falhar (não havia sessão nova).

Mensagens do back (espelho):

| Situação | HTTP | Mensagem |
|----------|------|----------|
| Campos obrigatórios ausentes | 422 | `Nome, e-mail e senha são obrigatórios` |
| E-mail inválido | 422 | `E-mail inválido` |
| Senha curta | 422 | `A senha deve ter no mínimo 6 caracteres` |
| Confirmação diferente | 422 | `A confirmação da senha não confere` |
| E-mail já cadastrado | 422 | `E-mail já cadastrado` |

---

## Login desta etapa (tela já existente)

Manter `Login.tsx` + `AuthService.login` funcionando.

```http
POST /api/v1/auth/login
{ "email": "...", "password": "..." }
```

Mesmo tratamento de token/redirect do cadastro. Credenciais inválidas: 401 `Credenciais inválidas` (não distinguir “e-mail não existe” vs “senha errada”).

Campos iniciais **vazios** (remover `demo@demo.com` / `123456` do form). O README continua documentando o usuário demo para quem for testar à mão.

### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

`Logout.tsx` já chama `AuthService.logout` e vai para `/login`. Manter: limpar token + user **mesmo se o back falhar**.

Na etapa 4 o logout **não** apaga o e-mail de “lembrar-me”. Nesta etapa ainda não existe essa chave.

### `GET /auth/me`

Usar no bootstrap da área logada (opcional nesta etapa; obrigatório alinhar o parser). Se 401, limpar sessão e ir ao login.

Hoje `me()` espera `response.body?.data`. O envelope padrão é `auth.data` — corrigir para não quebrar quando o `me` for usado.

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Authentication/Register.tsx` | Enviar `password_confirmation`; toast da API; **não** adicionar olho |
| `src/pages/Authentication/Login.tsx` | Esvaziar valores demo |
| `src/services/Auth/AuthService.ts` | `password_confirmation` no payload; `me()` lê `auth.data` |
| `src/Routes/index.tsx` ou `NonAuthLayout` | Se tem token, `/login` e `/register` → `/dashboard` |

Não criar tela nova de cadastro. Não usar o stub `AuthenticationInner/Register/*`.

---

## Fora de escopo desta etapa

- Ícone de olho no cadastro (não implementar).
- Recuperar senha (etapa 3) — um link “Esqueci a senha” no login pode existir **desabilitado** ou escondido até a etapa 3.
- Checkbox lembrar-me (etapa 4).
- Interceptor global de 401 (etapa 2).

---

## Checklist

- [ ] Cadastro sem ícone de olho nos dois campos de senha
- [ ] Confirmação de senha no client **e** `password_confirmation` no POST
- [ ] Sucesso do register = usuário **dentro** do sistema (token + `/dashboard`)
- [ ] Header Bearer nas rotas autenticadas (já via interceptor)
- [ ] Login/logout/`me` alinhados ao envelope `auth.data`
- [ ] Form de login sem credenciais demo hardcoded
- [ ] Autenticado não vê de novo `/login` ou `/register`
