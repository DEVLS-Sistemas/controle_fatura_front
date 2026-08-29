# Controle de Faturas — Frontend

Aplicação React (Velzon + TypeScript + reactstrap) para gestão de faturas de cartão de crédito.

## Stack

- React 18 + TypeScript (CRA)
- React Router 6
- React Hook Form
- Axios (`AxiosHttpClient` em `src/libs/api/ApiConfig.ts`)
- Reactstrap / Bootstrap 5 (tema Velzon)
- ApexCharts (dashboard)
- React Toastify (feedback)

> O projeto segue os padrões de `docs/frontend-patterns.md` e `docs/crud-base-template.md` (estrutura Page / Filter / Table / Form + Service + Interface).

## Pré-requisitos

1. Backend rodando em `http://127.0.0.1:5000` (veja README do `controle_fatura_back`)
2. Node.js 18+

## Setup

```bash
cp .env.example .env
# Ajuste REACT_APP_API_URL se necessário
npm install
npm start
```

A aplicação sobe em `http://localhost:3000`.

### Variáveis de ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `REACT_APP_API_URL` | Base da API (com `/api/v1/`) | Dev: `http://127.0.0.1:5000/api/v1/` · Prod: `https://api-faturas.devls.com.br/api/v1/` |

## Login demo

Com o seeder do backend:

- **E-mail:** `demo@demo.com`
- **Senha:** `123456`

Ou use **Register** — categorias e responsáveis padrão são criados automaticamente.

## Módulos

| Rota | Descrição |
|------|-----------|
| `/login`, `/register` | Autenticação Sanctum (Bearer) |
| `/dashboard` | Cards de resumo + gráficos |
| `/cartoes` | CRUD de cartões |
| `/faturas` | CRUD + upload PDF + detalhe com PDF e transações |
| `/transacoes` | Listagem com filtros, edição inline de categoria/responsável, export CSV |
| `/categorias` | CRUD de categorias |
| `/responsaveis` | CRUD de responsáveis (pessoal/empresa) |

## Estrutura de pastas (feature)

```
src/
  interfaces/{Modulo}/
  services/{Modulo}/
  pages/Pages/{Modulo}/
    {Modulo}Page.tsx
    {Modulo}Filter/
    {Modulo}Table/
    {Modulo}Form/
  Routes/allRoutes.tsx
  Layouts/LayoutMenuData.tsx
```

## Funcionalidades de UX

- Filtros avançados em transações (período, cartão, categoria, responsável, tipo)
- Selects inline na tabela de transações para categoria e responsável
- Badges coloridos por tipo de transação e tipo de responsável (pessoal/empresa)
- Exportação CSV/Excel das transações filtradas
- Detalhe da fatura com visualização do PDF original + lançamentos extraídos

## Backend relacionado

Repositório irmão: `../controle_fatura_back`

Documentação de parsers PDF: `../controle_fatura_back/docs/pdf-parsers.md`
