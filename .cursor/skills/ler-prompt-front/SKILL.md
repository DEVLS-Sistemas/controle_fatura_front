---
name: ler-prompt-front
description: Lê o comentário Prompt front no card CTLFAT, abre o arquivo no controle_fatura_back e implementa só a tela. Usar ao iniciar, pegar ou implementar um card neste front.
---

# Executar o prompt de front

O Cursor deste repo **não** lê as skills do back. O contrato é o comentário no Jira. Sempre que o usuário pedir para iniciar, pegar ou implementar o card, seguir isto **antes** de escrever código.

## 1. Achar o card

`detect-jira-card` ou a key que o usuário passou (`CTLFAT-15` / `15`).

## 2. Achar o prompt

`getJiraIssue` com `view: full`. Se `fields.comment.comments` vier vazio, `discover` → `listJiraIssueComments`.

Procurar a linha que **começa** com `Prompt front:`.

```
Prompt front: docs/frontend-prompt-exemplo.md
Branch back: `v1.0/dev-{tela}-CTLFAT-{n}`
```

- Caminho = relativo à raiz do `controle_fatura_back`
- Sem comentário: usar o caminho na seção **Front** da descrição
- Sem arquivo e sem caminho: **parar** e avisar. Não inventar tela nem API.

## 3. Abrir o arquivo

Repo irmão (mesmo nível que este):

```
../controle_fatura_back/<caminho>
```

Nesta máquina: `/home/leonardosilva/Projetos/Léo/controle_fatura_back/<caminho>`

1. Ler o working tree se o arquivo existir.
2. Senão: `git -C ../controle_fatura_back show <Branch back>:<caminho>`
3. Senão: avisar que o back ainda não gravou/não deu push.

Ler o arquivo **inteiro**. É a spec. Implementar só o que ele pede.

## 4. Não fazer

- Não copiar skills do back para cá além desta (comentar `Prompt front:` é trabalho do back).
- Não implementar a seção Back.
- Não improvisar endpoint, query ou layout fora do prompt.
