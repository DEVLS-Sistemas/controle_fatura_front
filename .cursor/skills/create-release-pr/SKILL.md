---
name: create-release-pr
description: Cria o PR de promoção v1.0/dev → main com changelog por card CTLFAT e move os cards em Aguardando Publicação para Feito. Usar quando o usuário pedir PR de promoção, promover para main, PR de v1.0/dev para main ou release PR. Não usar para deploy/tag — isso é subir-deploy.
---

# PR de promoção (CTLFAT)

Não usar `create-pr` aqui. Aquele skill é feature → `v1.0/dev`. Este é só `v1.0/dev` → `main`.

*faça o deploy* / *subir deploy* / *tag da release* → `subir-deploy`. Este skill não publica tag.

## Base

- Head: `v1.0/dev` (nunca uma branch de card, nunca `v1.0/dev-build` nem outra camada extra)
- Base: `main`
- Nunca desenvolver na `main`
- Só abrir depois da **aprovação dos testes** (cards em **Testado** / **Aguardando Publicação**)

## Preparar

1. Conferir que `v1.0/dev` está limpa e alinhada com `origin/v1.0/dev`.
2. Changelog: `git log --format='%h %s' origin/main..origin/v1.0/dev`. Ignorar commits `Merge pull request`.
3. Agrupar o que entrou por `CTLFAT-XXXX` (commits + `detect-jira-card`). Texto do que foi commitado, não o card inteiro. Só Front.
4. Jira: `project = CTLFAT AND status = "Aguardando Publicação" ORDER BY key ASC`. Listar keys antes de transicionar.

## Versão do sistema

Este PR **altera a versão**. Resolver com `get-project-version` e comparar com `origin/main:version.json`.

- Se o usuário indicar a versão, usar essa.
- Senão, bump de patch em `version` (`1.0.0` → `1.0.1`); `version_short` só muda se major/minor mudarem.
- Commitar **na `v1.0/dev`**: `chore(version): sobe para X.Y.Z` (arquivo `version.json`).
- Push de `v1.0/dev` para o remoto entrar no PR.
- Título e body usam a **versão nova**.

Se `version.json` da `v1.0/dev` já for maior que o da `main`, não bump de novo — usar a versão que já está na branch.

Se já existir PR aberto `v1.0/dev` → `main`, atualizar o body em vez de abrir outro.

## Criar

Título:

```
release: promove v1.0/dev (X.Y.Z) para main
```

`X.Y.Z` = `version` do `version.json` (ex. `1.0.0`).

Body (HEREDOC, português):

```
## Versão

X.Y.Z (`version_short` X.Y)

## O que entra nesta publicação

### CTLFAT-XXXX — <resumo curto>
- <o que entrou neste repo>

## Cards

- CTLFAT-XXXX — <título curto>

## Test plan

- [ ] Footer autenticado mostra a versão da API (`GET /api/v1`)
- [ ] Fluxos principais das mudanças desta publicação
```

```bash
gh pr create --base main --head v1.0/dev --title "..." --body "..."
```

Guardar a URL.

## Resposta

Devolver a URL. Dizer que o próximo passo é o usuário **mergear** e, depois do merge, pedir *faça o deploy* (`subir-deploy`). Não mergear.

## Jira — concluir publicação

Depois que o PR nasceu, **todos** os cards em **Aguardando Publicação** (não só os do changelog) vão para **Feito** (coluna de concluído do board).

Por card:

1. Comentar (`addOrEditJiraIssueComment`, `contentFormat: markdown`):

```
Release front: <url>

Publicado na versão X.Y.Z.
```

Neste repo use **sempre** `Release front:`. No back, `Release back:`.

2. `getTransitionsForJiraIssue` / `listJiraIssueTransitions` — usar o **id** da transição cujo destino é **Feito**. Não chutar id. Não usar nome "Concluído" (o status do board é **Feito**).
3. `transitionJiraIssue` com esse id.

Se a busca não achar card em Aguardando Publicação, dizer isso e não transicionar outros status.

## Depois do merge

Não executar aqui. Encaminhar para `subir-deploy`.
