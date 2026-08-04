# Prompt — Frontend: Faturas (listagem por cartão)

Use este prompt no repositório do frontend para alinhar a tela de faturas à API do `controle_fatura_back`.

---

## Objetivo

A tela de faturas deve:

1. **Listar faturas agrupadas por cartão (grupo)** (não uma lista plana misturada)
2. Dentro do grupo, identificar a **bandeira** da fatura (Visa/Master/…) — cada bandeira tem fatura própria
3. **Não exibir transações** na listagem — só resumo da fatura
4. Exibir o **intervalo do ciclo** (início/fim) e a competência, com base no ciclo do **grupo**
5. Abrir o **detalhe** (e as transações) só ao clicar em uma fatura
6. No detalhe, **agrupar transações pelo final do cartão** (`ultimos_digitos` / `nome_no_cartao`)
7. Separar **pagamentos de fatura** em grupo próprio **Operacionais** (não pedem final)

Hierarquia relevante: ver [`frontend-prompt-cartoes.md`](frontend-prompt-cartoes.md).

As faturas já são persistidas na tabela `faturas` (criadas manualmente ou automaticamente ao cadastrar compras). A fatura pertence à **bandeira** (`cartao_bandeira_id`), não ao número físico.

---

## Ciclo do cartão → competência

Cada cartão define:

| Campo | Uso |
|-------|-----|
| `dia_limite_fatura` | Fecha o ciclo. Compras até este dia entram na fatura do mês; depois, na seguinte |
| `dia_vencimento_fatura` | Data de pagamento (informativo) |

Exemplo com limite = 5 e vencimento = 12:

| Compra | Competência | `periodo_inicio` | `periodo_fim` | `data_vencimento` |
|--------|-------------|------------------|---------------|-------------------|
| 05/08/2026 | 08/2026 | 06/07/2026 | 05/08/2026 | 12/08/2026 |
| 06/08/2026 | 09/2026 | 06/08/2026 | 05/09/2026 | 12/09/2026 |

Se `dia_vencimento <= dia_limite` (ex.: fecha 25, vence 05), o vencimento cai no **mês seguinte** à competência.

---

## API

Base: `/api/v1/faturas` (Bearer Sanctum)

### Listagem — **breaking change**

```http
GET /api/v1/faturas/listar?perPage=5&page=1
GET /api/v1/faturas/listar?cartao_id=1&mes=8&ano=2026&status=pendente
Authorization: Bearer {token}
```

**Ordenação fixa:** competência (`ano`/`mes` desc) → cartão (`nome` asc) → `status` asc.

**Paginação é por fatura** (`perPage` = faturas). A página vem reagrupada por cartão em `data[]` (um cartão pode aparecer só com as faturas daquela página).

Filtros: `cartao_id`, `mes`, `ano`, `status`, `palavra_chave`, `page`, `perPage`.

### Formato da resposta (`data`)

```json
{
  "current_page": 1,
  "per_page": 5,
  "total": 2,
  "data": [
    {
      "cartao_id": 1,
      "nome": "Sofisa",
      "banco": "Sofisa",
      "dia_limite_fatura": 5,
      "dia_vencimento_fatura": 12,
      "cor_fundo": "#8b5cf6",
      "cor_texto": "#ffffff",
      "ativo": true,
      "total_faturas": 2,
      "valor_total": 450.9,
      "faturas": [
        {
          "id": 10,
          "cartao_bandeira_id": 1,
          "bandeira": "Mastercard",
          "mes": 8,
          "ano": 2026,
          "competencia": "08/2026",
          "periodo_inicio": "2026-07-06",
          "periodo_fim": "2026-08-05",
          "data_vencimento": "2026-08-12",
          "valor_total": "150.90",
          "arquivo_pdf": "faturas/1/....pdf",
          "tem_pdf": true,
          "status": "pendente",
          "erro_mensagem": null,
          "processado_em": null,
          "total_transacoes": 3,
          "transacoes_com_categoria": 2,
          "created_at": "...",
          "updated_at": "..."
        }
      ]
    }
  ]
}
```

**Importante:**

- `data[]` = grupos de cartão (não faturas soltas)
- Cada fatura traz `cartao_bandeira_id` + `bandeira` (label)
- Cada fatura traz contadores (`total_transacoes`), **não** o array de transações
- Use `cor_fundo` / `cor_texto` no chip do grupo
- Exiba `periodo_inicio`–`periodo_fim` e `data_vencimento` formatados em `dd/MM/yyyy`
- No card da fatura, mostre a bandeira quando o grupo tiver mais de uma (ex.: badge “Mastercard”)

### Detalhe (com resumo; transações em outro endpoint)

```http
GET /api/v1/faturas/listar/{id}
```

Retorna a fatura + chip do cartão + `competencia`, `periodo_inicio`, `periodo_fim`, `data_vencimento`, `tem_pdf`, `pdf_url`, contadores.

**Não** inclui a lista de transações. Para listar compras da fatura:

```http
GET /api/v1/transacoes/listar?fatura_id={id}&perPage=50
```

### Cadastro / lookups

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/lookups` | status, cartões (grupos), meses |
| POST | `/cadastrar` | multipart: `cartao_id`, `cartao_bandeira_id`, `mes`, `ano`, `arquivo_pdf?`, `processar_automatico?` |
| PUT | `/editar` | altera período/status/valor |
| DELETE | `/excluir/{id}` | soft-delete fatura + transações |
| POST | `/upload-pdf` | anexa PDF/CSV/XML |
| POST | `/processar/{id}` | reprocessa arquivo |
| GET | `/pdf/{id}` | visualiza arquivo |
| GET | `/faturas-list` | select assíncrono |

Bandeiras do cartão:

```http
GET /api/v1/cartoes/bandeiras-list?cartao_id={id}
```

---

## UI sugerida

### Cadastro de fatura — seleção de bandeira

1. Select **Cartão** (grupo) via `cartoes-list` / lookups
2. Buscar bandeiras: `GET /cartoes/bandeiras-list?cartao_id=`
3. Regra:
   - **0 bandeiras** → bloquear cadastro com CTA “Cadastre uma bandeira/número neste cartão”
   - **1 bandeira** → pré-selecionar `cartao_bandeira_id` e **não exibir** o campo
   - **2+ bandeiras** → select obrigatório “Bandeira da fatura”
4. Enviar sempre `cartao_id` + `cartao_bandeira_id` no `POST /cadastrar`

### Tela de listagem

1. Filtros: cartão (grupo), bandeira (opcional), mês, ano, status, busca
2. Para cada grupo da página:
   - Cabeçalho com chip (`background: cor_fundo; color: cor_texto`), nome, “Fecha dia X · Vence dia Y”
   - Subtotal do grupo
   - Cards/linhas das faturas **sem** expandir compras:
     - Badge da **bandeira** (sempre útil; obrigatório visualmente se o grupo tem mais de uma)
     - Competência (`08/2026`)
     - Período: `06/07/2026 – 05/08/2026`
     - Vencimento
     - Valor total
     - Status (badge)
     - Contador “N lançamentos” (`total_transacoes`) — só número
     - Ícone se `tem_pdf`
3. Clique na fatura → tela/drawer de detalhe
4. Ações na linha: upload PDF, processar, excluir, ver PDF

### Tela de detalhe (view) — cabeçalho

Layout em duas faixas principais (destaque visual):

```
[chip] PICPAY                         Competência
       Mastercard                     06/2026
──────────────────────────── <hr> ────────────────────────────
Ciclo · Vencimento · Status · …     [fundo claro]
                                    Total da fatura
                                    R$ 2.271,47
```

1. **Linha 1 (destaque):**
   - Esquerda: chip grande com `cor_fundo`/`cor_texto` + nome do cartão (grupo) em tipografia grande + badge da **bandeira**
   - Direita: label “Competência” + valor (`06/2026`) em tipografia grande
2. **`<hr>`** separando a faixa de identidade da faixa de resumo
3. **Linha 2:**
   - Esquerda: ciclo (`periodo_inicio`–`periodo_fim`), vencimento, status, lançamentos, processado em
   - Direita: **Total da fatura** em destaque, com fundo claro (`bg-light`) e valor em `text-primary` (maior que o restante)
4. Ações (Voltar / Editar / Reprocessar), upload PDF e blocos de categorias/gráficos abaixo
5. **Só aqui** carregar transações via `GET /transacoes/listar?fatura_id=`  
   (a API já ordena por `ultimos_digitos` asc → `data` asc quando `fatura_id` é informado)
6. **Agrupar a exibição** — preferir `grupos_por_cartao` do `GET /faturas/listar/{id}` para cabeçalhos/subtotais; as linhas vêm de `/transacoes/listar`. Incluir grupos locais:

| Grupo | Quando |
|-------|--------|
| `•••• 7025 · LEONARDO S FERREIRA` | Transações com `cartao_numero_id` / `ultimos_digitos` |
| Sem cartão identificado | Compra sem final (`cartao_numero_id` null), **exceto** operacionais |
| **Operacionais** | Pagamento de fatura — ver regra abaixo |

```json
"grupos_por_cartao": [
  {
    "cartao_numero_id": 10,
    "ultimos_digitos": "7025",
    "tipo": "fisico",
    "apelido": null,
    "nome_no_cartao": "LEONARDO S FERREIRA",
    "label": "•••• 7025 · LEONARDO S FERREIRA",
    "total_transacoes": 1,
    "valor_total": 1530.27
  },
  {
    "cartao_numero_id": 11,
    "ultimos_digitos": "7033",
    "tipo": "fisico",
    "apelido": null,
    "nome_no_cartao": "LEONARDO S FERREIRA",
    "label": "•••• 7033 · LEONARDO S FERREIRA",
    "total_transacoes": 6,
    "valor_total": 1081.47
  },
  {
    "cartao_numero_id": null,
    "ultimos_digitos": null,
    "label": "Sem cartão identificado",
    "total_transacoes": 1,
    "valor_total": 15.0
  }
]
```

UI sugerida dos grupos:

```
•••• 7025 · LEONARDO S FERREIRA    subtotal R$ …
  01/06  MP *ALIEXPRESS …

•••• 7033 · LEONARDO S FERREIRA    subtotal R$ …
  06/06  AMAZON …

Sem cartão identificado            subtotal R$ …
  [linha extra: select Final do cartão]
  04/08  Estabelecimento  R$ 15,00

Operacionais                       subtotal R$ …
  11/05  PAGAMENTO DE FATURA  -1.530,27
```

**Ordem dos grupos:** finais por `ultimos_digitos` asc → “Sem cartão identificado” → “Operacionais”.

Cada linha de transação traz `cartao_numero_id`, `ultimos_digitos`, `cartao_numero_tipo`, `cartao_numero_apelido`, `cartao_numero_nome_no_cartao`.
Filtro opcional na view: `GET /transacoes/listar?fatura_id=&cartao_numero_id=` ou `&ultimos_digitos=1234`.
Ao **adicionar compra** nesta tela: select de final via `GET /cartoes/numeros-list?fatura_id=` (só finais da bandeira da fatura) e enviar `cartao_numero_id`.

### Grupo Operacionais (pagamento de fatura)

Pagamentos de fatura **não pertencem a um final específico** — quitam a fatura como um todo.

Critério (qualquer um):

- `tipo === 'payment'`, ou
- `origem_compra === 'PAGAMENTO_FATURA'`, ou
- nome do estabelecimento contendo “PAGAMENTO DE FATURA” / “PAGAMENTO FATURA”

Regras:

1. Agrupar em seção exclusiva com título **Operacionais**
2. **Não** exibir select de final nessas linhas
3. Não misturar com “Sem cartão identificado” nem com um final do PDF (mesmo que o import tenha colocado sob um cartão)

### Atribuir / corrigir final — só em “Sem cartão identificado”

Nem sempre o final vem preenchido no create/import (PDF sem cabeçalho de cartão, linha legada, etc.). Nessas linhas `cartao_numero_id` fica `null` e elas caem em **“Sem cartão identificado”** (desde que não sejam operacionais).

**Grupos que já têm final** (ex.: `•••• 7025 · LEONARDO S FERREIRA`): uma linha só, com os campos padrão (data, estabelecimento, valor, origem, categoria…). **Sem** select de final.

**Grupo “Sem cartão identificado”:** cada transação usa **duas linhas**:

1. **Linha de cima** — select “Final do cartão” (`GET /cartoes/numeros-list?fatura_id=`)
2. **Linha de baixo** — campos padrão que já existiam

Salvar com:

```http
PUT /api/v1/transacoes/editar
```

```json
{
  "id": 123,
  "cartao_numero_id": 10
}
```

**Não redistribuir de imediato:** após salvar o final, a linha **permanece** em “Sem cartão identificado” com o select preenchido (estado local). A redistribuição para o grupo do final só ocorre quando o usuário **atualiza a tela** (reload / refetch completo). Isso evita perder o contexto de qual linha acabou de ser editada.

Outras regras:

1. No formulário global de **editar** transação, o select Final fica sempre visível (mesmo com 1 final).
2. Label sugerido: `•••• 7025 · LEONARDO S FERREIRA` (usar `label` / `nome_no_cartao` da API).
3. Se a compra for parcelada (`compra_grupo_id`):
   - default: alterar **só esta parcela**;
   - oferecer “Aplicar a todas as parcelas” → `propagar_grupo: true` (também sem redistribuir até refresh).
4. Permitir limpar o final (`cartao_numero_id: null`) só se fizer sentido na UI.

> O backend já aceita `cartao_numero_id` no `PUT /transacoes/editar` e valida que o final pertence à bandeira da fatura.

### Empty states

- Sem cartões com fatura → CTA para cadastrar compra ou importar PDF
- Cartão sem fatura no filtro de mês/ano → mensagem “Nenhuma fatura neste período”

---

## Checklist de aceite

- [ ] Listagem agrupa por cartão/grupo (não lista plana de faturas)
- [ ] Cada fatura exibe a bandeira (`bandeira` / `cartao_bandeira_id`)
- [ ] Cadastro: select de bandeira **só** quando o cartão tem mais de uma
- [ ] Cadastro: com 1 bandeira, envia `cartao_bandeira_id` automaticamente
- [ ] Transações **não** aparecem na listagem
- [ ] Detalhe: cabeçalho com cartão/bandeira à esquerda e competência à direita (destaque)
- [ ] Detalhe: `<hr>` + linha com ciclo/status e **total** em destaque (`bg-light` + `text-primary`) à direita
- [ ] Detalhe usa `grupos_por_cartao` + lista agrupada por final (`nome_no_cartao` no label)
- [ ] Grupo “Sem cartão identificado” para compras sem `cartao_numero_id` (não operacionais)
- [ ] Grupo **Operacionais** para pagamentos de fatura (sem select de final)
- [ ] Select de final **somente** no grupo “Sem cartão identificado” (duas linhas por transação)
- [ ] Grupos com final já definido: uma linha, sem select de final
- [ ] Após salvar o final, a linha **não muda de grupo** até o usuário atualizar a tela
- [ ] Parceladas: opção de propagar o final com `propagar_grupo: true`
- [ ] Cadastro de compra na fatura envia `cartao_numero_id`
- [ ] Chip usa `cor_fundo` + `cor_texto`
- [ ] Ordenação: competência → cartão → status
- [ ] Paginação trata `perPage` como quantidade de **faturas** (resposta agrupada por cartão)
- [ ] Detalhe busca transações só sob demanda (`fatura_id`)
- [ ] Filtros `cartao_id`, `mes`, `ano`, `status` funcionam
- [ ] Upload/processamento de PDF continua acessível a partir da fatura
