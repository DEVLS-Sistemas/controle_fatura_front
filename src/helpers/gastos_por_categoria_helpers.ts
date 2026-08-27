import { PeriodoFiltro } from 'interfaces/Estatisticas/EstatisticasCompraInterface'
import {
  GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY,
  GASTOS_POR_CATEGORIA_ORIGENS,
  GastosPorCategoriaAtalho,
  GastosPorCategoriaDefaultValues,
  GastosPorCategoriaMeses,
  GastosPorCategoriaOrigem,
  GastosPorCategoriaSearch,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

export const MESES_OPCOES: { value: GastosPorCategoriaMeses; label: string }[] = [
  { value: 1, label: '1 mês' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 ano' },
]

export const ORIGEM_CORES: Record<string, string> = {
  COMPRAS_ONLINE: '#0dcaf0',
  COMPRAS_PRESENCIAL: '#405189',
  PAGAMENTO_SERVICOS: '#f7b84b',
  PAGAMENTO_FATURA: '#6b7280',
}

export const ORIGEM_COR_SEM = '#9ca3af'

export const origemCor = (origem?: string | null): string => {
  if (!origem) return ORIGEM_COR_SEM
  return ORIGEM_CORES[origem] ?? ORIGEM_COR_SEM
}

export const isOrigemValida = (value?: string | null): value is GastosPorCategoriaOrigem =>
  GASTOS_POR_CATEGORIA_ORIGENS.includes(value as GastosPorCategoriaOrigem)

export const isMesValido = (mes: unknown): mes is number => {
  const n = Number(mes)
  return Number.isFinite(n) && n >= 1 && n <= 12
}

export const isAnoValido = (ano: unknown): ano is number => {
  const n = Number(ano)
  return Number.isFinite(n) && n > 2000
}

export const parseMeses = (value?: string | number | null): GastosPorCategoriaMeses | null => {
  const n = Number(value)
  if (n === 1 || n === 3 || n === 6 || n === 12) return n
  return null
}

const parsePositiveId = (value?: string | null): number | string | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : value
}

export const readMesesGastosPorCategoria = (): GastosPorCategoriaMeses => {
  try {
    const stored = parseMeses(localStorage.getItem(GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY))
    if (stored) return stored
  } catch {
    // ignore
  }
  return 3
}

export const persistMesesGastosPorCategoria = (meses: number) => {
  const valid = parseMeses(meses)
  if (!valid) return
  try {
    localStorage.setItem(GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY, String(valid))
  } catch {
    // ignore
  }
}

export const resolveGastosPorCategoriaSearch = (
  urlParams?: URLSearchParams | null
): GastosPorCategoriaSearch => {
  const mesesUrl = parseMeses(urlParams?.get('meses'))
  const mesUrl = Number(urlParams?.get('mes'))
  const anoUrl = Number(urlParams?.get('ano'))
  const mesValido = isMesValido(mesUrl)
  const anoValido = isAnoValido(anoUrl)
  const dataInicio = urlParams?.get('data_inicio') || null
  const dataFim = urlParams?.get('data_fim') || null
  const origem = urlParams?.get('origem_compra')
  const usaCalendario = mesValido && anoValido

  return {
    ...GastosPorCategoriaDefaultValues,
    meses: usaCalendario ? null : mesesUrl ?? readMesesGastosPorCategoria(),
    mes: usaCalendario ? mesUrl : null,
    ano: usaCalendario ? anoUrl : null,
    data_inicio: usaCalendario ? null : dataInicio,
    data_fim: usaCalendario ? null : dataFim,
    cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
    responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
    categoria_id: parsePositiveId(urlParams?.get('categoria_id')),
    origem_compra: isOrigemValida(origem) ? origem : null,
  }
}

export const persistGastosPorCategoriaSearch = (search: GastosPorCategoriaSearch) => {
  if (search.meses != null) persistMesesGastosPorCategoria(Number(search.meses))
}

export const buildGastosPorCategoriaSearchParams = (
  filters: GastosPorCategoriaSearch
): URLSearchParams => {
  const next = new URLSearchParams()
  const mes = Number(filters.mes)
  const ano = Number(filters.ano)
  const usaCalendario = isMesValido(mes) && isAnoValido(ano)
  const dataInicio = typeof filters.data_inicio === 'string' ? filters.data_inicio.trim() : ''
  const dataFim = typeof filters.data_fim === 'string' ? filters.data_fim.trim() : ''

  if (usaCalendario) {
    next.set('mes', String(mes))
    next.set('ano', String(ano))
  } else if (dataInicio || dataFim) {
    if (dataInicio) next.set('data_inicio', dataInicio)
    if (dataFim) next.set('data_fim', dataFim)
  } else {
    const meses = parseMeses(filters.meses) ?? 3
    next.set('meses', String(meses))
  }

  if (filters.cartao_id) next.set('cartao_id', String(filters.cartao_id))
  if (filters.responsavel_id) next.set('responsavel_id', String(filters.responsavel_id))
  if (filters.categoria_id) next.set('categoria_id', String(filters.categoria_id))
  if (isOrigemValida(filters.origem_compra)) next.set('origem_compra', filters.origem_compra)

  return next
}

export const cleanGastosPorCategoriaParams = (
  params: GastosPorCategoriaSearch
): Record<string, unknown> => {
  const clean: Record<string, unknown> = {}
  const mes = Number(params.mes)
  const ano = Number(params.ano)
  const mesValido = isMesValido(mes)
  const anoValido = isAnoValido(ano)
  const dataInicio = typeof params.data_inicio === 'string' ? params.data_inicio.trim() : ''
  const dataFim = typeof params.data_fim === 'string' ? params.data_fim.trim() : ''

  if (mesValido && anoValido) {
    clean.mes = mes
    clean.ano = ano
  } else if (dataInicio || dataFim) {
    if (dataInicio) clean.data_inicio = dataInicio
    if (dataFim) clean.data_fim = dataFim
  } else {
    clean.meses = parseMeses(params.meses) ?? 3
  }

  const cartaoId = Number(params.cartao_id)
  if (Number.isFinite(cartaoId) && cartaoId > 0) clean.cartao_id = cartaoId

  const responsavelId = Number(params.responsavel_id)
  if (Number.isFinite(responsavelId) && responsavelId > 0) clean.responsavel_id = responsavelId

  const categoriaId = Number(params.categoria_id)
  if (Number.isFinite(categoriaId) && categoriaId > 0) clean.categoria_id = categoriaId

  if (isOrigemValida(params.origem_compra)) clean.origem_compra = params.origem_compra

  return clean
}

export const atalhoToPath = (atalho?: GastosPorCategoriaAtalho | null): string | null => {
  if (!atalho?.rota) return null
  const query = new URLSearchParams()
  const raw = atalho.query ?? {}
  Object.entries(raw).forEach(([key, value]) => {
    if (value == null || value === '') return
    query.set(key, String(value))
  })
  const qs = query.toString()
  const suffix = qs ? `?${qs}` : ''

  if (atalho.rota === 'transacoes') return `/transacoes${suffix}`
  return null
}

export const atalhoToPeriodoState = (
  atalho?: GastosPorCategoriaAtalho | null
): { periodo: PeriodoFiltro } | undefined => {
  const q = atalho?.query
  if (!q) return undefined
  if (q.data_inicio || q.data_fim) {
    return {
      periodo: {
        periodo_modo: 'intervalo',
        data_inicio: q.data_inicio ? String(q.data_inicio) : null,
        data_fim: q.data_fim ? String(q.data_fim) : null,
        mes: null,
        ano: null,
      },
    }
  }
  const mes = Number(q.mes)
  const ano = Number(q.ano)
  if (isMesValido(mes) && isAnoValido(ano)) {
    return {
      periodo: {
        periodo_modo: 'mes',
        mes,
        ano,
        data_inicio: null,
        data_fim: null,
      },
    }
  }
  return undefined
}

export const deveAvisarSemCategoria = (percentual?: number | null): boolean => {
  if (percentual == null || Number.isNaN(Number(percentual))) return false
  return Number(percentual) > 20
}

export const atalhoSemCategoria = (
  data?: GastosPorCategoriaView | null
): GastosPorCategoriaAtalho | null => {
  const daLista = (data?.categorias ?? []).find((item) => item.categoria_id == null)
  if (daLista?.atalho) return daLista.atalho

  const inicio = data?.periodo?.inicio
  const fim = data?.periodo?.fim
  if (!inicio && !fim) return null
  return {
    rota: 'transacoes',
    query: {
      data_inicio: inicio ?? null,
      data_fim: fim ?? null,
    },
  }
}

export const corCategoria = (cor?: string | null): string => cor || '#9ca3af'

export const barraPercentual = (value?: number | null): number => {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export const buildSelectOptions = (
  items:
    | {
        id?: number
        nome?: string
        cor?: string | null
        cor_fundo?: string | null
        cor_texto?: string | null
      }[]
    | undefined,
  allLabel = 'Todos'
) => {
  const opts: {
    value: string | number
    label: string
    cor?: string | null
    cor_fundo?: string | null
    cor_texto?: string | null
  }[] = [{ value: '', label: allLabel }]
  items?.forEach((item) => {
    if (item.id != null) {
      opts.push({
        value: item.id,
        label: item.nome ?? `#${item.id}`,
        cor: item.cor ?? null,
        cor_fundo: item.cor_fundo ?? null,
        cor_texto: item.cor_texto ?? null,
      })
    }
  })
  return opts
}
