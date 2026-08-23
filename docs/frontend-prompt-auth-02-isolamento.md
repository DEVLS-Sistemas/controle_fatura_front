# Etapa 2 — Isolamento (front só fala pelo usuário logado)

Índice: [`frontend-prompt-auth.md`](frontend-prompt-auth.md) · Back: [`modules/auth.md`](modules/auth.md) (etapa 2).

## Objetivo

Faturas, cartões, compras e todo o restante são **do usuário logado**. O usuário A não vê, edita nem apaga dados do usuário B.

O back filtra por `user_id` do token. O front **não** escolhe o dono dos dados.

O isolamento é **invisível** na UX: não mostrar “seu usuário #1” como filtro. Cada um só vê o que cadastrou.

---

## Estado atual

O que já está correto:

- Interceptor em `ApiConfig.ts` injeta `Authorization: Bearer {token}` a partir de `sessionStorage.authUser`.
- Formulários de CRUD em `src/pages/Pages/**` **não** enviam `user_id`.
- `AuthProtected` redireciona para `/login` se não houver token na sessão.
- `AuthService.persistSession` guarda `user.id` só para exibir perfil — não para filtrar listagens.

Gaps desta etapa:

| Gap | Onde | Risco |
|-----|------|--------|
| Sem tratamento **global** de 401 | `ApiConfig` / `AuthProtected` | Token expirado deixa o usuário numa tela quebrada |
| `me()` com envelope errado | `AuthService` (etapa 1) | Bootstrap da sessão inconsistente |
| Troca de conta no mesmo browser | sessionStorage + estado das páginas | Listagens em memória da conta anterior |
| `user_id` no tipo/resposta de categoria | `CategoriasInterface` / `cadastrar-rapido` | Só leitura da API; **não** reenviar no próximo POST |
| `user_id` em `RepassesInterface` | tipo opcional | Idem: não usar como filtro/payload |

Não há React Query/SWR no projeto. O “cache” a zerar é: `sessionStorage.authUser`, estado local das páginas e qualquer chave de entidade no `localStorage` (se existir).

---

## Regras

1. **Nunca** enviar `user_id` em query, body ou path de CRUD.
2. Um único token por sessão. Trocar de conta = logout + login (não misturar caches).
3. Ao **401** em qualquer request autenticada: limpar token, estado em memória e redirecionar ao `/login`.
4. Ao login / cadastro / redefinir senha: invalidar listagens em memória. Senão um usuário vê dados do anterior no mesmo browser.
5. Não persistir IDs de fatura/cartão de uma sessão para usar na próxima conta.
6. Se a API devolver `user_id` num objeto, o front pode ignorar. Não gravar esse id para “filtrar depois”.

### 401 — comportamento esperado

Centralizar no interceptor de resposta de `ApiConfig` (ou equivalente):

1. Detectar 401 em rota autenticada.
2. Remover `sessionStorage.authUser`.
3. Remover `Authorization` default do axios.
4. Redirecionar para `/login` (evitar loop: não tratar 401 do próprio `/login` ou `/register` como “sessão inválida” da mesma forma — essas rotas já mostram a mensagem).

`AccessDeniedError` nos services continua válido para erros pontuais; o redirect global evita tela autenticada sem sessão.

### Troca de usuário

No `persistSession` (login, register, redefinir senha):

- Sobrescrever `authUser` por completo (já acontece).
- Não reaproveitar IDs/filtros da conta anterior em `localStorage` (ex.: último `fatura_id` aberto).

Logout limpa só a sessão (`authUser`). Na etapa 4 o e-mail de “lembrar-me” permanece.

---

## UX

Não adicionar seletor de usuário, nem badge “conta #id”, nem filtro por dono.

Se um `listar/{id}` de recurso alheio voltar 404, tratar como “não encontrado” — o back não deve devolver 403 que confirme existência.

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/libs/api/ApiConfig.ts` | Interceptor de **response** para 401 → limpar sessão + ir ao login |
| `src/Routes/AuthProtected.tsx` | Continuar bloqueando rota privada sem token; alinhar com o interceptor |
| `src/services/Auth/AuthService.ts` | `persistSession` substitui a sessão inteira; `logout` não deixa token residual |
| `src/services/**` e `src/interfaces/**` | Garantir que `user_id` não vá em create/update/search |
| `src/pages/Pages/**` | Nenhum form/query envia `user_id` |

Auditoria rápida: `rg "user_id" src/` — só aceitável em tipos de **resposta** (e mesmo assim, não reenviar).

---

## Fora de escopo desta etapa

- Recuperar senha (etapa 3).
- Lembrar-me (etapa 4).
- Mudar o back; o isolamento de dados é responsabilidade do `Auth::id()`.

---

## Checklist

- [x] Nenhum formulário/query envia `user_id`
- [x] 401 global → `/login` + sessão zerada
- [x] Troca de usuário não reaproveita listagens/IDs da conta anterior
- [x] Token só no storage de sessão combinado com o user atual
- [ ] Login na conta A, logout, login na conta B: dashboard/faturas/cartões só da B
