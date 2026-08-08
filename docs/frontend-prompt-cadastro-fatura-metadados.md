# Prompt — Frontend: Cadastro de fatura com detecção de cartão / mês / ano pelo anexo

Use este prompt no repositório do frontend para alinhar o **cadastro de fatura** à API do `controle_fatura_back`.

Complementa [`frontend-prompt-faturas.md`](frontend-prompt-faturas.md) e o modal de senha em [`frontend-prompt-senha-pdf-fatura.md`](frontend-prompt-senha-pdf-fatura.md).

---

## Objetivo

Simplificar o cadastro:

1. **Nada é obrigatório de cara** (nem cartão, mês, ano, nem anexo).
2. **Sem anexo** → cartão + mês + ano passam a ser **obrigatórios** (validação no front e no back).
3. **Com anexo (PDF/CSV)** → cartão + mês + ano **não** são obrigatórios no formulário inicial.
4. Se o back **conseguir ler** cartão/mês/ano do arquivo → abrir **modal de confirmação** com os valores sugeridos.
5. No mesmo modal, se o cartão **não tiver bandeira cadastrada** (ou tiver mais de uma), **pedir a bandeira**.
6. Se o cartão **não foi encontrado** (`cartao_id` null), o modal oferece **cadastrar o cartão ali mesmo** (nome + bandeira) — sem sair da tela nem reanexar o arquivo.
7. Após confirmar, reenviar o `POST /cadastrar` (multipart) com os campos escolhidos + o mesmo arquivo.

---

## Regras de formulário

| Situação | Cartão | Mês | Ano | Anexo |
|----------|--------|-----|-----|-------|
| Formulário inicial | opcional | opcional | opcional | opcional |
| Submit **sem** anexo | **obrigatório** | **obrigatório** | **obrigatório** | — |
| Submit **com** anexo | opcional* | opcional* | opcional* | obrigatório para este fluxo |

\* Se o back não conseguir detectar, ele devolve 422 pedindo preenchimento manual — aí o front exige os três campos.

UI sugerida:

1. Dropzone / input de arquivo em destaque (PDF ou CSV).
2. Abaixo (ou colapsado): selects de cartão, mês e ano — úteis quando não há anexo ou para ajuste manual.
3. Botão “Cadastrar”.

---

## Fluxo completo

```
[Usuário escolhe PDF/CSV] ──► POST /api/v1/faturas/cadastrar
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            422 senha PDF    422 metadados      200 sucesso
            (precisa_senha)  (confirmar)        (ou outros 422)
                    │                 │
                    ▼                 ▼
            Modal senha         Modal confirmação
            (senha_pdf)         (cartão/mês/ano/bandeira)
                    │                 │
                    └────────┬────────┘
                             ▼
                    Reenviar multipart completo
```

Ordem de prioridade dos modais (se vierem em sequência):

1. **Senha do PDF** (`precisa_senha_pdf`) — sem texto não há detecção.
2. **Confirmar metadados** (`precisa_confirmar_metadados`).
3. Modais já existentes: `precisa_selecionar_bandeira` / `precisa_selecionar_final` (cartão sem finais).
4. Sucesso.

---

## API

```http
POST /api/v1/faturas/cadastrar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Request — só anexo (fluxo novo)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `arquivo_pdf` | file (PDF/CSV) | sim neste fluxo |
| `processar_automatico` | bool | não (default `true`) |
| `senha_pdf` | string | se PDF protegido |
| `salvar_senha_pdf` | bool | não |

### Request — sem anexo (igual ao legado)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `cartao_id` | int | **sim** |
| `mes` | int 1–12 | **sim** |
| `ano` | int | **sim** |
| `cartao_bandeira_id` | int | se cartão tem 2+ bandeiras |

### Request — retry do modal de metadados

Reenviar **tudo** do formulário + arquivo + campos confirmados:

| Campo | Tipo | Notas |
|-------|------|-------|
| `arquivo_pdf` | file | **mesmo arquivo** (input file de novo) |
| `cartao_id` | int | do select (pré-preenchido com `sugestao.cartao_id`) — omitir se for criar cartão novo |
| `cartao_nome` | string | **cria o cartão no mesmo POST** quando não há `cartao_id` (ex.: `"C6"`) |
| `mes` | int | pré-preenchido com `sugestao.mes` |
| `ano` | int | pré-preenchido com `sugestao.ano` |
| `cartao_bandeira_id` | int | se item de `bandeiras[]` tem `value` numérico |
| `bandeira` | string | se item tem `criar: true` (ex.: `"Visa"`) — **obrigatório** junto com `cartao_nome` |
| `senha_pdf` | string | se já pediu senha antes |
| `salvar_senha_pdf` | bool | se marcou no modal de senha |

Quando vier `cartao_nome` + `bandeira` (sem `cartao_id`), o back deve criar o grupo de cartão + bandeira e cadastrar a fatura no mesmo request.

---

## Modal — confirmar metadados

Dispara em **422** com:

```json
{
  "error": true,
  "message": "Confirme o cartão, mês e ano identificados na fatura",
  "codigo": "precisa_confirmar_metadados",
  "precisa_confirmar_metadados": true,
  "precisa_selecionar_bandeira": true,
  "sugestao": {
    "cartao_id": 17,
    "cartao_nome": "C62",
    "mes": 7,
    "ano": 2026,
    "parser": "c6",
    "ultimos_digitos": ["0264", "2399"],
    "bandeira_sugerida": "Mastercard",
    "cartao_bandeira_id": 21,
    "valor_fatura": 157.92,
    "confianca": "alta"
  },
  "cartoes": [
    { "value": 17, "label": "C62", "banco": "XP2", "sugerido": true },
    { "value": 12, "label": "SOFISA", "banco": null }
  ],
  "bandeiras": [
    { "value": null, "label": "Visa", "criar": true },
    { "value": null, "label": "Mastercard", "criar": true }
  ],
  "candidatos_cartao": [
    {
      "id": 17,
      "nome": "C62",
      "banco": "XP2",
      "match": "ultimos_digitos",
      "ultimos_digitos": ["0264", "2399"]
    }
  ]
}
```

### Campos do modal

#### Quando há cartão sugerido (`sugestao.cartao_id` preenchido)

1. **Cartão** (select) — opções em `cartoes[]`; pré-selecionar `sugestao.cartao_id`. Itens com `sugerido: true` podem ter destaque. Incluir opção “Cadastrar novo cartão nesta tela”.
2. **Mês** / **Ano** — pré-preencher com `sugestao.mes` / `sugestao.ano` (editáveis).
3. **Bandeira** — exibir quando `precisa_selecionar_bandeira === true`:
   - `bandeiras[].value` numérico → enviar `cartao_bandeira_id`
   - `bandeiras[].criar === true` → enviar `bandeira` = `label`
   - Pré-selecionar por `sugestao.cartao_bandeira_id` ou `sugestao.bandeira_sugerida` (match no `label`)
4. Opcional: chip com finais detectados (`sugestao.ultimos_digitos`) e valor (`sugestao.valor_fatura`) só informativo.
5. Botões: **Cancelar** / **Confirmar e cadastrar**.

#### Quando **não** há cartão (`sugestao.cartao_id` null ou `confianca: baixa`)

Deixar **explícito** que o usuário pode cadastrar o cartão **no próprio modal** — sem sair da tela, sem cadastrar em outro lugar e sem reanexar o arquivo.

1. Texto claro: mês/ano foram lidos da fatura; o cartão ainda não está vinculado; dá para cadastrar aqui.
2. Alert de reforço: “Não precisa sair para cadastrar o cartão nem anexar o arquivo de novo.”
3. Campos visíveis:
   - **Mês** / **Ano** (pré-preenchidos)
   - **Nome do cartão** (texto; pré-preencher com `sugestao.cartao_nome` ou nome derivado do `parser`)
   - **Bandeira** (obrigatória; opções de `bandeiras[]` da resposta ou lookup de cartões)
4. Link secundário: “Já tenho este cartão cadastrado — escolher da lista” (volta ao select de `cartoes[]`).
5. Botão: **Cadastrar cartão e fatura** → envia `cartao_nome` + `bandeira` + `mes` + `ano` + arquivo (sem `cartao_id`).

### `confianca`

| Valor | Uso no UI |
|-------|-----------|
| `alta` | Match por final do cartão — pode destacar “identificado automaticamente” |
| `media` | Match por nome do banco/parser |
| `ambigua` | Vários cartões candidatos — obrigar escolha no select |
| `informado` | Usuário já tinha mandado `cartao_id` |
| `baixa` | Sem match de cartão — abrir modo **cadastrar novo cartão** (nome + bandeira) |

Se `sugestao.cartao_id` for `null`, **não** empurrar o usuário a sair do fluxo: abrir o formulário de novo cartão no modal.

### Troca de cartão no modal

Se o usuário mudar o cartão no select, o front pode:

- Recarregar bandeiras com `GET /api/v1/cartoes/bandeiras-list?cartao_id=`, **ou**
- Manter só as `bandeiras` da resposta e, ao trocar, buscar a lista de bandeiras do novo cartão.

Regra: se o cartão escolhido tiver **0 bandeiras** ou **2+**, o select de bandeira permanece obrigatório.

---

## Quando o back não detecta

```json
{
  "error": true,
  "message": "Não foi possível identificar cartão, mês e ano pelo arquivo. Informe esses campos manualmente."
}
```

Ação no front:

1. Mostrar toast/alerta com a mensagem.
2. Tornar **obrigatórios** cartão, mês e ano no formulário (mesmo com anexo).
3. Manter o arquivo selecionado.
4. Usuário preenche e reenvia.

---

## Senha de PDF (antes da detecção)

Se o PDF estiver protegido e a senha faltar/errar, o `POST /cadastrar` também pode devolver o mesmo contrato de senha do processamento:

```json
{
  "error": true,
  "codigo": "pdf_senha_necessaria",
  "precisa_senha_pdf": true,
  "senha_pdf": { "necessaria": true, "motivo": "ausente", "orientacao": "...", "...": "..." }
}
```

Fluxo:

1. Abrir modal de senha (ver prompt de senha).
2. Reenviar `arquivo_pdf` + `senha_pdf` (+ `salvar_senha_pdf` se marcado).
3. Em seguida pode vir o 422 de metadados — aí abrir o modal de confirmação.

---

## Checklist de aceite

- [ ] Formulário inicial: cartão/mês/ano/anexo **não** obrigatórios visualmente
- [ ] Submit sem anexo e sem cartão/mês/ano → validação front (e 422 do back)
- [ ] Submit só com PDF → pode abrir modal de metadados com sugestões
- [ ] Modal pré-preenche cartão, mês e ano; permite editar
- [ ] Sem cartão correspondente: modal mostra mês/ano + cadastro de cartão (nome + bandeira) na mesma tela
- [ ] Copy deixa claro que não precisa sair nem reanexar o arquivo
- [ ] Retry com cartão novo envia `cartao_nome` + `bandeira` (sem `cartao_id`)
- [ ] Se `precisa_selecionar_bandeira`, select de bandeira obrigatório no modal
- [ ] Bandeira com `criar: true` envia `bandeira` (label); com `value` envia `cartao_bandeira_id`
- [ ] Retry reenvia o **arquivo** + campos confirmados (multipart)
- [ ] PDF com senha: modal de senha **antes**; depois metadados se necessário
- [ ] Falha de detecção: mensagem clara + campos manuais obrigatórios, arquivo preservado
- [ ] Após sucesso: refetch da listagem de faturas
- [ ] Fluxos antigos (cartão/mês/ano já preenchidos + PDF) continuam funcionando sem abrir o modal de metadados

---

## Notas

- A competência sugerida vem do **fechamento/vencimento** do extrato (não recalcula `dia_limite_fatura`). O usuário pode ajustar mês/ano no modal.
- Match de cartão: prioriza **últimos 4 dígitos** já cadastrados; senão tenta nome/banco do parser (`c6`, `sofisa`, `nubank`…).
- Modais de bandeira/final para cartão **sem finais** (`precisa_selecionar_bandeira` / `precisa_selecionar_final`) continuam valendo no retry se ainda faltarem dados — idealmente o modal de metadados já envia a bandeira e evita o segundo passo.
