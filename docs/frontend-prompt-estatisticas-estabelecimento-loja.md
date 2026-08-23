# Prompt — Frontend: Estatísticas de estabelecimento e loja

Use este prompt no repositório do frontend (`controle_fatura_front`) para mostrar **quanto e com que frequência** o usuário compra em cada estabelecimento (maquininha) e na **loja** (nome fantasia) que agrupa várias máquinas.

Backend já implementado. Não recalcular métricas no front — só exibir.

Relacionado: [`frontend-prompt-loja-estabelecimento.md`](frontend-prompt-loja-estabelecimento.md) · [`modules/estabelecimentos.md`](modules/estabelecimentos.md) · [`modules/lojas.md`](modules/lojas.md)

---

## Objetivo

O mesmo estabelecimento aparece em várias faturas (e várias vezes na mesma). A tela responde:

- Quantas **compras** já foram feitas ali (visitas / pedidos — parcelado conta **1**)
- Quantos **lançamentos** nas faturas (`ocorrencias`)
- Qual o **total gasto**
- Qual a **frequência**: “no período você comprou 20 vezes → **1 vez a cada 3 dias**”
- Taxas equivalentes por dia / semana / mês / ano
- Na **loja**: os mesmos números **por estabelecimento** + **total geral**

Perguntas que a tela responde:

- Quanto eu já gastei no Atacadão (todas as maquininhas)?
- Qual máquina desse Atacadão eu mais uso?
- Se eu comprei 20 vezes no período, isso é como **1 vez a cada X dias**?

---

## Conceitos

| Termo | Significado |
|-------|-------------|
| Estabelecimento | Identificador da maquininha (`atacadao152145`) |
| Loja | Nome fantasia (`Atacadão`) — 1 loja : N estabelecimentos |
| `compras` | Eventos de compra. Parcelado (`compra_grupo_id`) = **1**. À vista = 1 linha |
| `ocorrencias` | Linhas `purchase` nas faturas (12 parcelas = 12 ocorrências, 1 compra) |
| `valor_total` | Soma do valor das parcelas/compras no período (pela **data da compra**, não o mês da fatura) |
| `ticket_medio` | `valor_total / compras` |
| Frequência | `intervalo_medio_dias = dias_do_período / compras` → label “1 vez a cada X dias” |

Não misturar com cores do cartão/bandeira. Filtro de período usa a **data da compra**.

Totais da loja **não** são média das frequências — são a **soma** das compras de todas as máquinas no mesmo período. A frequência da loja é recalculada pelo back sobre essa soma.

---

## Estado atual do front

Já existem CRUDs, sem estatísticas:

| Tela | Arquivos | O que falta |
|------|----------|-------------|
| Listagem estabelecimentos | `src/pages/Pages/Estabelecimentos/` | Colunas de compras / gasto / frequência + filtro de período |
| Form estabelecimento | `EstabelecimentosForm` | Nada de stats (form continua só cadastro) |
| Listagem lojas | `src/pages/Pages/Lojas/` | Colunas de stats + filtro de período |
| Form loja | `LojasForm` | Lista de vínculos sem compras/gasto/frequência |
| View | — | **Não existe** view de estabelecimento nem de loja |

Rotas atuais (`src/Routes/allRoutes.tsx`):

```
/estabelecimentos
/estabelecimentos/add
/estabelecimentos/edit/:id
/lojas
/lojas/add
/lojas/edit/:id
```

Services ainda não chamam `/estatisticas/{id}`. Interfaces não têm `estatisticas`.

---

## APIs (Bearer Sanctum)

Base: `/api/v1`

### Período (query, todos os endpoints abaixo)

| Param | Efeito |
|-------|--------|
| *(omitido)* | Histórico: primeira compra → **hoje** |
| `data_inicio` / `data_fim` | Janela explícita (`Y-m-d`) |
| `mes` + `ano` | Aquele mês calendário (ex.: `mes=8&ano=2026`) |

Se `mes` **e** `ano` existirem, o back usa o mês. Senão, usa as datas. Se nada vier, usa o histórico.

Enviar só o modo ativo. Não mandar `mes`/`ano` junto com `data_inicio`/`data_fim`.

### Estabelecimento

```http
GET /api/v1/estabelecimentos/listar?data_inicio=2026-01-01&data_fim=2026-08-22
GET /api/v1/estabelecimentos/listar/{id}?mes=8&ano=2026
GET /api/v1/estabelecimentos/estatisticas/{id}?mes=8&ano=2026
```

`listar` e `listar/{id}` já vêm com `estatisticas`. O endpoint `/estatisticas/{id}` é o mesmo bloco, envelopado em `{ data, status, message }` — usar no detalhe / view.

### Loja

```http
GET /api/v1/lojas/listar
GET /api/v1/lojas/listar/{id}?data_inicio=&data_fim=
GET /api/v1/lojas/estatisticas/{id}
```

`listar/{id}` e `/estatisticas/{id}` trazem **totais da loja** + `estabelecimentos[]` cada um com as mesmas métricas.

---

## Shape de `estatisticas`

```json
{
  "periodo": {
    "inicio": "2026-01-01",
    "fim": "2026-08-22",
    "origem": "filtro",
    "dias": 234
  },
  "compras": 20,
  "ocorrencias": 24,
  "valor_total": 3450.5,
  "ticket_medio": 172.53,
  "primeira_compra": "2026-01-05",
  "ultima_compra": "2026-08-10",
  "dias_desde_ultima": 12,
  "frequencia": {
    "periodo_dias": 234,
    "compras": 20,
    "intervalo_medio_dias": 11.7,
    "label": "1 vez a cada 12 dias",
    "por_dia": 0.0855,
    "por_semana": 0.6,
    "por_mes": 2.6,
    "por_ano": 31.21
  }
}
```

Na **listagem**, `estatisticas` pode vir **sem** `periodo` (só o bloco a partir de `compras`). `frequencia.periodo_dias` e `frequencia.label` bastam.

`origem` do período: `historico` | `filtro` | `mes`.

Labels prontos (usar `frequencia.label`, **não recalcular**):

- `Nenhuma compra no período`
- `1 compra no período`
- `1 vez por dia` / `1 vez por semana` / `1 vez por mês`
- `1 vez a cada 2 semanas` / `1 vez a cada 2 meses`
- `1 vez a cada 3 dias` (genérico)

---

## Resposta loja (`/estatisticas/{id}` ou `listar/{id}`)

```json
{
  "loja_id": 3,
  "nome": "Atacadão",
  "estabelecimentos_count": 2,
  "compras": 35,
  "ocorrencias": 40,
  "valor_total": 8900.0,
  "ticket_medio": 254.29,
  "frequencia": { "label": "1 vez a cada 6 dias", "por_mes": 5.0 },
  "estabelecimentos": [
    {
      "id": 12,
      "nome": "atacadao152145",
      "ativo": true,
      "compras": 20,
      "valor_total": 5000.0,
      "frequencia": { "label": "1 vez a cada 12 dias" }
    },
    {
      "id": 45,
      "nome": "atacadai4555",
      "compras": 15,
      "valor_total": 3900.0,
      "frequencia": { "label": "1 vez a cada 16 dias" }
    }
  ]
}
```

O detalhe da loja também pode trazer o bloco `estatisticas` completo (com `periodo`, `ticket_medio`, `por_*`) no root e/ou em cada item de `estabelecimentos[]`. Tipar de forma permissiva: métricas no root **ou** em `estatisticas`.

---

## Interfaces TypeScript

Criar tipos compartilhados (pode viver em `src/interfaces/Estatisticas/EstatisticasCompraInterface.ts` ou no próprio arquivo de Estabelecimentos/Lojas, reexportando).

```ts
export type PeriodoOrigem = 'historico' | 'filtro' | 'mes'

export interface EstatisticasPeriodo {
  inicio?: string | null
  fim?: string | null
  origem?: PeriodoOrigem
  dias?: number
}

export interface EstatisticasFrequencia {
  periodo_dias?: number
  compras?: number
  intervalo_medio_dias?: number | null
  label?: string
  por_dia?: number
  por_semana?: number
  por_mes?: number
  por_ano?: number
}

export interface EstatisticasCompra {
  periodo?: EstatisticasPeriodo
  compras?: number
  ocorrencias?: number
  valor_total?: number
  ticket_medio?: number | null
  primeira_compra?: string | null
  ultima_compra?: string | null
  dias_desde_ultima?: number | null
  frequencia?: EstatisticasFrequencia
}

export type PeriodoModo = 'historico' | 'mes' | 'intervalo'

export interface PeriodoFiltro {
  periodo_modo?: PeriodoModo
  mes?: number | string | null
  ano?: number | string | null
  data_inicio?: string | null
  data_fim?: string | null
}
```

Estender as interfaces existentes:

```ts
// EstabelecimentosSearch & LojasSearch
& PeriodoFiltro

// EstabelecimentosList / EstabelecimentosView
estatisticas?: EstatisticasCompra

// LojasList
estatisticas?: EstatisticasCompra
compras?: number
valor_total?: number
frequencia?: EstatisticasFrequencia

// LojaEstabelecimentoVinculo
compras?: number
ocorrencias?: number
valor_total?: number
ticket_medio?: number | null
frequencia?: EstatisticasFrequencia
estatisticas?: EstatisticasCompra

// LojasView
estatisticas?: EstatisticasCompra
compras?: number
ocorrencias?: number
valor_total?: number
ticket_medio?: number | null
frequencia?: EstatisticasFrequencia
primeira_compra?: string | null
ultima_compra?: string | null
```

Helper de query (não mandar campos vazios):

```ts
function periodoToQuery(f: PeriodoFiltro): Record<string, string | number> {
  if (f.periodo_modo === 'mes' && f.mes && f.ano) return { mes: f.mes, ano: f.ano }
  if (f.periodo_modo === 'intervalo' && (f.data_inicio || f.data_fim)) {
    return {
      ...(f.data_inicio ? { data_inicio: f.data_inicio } : {}),
      ...(f.data_fim ? { data_fim: f.data_fim } : {}),
    }
  }
  return {}
}
```

---

## Services

### `EstabelecimentosService`

- `listEstabelecimentosPaginate` e `getViewEstabelecimentos` já passam `body`/`params` — incluir o período.
- Novo método:

```ts
getEstatisticasEstabelecimento(
  id: number | string,
  periodo?: PeriodoFiltro
): Promise<EstatisticasCompra>
```

```http
GET estabelecimentos/estatisticas/{id}
```

Desembrulhar `{ data }` / `{ estabelecimento: { data } }` como os outros endpoints.

### `LojasService`

- `listLojasPaginate` e `getViewLojas` recebem o período.
- Novo método:

```ts
getEstatisticasLoja(
  id: number | string,
  periodo?: PeriodoFiltro
): Promise<LojasView>
```

```http
GET lojas/estatisticas/{id}
```

Atualizar `EstabelecimentosInterface` e `LojasInterface` com os novos métodos.

---

## UX — filtro de período (comum)

Controles no **collapse de Filtros** de Estabelecimentos e Lojas (e no topo das views). Reusar `mesesOptions` de `helpers/fatura_helpers`.

Três modos (radio / segmented / select):

1. **Todo o histórico** (default) — nenhum param de data
2. **Mês** — selects mês + ano (mesmo padrão de `FaturasFilter`)
3. **Intervalo** — `data_inicio` / `data_fim` (`type="date"`)

Ao mudar e clicar Buscar, refetch com a query correspondente.

Nas **views**, o mesmo filtro no topo: ao mudar, refetch de `/estatisticas/{id}` (ou `listar/{id}`) **sem recarregar o cadastro**.

Mostrar o período aplicado quando a API devolver `estatisticas.periodo`:

```
01/01/2026 → 22/08/2026 · 234 dias · histórico
```

`origem`: `historico` → “histórico”; `filtro` → “intervalo”; `mes` → “mês”.

---

## UX — listagem de estabelecimentos

Arquivo: `src/pages/Pages/Estabelecimentos/EstabelecimentosTable/EstabelecimentosTable.tsx`

Manter Nome, Loja, Categoria, Subcategoria, Ativo, Ações. Acrescentar colunas:

| Coluna | Campo | Formato |
|--------|-------|---------|
| Compras | `estatisticas.compras` | `20` (ou `20 compras` no title) |
| Gasto | `estatisticas.valor_total` | `formatCurrency` (`helpers/fatura_helpers`) |
| Frequência | `estatisticas.frequencia.label` | texto em destaque (`fw-medium`) |

Extra discreto (title / linha secundária muted):

```
24 lançamentos · ticket R$ 172,53
```

`compras === 0` (ou `estatisticas` ausente): mostrar `0` / `R$ 0,00` / `Nenhuma compra no período` — **não esconder** o cadastro.

Ações (`TableActionsDropdown`):

- **Visualizar** → `/estabelecimentos/view/:id` (passar `state.source` + período atual)
- Editar / Excluir (já existem)

---

## UX — detalhe do estabelecimento (obrigatório)

Criar `src/pages/Pages/Estabelecimentos/EstabelecimentosView/EstabelecimentosView.tsx`  
Rota: `/estabelecimentos/view/:id`  
Espelhar `CartoesView` / `FaturasView` (somente leitura).

Carregar:

1. Cadastro: `GET /estabelecimentos/listar/{id}` (nome, loja, categoria, ativo)
2. Stats: o bloco `estatisticas` desse payload **ou** `GET /estabelecimentos/estatisticas/{id}` com o período da query/state

Cabeçalho: nome da maquininha + `loja_nome` clicável → `/lojas/view/:loja_id` (mesmo período).

Cards:

1. **Compras** — `compras` + sub “`ocorrencias` lançamentos”
2. **Total gasto** — `formatCurrency(valor_total)` + sub “ticket médio `formatCurrency(ticket_medio)`”
3. **Frequência** — título = `frequencia.label`  
   Sub: “20 compras em 234 dias”
4. Grade 4 colunas: por dia / semana / mês / ano (`por_*`)
5. Primeira / última compra (`formatDateBr`) · “há X dias” (`dias_desde_ultima`)

Frase modelo (obrigatória quando `compras > 1`):

> No período você comprou **20 vezes**. Isso equivale a **1 vez a cada 12 dias** (~2,6× por mês).

Montar com `estatisticas.compras` + `frequencia.label` + `frequencia.por_mes` (não recalcular o intervalo).

`compras === 0`: card “Sem compras neste período”; esconder a frase e a grade de taxas (ou zerar).

`compras === 1`: usar o `label` do back (`1 compra no período`); não forçar “1 vez a cada…”.

---

## UX — listagem de lojas

Arquivo: `src/pages/Pages/Lojas/LojasTable/LojasTable.tsx`

Manter Nome, Estabelecimentos (`estabelecimentos_count`), Ativo, Ações. Acrescentar:

| Coluna | Campo |
|--------|-------|
| Compras | `estatisticas.compras` (ou `compras` no root) |
| Gasto | `estatisticas.valor_total` |
| Frequência | `estatisticas.frequencia.label` |

Ações: **Visualizar** → `/lojas/view/:id` + Editar / Excluir.

---

## UX — detalhe da loja (obrigatório)

Criar `src/pages/Pages/Lojas/LojasView/LojasView.tsx`  
Rota: `/lojas/view/:id`

Esta é a tela que amarra o pedido: **totais da loja** + **cada estabelecimento** + **total geral**.

### Cabeçalho

Mesmos cards do estabelecimento, com os totais da loja (`compras`, `valor_total`, `frequencia.label`, taxas `por_*`).

Frase:

> No período você comprou **35 vezes** no Atacadão. Isso equivale a **1 vez a cada 6 dias** (~5× por mês).

### Tabela dos estabelecimentos vinculados

| Estabelecimento | Compras | Gasto | Frequência | Ativo |
|-----------------|---------|-------|------------|-------|
| atacadao152145 | 20 | R$ 5.000,00 | 1 vez a cada 12 dias | Ativo |
| atacadai4555 | 15 | R$ 3.900,00 | 1 vez a cada 16 dias | Ativo |
| **Total Atacadão** | **35** | **R$ 8.900,00** | **1 vez a cada 6 dias** | — |

Rodapé **Total** usa os totais da loja (API), não `reduce` das linhas — as linhas podem vir incompletas.

Clique na linha → `/estabelecimentos/view/:id` **com o mesmo período** na query/state.

Estabelecimento sem compra no período: permanece na tabela com zeros + label do back.

O form `LojasForm` **não** precisa virar dashboard. No máximo, um link “Ver estatísticas” para a view. Stats completas ficam na view.

---

## Componente compartilhado

Criar `src/Components/Estatisticas/EstatisticasCompraCards.tsx` (ou sob `Estabelecimentos/`) para não duplicar os 3 cards + grade + frase.

Props:

```ts
{
  estatisticas?: EstatisticasCompra
  tituloFrequencia?: string  // default: estatisticas.frequencia.label
  nomeLocal?: string         // "Atacadão" / "atacadao152145" na frase
}
```

Formatação:

- Moeda: `formatCurrency`
- Data: `formatDateBr`
- Taxa: `0.0855` → `0,09×/dia`; `2.6` → `2,6×/mês` (`toLocaleString('pt-BR', { maximumFractionDigits: 2 })`)
- Não formatar `frequencia.label`

---

## Rotas e menu

Em `src/Routes/allRoutes.tsx`:

```tsx
{ path: "/estabelecimentos/view/:id", component: <EstabelecimentosView /> },
{ path: "/lojas/view/:id", component: <LojasView /> },
```

Menu em `LayoutMenuData.tsx` já tem Estabelecimentos e Lojas — sem item novo.

`setActiveMenu('/estabelecimentos')` / `setActiveMenu('/lojas')` nas views.

---

## Arquivos a tocar

| Arquivo | Ação |
|---------|------|
| `src/interfaces/Estabelecimentos/EstabelecimentosInterface.ts` | `estatisticas` + período no search + método no contract |
| `src/interfaces/Lojas/LojasInterface.ts` | idem + métricas no vínculo e na view |
| `src/interfaces/Estatisticas/EstatisticasCompraInterface.ts` | **criar** tipos + `periodoToQuery` |
| `src/services/Estabelecimentos/EstabelecimentosService.ts` | período no list/view + `getEstatisticasEstabelecimento` |
| `src/services/Lojas/LojasService.ts` | período no list/view + `getEstatisticasLoja` |
| `src/pages/Pages/Estabelecimentos/EstabelecimentosFilter/EstabelecimentosFilter.tsx` | modos histórico / mês / intervalo |
| `src/pages/Pages/Estabelecimentos/EstabelecimentosPage.tsx` | persistir período no context e no GET |
| `src/pages/Pages/Estabelecimentos/EstabelecimentosTable/EstabelecimentosTable.tsx` | colunas + Visualizar |
| `src/pages/Pages/Estabelecimentos/EstabelecimentosView/EstabelecimentosView.tsx` | **criar** |
| `src/pages/Pages/Lojas/LojasFilter/LojasFilter.tsx` | mesmo filtro de período |
| `src/pages/Pages/Lojas/LojasPage.tsx` | persistir período |
| `src/pages/Pages/Lojas/LojasTable/LojasTable.tsx` | colunas + Visualizar |
| `src/pages/Pages/Lojas/LojasView/LojasView.tsx` | **criar** (totais + tabela de estabelecimentos) |
| `src/Components/Estatisticas/EstatisticasCompraCards.tsx` | **criar** |
| `src/Routes/allRoutes.tsx` | 2 rotas de view |
| `src/helpers/fatura_helpers.ts` | só reusar `formatCurrency`, `formatDateBr`, `mesesOptions` |

Não alterar o modal de vincular loja, o cadastro rápido nem o fluxo de compras.

---

## Regras

| Regra | Detalhe |
|-------|---------|
| Fonte da verdade | Back calcula; front só renderiza |
| Label | Sempre `frequencia.label` |
| Parcelado | 1 compra, N ocorrências — mostrar os dois |
| Período | Data da compra, não competência da fatura |
| Total da loja | Soma das máquinas (API); não média dos labels |
| Zero | Cadastro continua visível |
| Moeda | BRL via `formatCurrency` |
| Ações | `TableActionsDropdown` (não montar dropdown na mão) |
| Query | Só enviar o modo ativo; omitir vazios |

---

## Critérios de aceite

- [ ] Listagem de estabelecimento mostra qtd de compras, total gasto e label de frequência
- [ ] Detalhe explica “N compras no período = 1 vez a cada X dias” + taxas dia/semana/mês/ano
- [ ] Filtro histórico / mês / intervalo refetch (listagem e view)
- [ ] Parcelado conta 1 compra; ocorrências mostram os lançamentos
- [ ] Loja lista cada estabelecimento + total geral (soma da API, não média das labels)
- [ ] Clique no estabelecimento da loja abre o detalhe com o **mesmo período**
- [ ] Zero compras no período não quebra o layout nem esconde o cadastro
- [ ] Moeda BRL; não recalcular o `label` no front
- [ ] Ação Visualizar nas duas tabelas; rotas `/estabelecimentos/view/:id` e `/lojas/view/:id`

---

## Fora de escopo

- Editar compra a partir desta tela
- Frequência por fatura (competência) — o back usa data da compra
- Ranking global de estabelecimentos (pode vir depois com os mesmos campos da listagem)
- Gráfico de evolução / heatmap
- Recalcular frequência no cliente
- Transformar `LojasForm` em dashboard

---

## Backend

```http
GET /api/v1/estabelecimentos/estatisticas/{id}
GET /api/v1/lojas/estatisticas/{id}
```

Service: `App\Services\Estabelecimento\EstabelecimentoEstatisticasService`  
Specs: [`docs/modules/estabelecimentos.md`](modules/estabelecimentos.md) · [`docs/modules/lojas.md`](modules/lojas.md)
