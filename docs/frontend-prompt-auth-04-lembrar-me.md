# Etapa 4 — Login com “lembrar-me”

Índice: [`frontend-prompt-auth.md`](frontend-prompt-auth.md) · Back: [`modules/auth.md`](modules/auth.md) (etapa 4).

## Objetivo

Checkbox **Lembrar-me**: na próxima visita, o **e-mail** já vem preenchido. A senha **nunca** é salva.

Isso **não** é “manter logado”. A sessão continua sendo o Bearer em `sessionStorage` até o logout (ou até fechar a aba). “Lembrar-me” só poupa digitação do e-mail.

---

## Estado atual

- `Login.tsx` não tem checkbox.
- `initialValues` ainda pode ter demo (`demo@demo.com` / `123456`) — a etapa 1 esvazia isso; esta etapa preenche **só o e-mail** se houver chave salva.
- `AuthService.login` envia `{ email, password }` sem `lembrar_me`.
- Logout limpa `authUser` e não deve apagar o e-mail lembrado.

---

## Tela de login

Campos finais:

1. E-mail
2. Senha (olho do login pode permanecer — não é o cadastro)
3. Checkbox **Lembrar-me**
4. Botão Entrar
5. Link cadastro (`/register`)
6. Link esqueci a senha (`/recuperar-senha`, etapa 3)

Posição do checkbox: entre senha e o botão, alinhado à esquerda (padrão Velzon “Remember me”).

---

## API

```http
POST /api/v1/auth/login
{
  "email": "leo@email.com",
  "password": "secret123",
  "lembrar_me": true
}
```

Enviar `lembrar_me: true` só se o checkbox estiver marcado; caso contrário `false` ou omitir.

O back **ignora** o campo para TTL do token (contrato estável). A persistência do e-mail é **só no front**.

Resposta: idêntica à etapa 1, com ou sem o checkbox.

`AuthLoginPayload` passa a incluir `lembrar_me?: boolean`.

---

## Persistência (só front)

Chave: `auth.lembrar_email` no **`localStorage`** (sobrevive ao fechar o browser; o token não).

| Ação | Comportamento |
|------|----------------|
| Login com checkbox **marcado** e sucesso | `localStorage.setItem('auth.lembrar_email', email)` |
| Login com checkbox **desmarcado** e sucesso | `localStorage.removeItem('auth.lembrar_email')` |
| Abrir `/login` | Se a chave existir: preencher o e-mail e deixar o checkbox marcado |
| Logout | **Não** apagar a chave. Só remove `sessionStorage.authUser`. Na próxima vez o e-mail continua lá |
| Cadastro / redefinir senha | Não grava nem apaga “lembrar-me” (o usuário não passou pelo checkbox) |

Nunca gravar senha, token ou `user_id` nessa chave.

Não misturar com `sessionStorage.authUser`. São responsabilidades diferentes:

- `authUser` → sessão (token + user)
- `auth.lembrar_email` → conveniência do form

---

## Detalhes de implementação

Em `Login.tsx`:

```ts
const LEMBRAR_EMAIL_KEY = 'auth.lembrar_email'

initialValues: {
  email: localStorage.getItem(LEMBRAR_EMAIL_KEY) ?? '',
  password: '',
  lembrar_me: Boolean(localStorage.getItem(LEMBRAR_EMAIL_KEY)),
}
```

No sucesso do login (depois de `authService.login`):

```ts
if (values.lembrar_me) {
  localStorage.setItem(LEMBRAR_EMAIL_KEY, values.email)
} else {
  localStorage.removeItem(LEMBRAR_EMAIL_KEY)
}
```

A persistência pode ficar no `AuthService.login` ou na tela. Preferir a **tela** (é UX do form, não regra de sessão). O service só encaminha `lembrar_me` no body.

`enableReinitialize` do Formik: cuidado para não sobrescrever o que o usuário já digitou. Ler a chave **uma vez** na montagem.

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Authentication/Login.tsx` | Checkbox; ler/gravar `auth.lembrar_email`; e-mail inicial da chave |
| `src/services/Auth/AuthService.ts` | Aceitar `lembrar_me` no payload do POST |
| `src/pages/Authentication/Logout.tsx` | Confirmar que **não** remove `auth.lembrar_email` |

---

## Fora de escopo

- “Manter-me conectado” com cookie / token de longa duração.
- Salvar senha no browser via JS (o browser pode oferecer o próprio cofre — não interferir).
- Lembrar e-mail no cadastro.

---

## Checklist

- [ ] Checkbox visível no login
- [ ] E-mail preenchido automaticamente se o usuário marcou antes
- [ ] Senha nunca persistida
- [ ] Desmarcar e logar de novo esquece o e-mail
- [ ] Logout não apaga o e-mail lembrado
- [ ] Fechar o browser: token some (`sessionStorage`); e-mail lembrado permanece (`localStorage`)
