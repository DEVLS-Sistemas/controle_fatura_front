import { PeriodoFiltro } from 'interfaces/Estatisticas/EstatisticasCompraInterface'
import {
  GASTOS_CRITICOS_MESES_STORAGE_KEY,
  GASTOS_CRITICOS_RANKING_STORAGE_KEY,
  GastosCriticosAlertaTipo,
  GastosCriticosAtalho,
  GastosCriticosDefaultValues,
  GastosCriticosDimensao,
  GastosCriticosMeses,
  GastosCriticosRankingCriterio,
  GastosCriticosRankingItem,
  GastosCriticosRankings,
  GastosCriticosSearch,
  GastosCriticosSeveridade,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'

export const MESES_OPCOES: { value: GastosCriticosMeses; label: string }[] = [
  { value: 1, label: '1 mês' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 ano' },
]

export const RANKING_DIMENSOES: { value: GastosCriticosDimensao; label: string }[] = [
  { value: 'lojas', label: 'Lojas' },
  { value: 'estabelecimentos', label: 'Estabelecimentos' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'subcategorias', label: 'Subcategorias' },
]

export const MOTIVO_LABEL: Record<string, string> = {
  frequencia: 'Frequência',
  gasto: 'Gasto',
  concentracao: 'Concentração',
  evolucao: 'Evolução',
}

export const motivoLabel = (motivo?: string | null): string => {
  if (!motivo) return ''
  return MOTIVO_LABEL[motivo] ?? motivo
}

export const motivoChipColor = (motivo?: GastosCriticosAlertaTipo | string | null): string => {
  switch (motivo) {
    case 'frequencia':
      return 'info'
    case 'gasto':
      return 'danger'
    case 'concentracao':
      return 'warning'
    case 'evolucao':
      return 'primary'
    default:
      return 'secondary'
  }
}

export const severidadeBadge = (
  severidade?: GastosCriticosSeveridade | string | null
): { color: string; label: string } => {
  switch (severidade) {
    case 'alta':
      return { color: 'danger', label: 'Alta' }
    case 'media':
      return { color: 'warning', label: 'Média' }
    case 'baixa':
      return { color: 'secondary', label: 'Baixa' }
    default:
      return { color: 'secondary', label: severidade || 'Alerta' }
  }
}

export const formatPercentualApi = (value?: number | null): string | null => {
  if (value == null || Number.isNaN(Number(value))) return null
  return `${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export const formatVariacao = (
  value?: number | null
): { novo: boolean; label: string; color: string; sinal: 'up' | 'down' | 'flat' | 'new' } => {
  if (value == null || Number.isNaN(Number(value))) {
    return { novo: true, label: 'Novo', color: 'info', sinal: 'new' }
  }
  const n = Number(value)
  const formatted = formatPercentualApi(Math.abs(n)) ?? '0,0%'
  if (n > 0) return { novo: false, label: `+${formatted}`, color: 'danger', sinal: 'up' }
  if (n < 0) return { novo: false, label: `-${formatted}`, color: 'success', sinal: 'down' }
  return { novo: false, label: formatted, color: 'secondary', sinal: 'flat' }
}

type SemCategoriaSource = {
  tipo?: string | null
  entidade_tipo?: string | null
  chave?: string | null
  id?: number | string | null
  categoria_id?: number | null
  nome?: string | null
  nome_exibicao?: string | null
  titulo?: string | null
  entidade?: {
    tipo?: string | null
    chave?: string | null
    id?: number | string | null
    nome_exibicao?: string | null
  } | null
} | null | undefined

const normalizeNome = (value?: string | null): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

export const isSemCategoria = (source?: SemCategoriaSource): boolean => {
  if (!source) return false
  const tipo = source.tipo || source.entidade_tipo || source.entidade?.tipo
  const chave = String(source.chave || source.entidade?.chave || '')
  const id = source.id ?? source.categoria_id ?? source.entidade?.id
  const nome = normalizeNome(
    source.nome_exibicao || source.nome || source.titulo || source.entidade?.nome_exibicao
  )

  if (chave === 'categoria-0' || chave === 'categoria-null') return true
  if (nome === 'sem categoria' || nome === 'sem categorias') return true
  if (tipo === 'categoria' && (id == null || id === '' || Number(id) === 0)) return true
  return false
}

export const tituloRanking = (item: GastosCriticosRankingItem): string =>
  item.nome_exibicao || item.nome || '—'

export const subtituloRanking = (item: GastosCriticosRankingItem): string | null => {
  if (item.tipo !== 'estabelecimento') return null
  const titulo = tituloRanking(item)
  const maquininha = item.nome?.trim()
  if (maquininha && maquininha !== titulo) return maquininha
  return null
}

export const rankingItens = (
  rankings: GastosCriticosRankings | null | undefined,
  dimensao: GastosCriticosDimensao
): GastosCriticosRankingItem[] => {
  const lista = rankings?.[dimensao]
  return Array.isArray(lista) ? lista : []
}

export const rankingItensDiagnostico = (
  rankings: GastosCriticosRankings | null | undefined,
  dimensao: GastosCriticosDimensao
): GastosCriticosRankingItem[] =>
  rankingItens(rankings, dimensao).filter((item) => !isSemCategoria(item))

export const destaqueDiagnostico = <T extends SemCategoriaSource>(destaque?: T | null): T | null =>
  destaque && !isSemCategoria(destaque) ? destaque : null

export const alertasDiagnostico = <T extends SemCategoriaSource>(
  alertas?: T[] | null
): T[] => (Array.isArray(alertas) ? alertas.filter((item) => !isSemCategoria(item)) : [])

export const extrairSemCategoria = (
  data?: {
    alertas?: Array<
      SemCategoriaSource & {
        metricas?: {
          compras?: number | null
          valor_total?: number | null
          percentual_gasto?: number | null
          frequencia?: { label?: string | null } | null
        } | null
        atalho?: GastosCriticosAtalho | null
        titulo?: string | null
      }
    > | null
    maiores_gastos?: GastosCriticosRankings | null
    mais_comprados?: GastosCriticosRankings | null
    destaques?: {
      maior_gasto?: (SemCategoriaSource & GastosCriticosRankingItem) | null
      mais_comprado?: (SemCategoriaSource & GastosCriticosRankingItem) | null
    } | null
  } | null
): GastosCriticosRankingItem | null => {
  const categoriasGasto = rankingItens(data?.maiores_gastos, 'categorias')
  const categoriasCompras = rankingItens(data?.mais_comprados, 'categorias')
  const doRanking =
    categoriasGasto.find((item) => isSemCategoria(item))
    || categoriasCompras.find((item) => isSemCategoria(item))
  if (doRanking) return doRanking

  const alerta = (data?.alertas ?? []).find((item) => isSemCategoria(item))
  if (alerta) {
    return {
      tipo: 'categoria',
      chave: alerta.entidade?.chave || 'categoria-0',
      id: alerta.entidade?.id ?? null,
      nome: alerta.titulo || alerta.entidade?.nome_exibicao || 'Sem categoria',
      nome_exibicao: alerta.titulo || alerta.entidade?.nome_exibicao || 'Sem categoria',
      compras: alerta.metricas?.compras,
      valor_total: alerta.metricas?.valor_total,
      percentual_gasto: alerta.metricas?.percentual_gasto,
      frequencia: alerta.metricas?.frequencia,
      atalho: alerta.atalho,
    }
  }

  const destaque = [data?.destaques?.maior_gasto, data?.destaques?.mais_comprado].find((item) =>
    isSemCategoria(item)
  )
  if (!destaque) return null
  return {
    tipo: 'categoria',
    chave: destaque.chave || 'categoria-0',
    id: destaque.id ?? null,
    nome: destaque.nome_exibicao || destaque.nome || 'Sem categoria',
    nome_exibicao: destaque.nome_exibicao || destaque.nome || 'Sem categoria',
    compras: destaque.compras,
    valor_total: destaque.valor_total,
    frequencia: destaque.frequencia,
    atalho: destaque.atalho,
  }
}

export const atalhoToPath = (atalho?: GastosCriticosAtalho | null): string | null => {
  if (!atalho?.rota) return null
  const query = new URLSearchParams()
  const raw = atalho.query ?? {}
  Object.entries(raw).forEach(([key, value]) => {
    if (value == null || value === '') return
    query.set(key, String(value))
  })
  const qs = query.toString()
  const suffix = qs ? `?${qs}` : ''
  const id = atalho.id

  switch (atalho.rota) {
    case 'lojas':
      return id != null && String(id) !== '' ? `/lojas/view/${id}${suffix}` : null
    case 'estabelecimentos':
      return id != null && String(id) !== '' ? `/estabelecimentos/view/${id}${suffix}` : null
    case 'transacoes':
      return `/transacoes${suffix}`
    default:
      return null
  }
}

export const atalhoToPeriodoState = (
  atalho?: GastosCriticosAtalho | null
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
  if (Number.isFinite(mes) && mes >= 1 && mes <= 12 && Number.isFinite(ano) && ano > 2000) {
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

const parsePositiveId = (value?: string | null): number | string | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : value
}

const parseMeses = (value?: string | number | null): GastosCriticosMeses | null => {
  const n = Number(value)
  if (n === 1 || n === 3 || n === 6 || n === 12) return n
  return null
}

export const readMesesGastosCriticos = (): GastosCriticosMeses => {
  try {
    const stored = parseMeses(localStorage.getItem(GASTOS_CRITICOS_MESES_STORAGE_KEY))
    if (stored) return stored
  } catch {
    // ignore
  }
  return 3
}

export const persistMesesGastosCriticos = (meses: number) => {
  const valid = parseMeses(meses)
  if (!valid) return
  try {
    localStorage.setItem(GASTOS_CRITICOS_MESES_STORAGE_KEY, String(valid))
  } catch {
    // ignore
  }
}

export const readRankingCriterio = (): GastosCriticosRankingCriterio => {
  try {
    const stored = localStorage.getItem(GASTOS_CRITICOS_RANKING_STORAGE_KEY)
    if (stored === 'compras') return 'compras'
  } catch {
    // ignore
  }
  return 'gasto'
}

export const persistRankingCriterio = (criterio: GastosCriticosRankingCriterio) => {
  try {
    localStorage.setItem(GASTOS_CRITICOS_RANKING_STORAGE_KEY, criterio)
  } catch {
    // ignore
  }
}

export const resolveGastosCriticosSearch = (
  urlParams?: URLSearchParams | null
): GastosCriticosSearch => {
  const mesesUrl = parseMeses(urlParams?.get('meses'))
  const mesUrl = Number(urlParams?.get('mes'))
  const anoUrl = Number(urlParams?.get('ano'))
  const mesValido = Number.isFinite(mesUrl) && mesUrl >= 1 && mesUrl <= 12
  const anoValido = Number.isFinite(anoUrl) && anoUrl > 2000
  const dataInicio = urlParams?.get('data_inicio') || null
  const dataFim = urlParams?.get('data_fim') || null

  return {
    ...GastosCriticosDefaultValues,
    meses: mesValido && anoValido ? null : mesesUrl ?? readMesesGastosCriticos(),
    mes: mesValido && anoValido ? mesUrl : null,
    ano: mesValido && anoValido ? anoUrl : null,
    data_inicio: dataInicio,
    data_fim: dataFim,
    cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
    responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
    categoria_id: parsePositiveId(urlParams?.get('categoria_id')),
  }
}

export const persistGastosCriticosSearch = (search: GastosCriticosSearch) => {
  if (search.meses != null) persistMesesGastosCriticos(Number(search.meses))
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
  const opts: { value: string | number; label: string; cor?: string | null; cor_fundo?: string | null; cor_texto?: string | null }[] = [
    { value: '', label: allLabel },
  ]
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
