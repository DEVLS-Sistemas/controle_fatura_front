---
name: get-project-version
description: Resolve a versão atual do front de controle de faturas a partir de version.json e da branch Git. Usar ao criar branch, card Jira, bump de versão, subir deploy (tag) ou exibir a versão no footer.
---

# Resolução de versão

## Fontes (por prioridade)

1. Branch atual: padrão `v{major}.{minor}/...`.
2. `version.json` na raiz:

```json
{
    "name": "controle-fatura-front",
    "version": "1.0.0",
    "version_short": "1.0"
}
```

## Saídas

| Campo | Exemplo | Uso |
|---|---|---|
| `version_full` | `1.0.0` | fallback local, bump, tag |
| `version_short` | `1.0` | título Jira, prefixo de branch |
| `version_branch_prefix` | `v1.0` | `v1.0/dev-{tela}-CTLFAT-{n}` |

O footer autenticado deve ler `GET /api/v1` (`api_version`). Não hardcodar versão no JSX.
