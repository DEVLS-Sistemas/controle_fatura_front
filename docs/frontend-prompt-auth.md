# Prompt — Frontend: Auth (índice)

Formaliza o processo de autenticação do **frontend** alinhado à API do `controle_fatura_back`.

Spec do back (mesmo número de etapa): [`modules/auth.md`](modules/auth.md).

**Implementar uma etapa por vez.** Quando o back começar a etapa N, o front faz a etapa N.

| Etapa | Spec | Tema |
|-------|------|------|
| **1** | [Cadastro + sessão imediata](frontend-prompt-auth-01-cadastro.md) | Tela de cadastro **sem** ícone de olho; após sucesso o usuário **já entra** |
| **2** | [Isolamento por usuário](frontend-prompt-auth-02-isolamento.md) | Token no header; nunca enviar `user_id`; 401 → login |
| **3** | [Recuperar senha](frontend-prompt-auth-03-recuperar-senha.md) | E-mail → 6 inputs do código → nova senha |
| **4** | [Login com “lembrar-me”](frontend-prompt-auth-04-lembrar-me.md) | Checkbox; e-mail persistido no `localStorage` |

---

## Contrato comum (todas as etapas)

Base: `/api/v1/auth`

Rotas **públicas** (sem Bearer): `register`, `login`, `recuperar-senha`, `verificar-codigo`, `redefinir-senha`.

Rotas **autenticadas**: `logout`, `me` e **todo o restante da API**.

Envelope de sucesso:

```json
{
  "auth": {
    "data": {
      "user": { "id": 1, "name": "...", "email": "..." },
      "token": "...",
      "token_type": "Bearer"
    },
    "status": true,
    "message": "..."
  }
}
```

Erro: `{ "error": true, "message": "..." }`.

O front **nunca** envia `user_id`. O back obtém o dono via token Sanctum (`Auth::id()`).

---

## Estado atual do front (gap)

Já existe login/cadastro reais contra a API (`AuthService` + `sessionStorage.authUser` + Bearer no interceptor). O que falta é formalizar o fluxo e fechar os buracos.

| Item | Hoje | Destino |
|------|------|---------|
| Cadastro | Funciona; **sem** olho; já persiste token e vai ao `/dashboard` | Manter; enviar `password_confirmation`; toast da API |
| Login | Funciona; tem olho; e-mail/senha **hardcoded** (`demo@demo.com` / `123456`) | Sem demo no form; etapa 4 preenche e-mail se “lembrar-me” |
| Isolamento | Bearer automático; forms **não** enviam `user_id` | 401 global → login; limpar sessão/caches na troca de conta |
| Recuperar senha | `/forgot-password` é stub Velzon (inglês, Redux fake, “Send Reset Link”) | Wizard de 3 passos + API real |
| Lembrar-me | Não existe | Checkbox + `localStorage` só com o e-mail |

Arquivos-base de auth hoje:

- `src/pages/Authentication/Login.tsx`
- `src/pages/Authentication/Register.tsx`
- `src/pages/Authentication/ForgetPassword.tsx`
- `src/pages/Authentication/Logout.tsx`
- `src/services/Auth/AuthService.ts`
- `src/Routes/AuthProtected.tsx`
- `src/Routes/allRoutes.tsx` (`publicRoutes`: `/login`, `/register`, `/forgot-password`, `/logout`)
- `src/libs/api/ApiConfig.ts` (interceptor Bearer)
- `src/Components/Hooks/UserHooks.ts`

---

## Rotas de UI

| Rota | Etapa | Auth |
|------|-------|------|
| `/login` | 1 / 4 | pública; se já tem token → `/dashboard` |
| `/register` | 1 | pública; se já tem token → `/dashboard` |
| `/recuperar-senha` | 3 | pública (wizard e-mail → código → nova senha). `/forgot-password` redireciona para cá |
| restante do app | 2 | privada; sem token → `/login` |

Se autenticado tentar abrir `/login` ou `/register`, redirecionar para `/dashboard`.

---

## Ordem (igual ao back)

```
Etapa 1  →  Etapa 2  →  Etapa 3  →  Etapa 4
cadastro     isolamento   recuperar     lembrar-me
sem olho     401/cache    6 dígitos     e-mail salvo
já logado
```
