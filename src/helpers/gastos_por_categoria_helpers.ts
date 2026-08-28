import { PeriodoFiltro } from 'interfaces/Estatisticas/EstatisticasCompraInterface'
import {
  GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY,
  GASTOS_POR_CATEGORIA_ORIGENS,
  GastosPorCategoriaAtalho,
  GastosPorCategoriaDashboardBarra,
  GastosPorCategoriaDefaultValues,
  GastosPorCategoriaItem,
  GastosPorCategoriaMeses,
  GastosPorCategoriaOrigem,
  GastosPorCategoriaOrigemItem,
  GastosPorCategoriaPlataformaItem,
  GastosPorCategoriaSearch,
  GastosPorCategoriaSelecao,
  GastosPorCategoriaSelecaoVazia,
  GastosPorCategoriaSubcategoriaBarra,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import {
  COR_FATIA_OUTROS,
  COR_SEM_CATEGORIA,
  corCategoria,
  corPlataforma,
  corSubcategoria,
} from 'helpers/cores_tema_helpers'

export { corCategoria, corSubcategoria } from 'helpers/cores_tema_helpers'

export const GASTOS_ANO_TODO = 'all'

export const MESES_JANELA_OPCOES: { value: 1 | 3 | 6; label: string }[] = [
  { value: 1, label: 'Este mês' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
]

export const MESES_OPCOES: { value: GastosPorCategoriaMeses; label: string }[] = [
  ...MESES_JANELA_OPCOES,
  { value: 12, label: '1 ano' },
]

export const MESES_ABREV_GASTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const pad2 = (n: number): string => String(n).padStart(2, '0')

export const ultimoDiaDoMes = (ano: number, mes: number): number => new Date(ano, mes, 0).getDate()

export const datasDoIntervaloCalendario = (
  ano: number,
  mesInicio: number,
  mesFim: number
): { data_inicio: string; data_fim: string } => {
  const inicio = Math.min(mesInicio, mesFim)
  const fim = Math.max(mesInicio, mesFim)
  return {
    data_inicio: `${ano}-${pad2(inicio)}-01`,
    data_fim: `${ano}-${pad2(fim)}-${pad2(ultimoDiaDoMes(ano, fim))}`,
  }
}

export const rotuloMesAbrev = (mes: number, ano?: number): string => {
  const nome = MESES_ABREV_GASTOS[mes - 1] || String(mes)
  return ano != null ? `${nome} ${ano}` : nome
}

export const rotuloJanelaMeses = (meses: 1 | 3 | 6, now: Date = new Date()): string => {
  const fimMes = now.getMonth() + 1
  const fimAno = now.getFullYear()
  const inicioDate = new Date(fimAno, now.getMonth() - (meses - 1), 1)
  const iniMes = inicioDate.getMonth() + 1
  const iniAno = inicioDate.getFullYear()
  if (meses === 1) return rotuloMesAbrev(fimMes, fimAno)
  if (iniAno === fimAno) {
    return `${MESES_ABREV_GASTOS[iniMes - 1]}–${MESES_ABREV_GASTOS[fimMes - 1]} ${fimAno}`
  }
  return `${rotuloMesAbrev(iniMes, iniAno)}–${rotuloMesAbrev(fimMes, fimAno)}`
}

export const rotuloAnoCalendario = (ano: number): string => `Jan–Dez ${ano}`

export const MESES_NOME_GASTOS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const nomeMes = (mes: number): string => MESES_NOME_GASTOS[mes - 1] || String(mes)

export const rotuloPeriodoFiltro = (
  search: Pick<GastosPorCategoriaSearch, 'meses' | 'ano' | 'mes' | 'mes_inicio' | 'mes_fim'>,
  now: Date = new Date()
): { titulo: string; detalhe: string } => {
  const intervalo = resolverIntervaloCalendario(search)
  if (intervalo) {
    if (intervalo.mes_inicio === GASTOS_ANO_TODO) {
      return {
        titulo: `Ano ${intervalo.ano}`,
        detalhe: `Janeiro a dezembro de ${intervalo.ano} (ano calendário, não os últimos 12 meses)`,
      }
    }
    const ini = Number(intervalo.mes_inicio)
    const fim = Number(intervalo.mes_fim ?? ini)
    if (ini === fim) {
      return {
        titulo: `${nomeMes(ini)} de ${intervalo.ano}`,
        detalhe: `Somente ${nomeMes(ini)} de ${intervalo.ano}`,
      }
    }
    return {
      titulo: `${nomeMes(ini)} a ${nomeMes(fim)} de ${intervalo.ano}`,
      detalhe: `De ${nomeMes(ini)} até ${nomeMes(fim)} no ano ${intervalo.ano}`,
    }
  }

  const meses = (parseMeses(search.meses) ?? 3) as 1 | 3 | 6 | 12
  if (meses === 12) {
    const ano = now.getFullYear()
    return {
      titulo: `Ano ${ano}`,
      detalhe: `Janeiro a dezembro de ${ano} (ano calendário, não os últimos 12 meses)`,
    }
  }
  const janela = rotuloJanelaMeses(meses, now)
  if (meses === 1) {
    return {
      titulo: janela,
      detalhe: 'Somente o mês atual',
    }
  }
  return {
    titulo: janela,
    detalhe: `Últimos ${meses} meses a partir do mês atual para trás`,
  }
}

export const isGastosAnoTodo = (mesInicio?: string | number | null): boolean =>
  mesInicio === GASTOS_ANO_TODO

export const resolverIntervaloCalendario = (
  params: Pick<GastosPorCategoriaSearch, 'ano' | 'mes' | 'mes_inicio' | 'mes_fim'>
): {
  ano: number
  mes_inicio: number | typeof GASTOS_ANO_TODO
  mes_fim: number | null
  data_inicio: string
  data_fim: string
  mesUnico: number | null
} | null => {
  const ano = Number(params.ano)
  if (!isAnoValido(ano)) return null
  if (isGastosAnoTodo(params.mes_inicio)) {
    const datas = datasDoIntervaloCalendario(ano, 1, 12)
    return { ano, mes_inicio: GASTOS_ANO_TODO, mes_fim: null, ...datas, mesUnico: null }
  }
  const inicio = Number(params.mes_inicio ?? params.mes)
  if (!isMesValido(inicio)) return null
  let fim = Number(params.mes_fim ?? inicio)
  if (!isMesValido(fim) || fim < inicio) fim = inicio
  const datas = datasDoIntervaloCalendario(ano, inicio, fim)
  return {
    ano,
    mes_inicio: inicio,
    mes_fim: fim,
    ...datas,
    mesUnico: inicio === fim ? inicio : null,
  }
}

export const ORIGEM_CORES: Record<string, string> = {
  COMPRAS_ONLINE: '#3b82f6',
  COMPRAS_PRESENCIAL: '#22c55e',
  PAGAMENTO_SERVICOS: '#f59e0b',
  PAGAMENTO_FATURA: '#8b5cf6',
  'sem-origem': '#9ca3af',
}

export const ORIGEM_COR_SEM = COR_SEM_CATEGORIA

export const origemCor = (origem?: string | null, chave?: string | null): string => {
  if (chave && ORIGEM_CORES[chave]) return ORIGEM_CORES[chave]
  if (!origem || origem === 'sem-origem') return ORIGEM_COR_SEM
  return ORIGEM_CORES[origem] ?? ORIGEM_COR_SEM
}

export const chaveOrigem = (item?: GastosPorCategoriaOrigemItem | null): string => {
  if (item?.chave) return String(item.chave)
  if (item?.origem_compra) return String(item.origem_compra)
  return 'sem-origem'
}

export const fatiasOrigem = (
  itens?: GastosPorCategoriaOrigemItem[] | null
): GastosPorCategoriaOrigemItem[] =>
  (Array.isArray(itens) ? itens : []).filter((item) => Number(item.valor_total ?? 0) > 0)

export const chavePlataforma = (item?: GastosPorCategoriaPlataformaItem | null): string => {
  if (item?.chave) return String(item.chave)
  const id = Number(item?.plataforma_id)
  if (Number.isFinite(id) && id > 0) return `plataforma-${id}`
  return 'sem-plataforma'
}

export const fatiasPlataforma = (
  itens?: GastosPorCategoriaPlataformaItem[] | null
): GastosPorCategoriaPlataformaItem[] =>
  (Array.isArray(itens) ? itens : []).filter((item) => Number(item.valor_total ?? 0) > 0)

export const plataformaCorItem = (item?: GastosPorCategoriaPlataformaItem | null): string =>
  corPlataforma({
    cor: item?.cor,
    plataforma_id: item?.plataforma_id,
  })

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

export const resolverMesAnoCalendario = (
  mes: unknown,
  ano: unknown,
  now: Date = new Date()
): { mes: number; ano: number } | null => {
  const mesNum = Number(mes)
  if (!isMesValido(mesNum)) return null
  const anoNum = Number(ano)
  return {
    mes: mesNum,
    ano: isAnoValido(anoNum) ? anoNum : now.getFullYear(),
  }
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
  const mesInicioRaw = urlParams?.get('mes_inicio')
  const mesFimRaw = urlParams?.get('mes_fim')
  const mesValido = isMesValido(mesUrl)
  const anoValido = isAnoValido(anoUrl)
  const dataInicio = urlParams?.get('data_inicio') || null
  const dataFim = urlParams?.get('data_fim') || null
  const origem = urlParams?.get('origem_compra')

  if (anoValido && mesInicioRaw === GASTOS_ANO_TODO) {
    return {
      ...GastosPorCategoriaDefaultValues,
      meses: null,
      mes: null,
      ano: anoUrl,
      mes_inicio: GASTOS_ANO_TODO,
      mes_fim: null,
      data_inicio: null,
      data_fim: null,
      cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
      responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
      categoria_id: null,
      origem_compra: isOrigemValida(origem) ? origem : null,
      plataforma_id: parsePositiveId(urlParams?.get('plataforma_id')),
    }
  }

  const mesInicioNum = Number(mesInicioRaw)
  const mesFimNum = Number(mesFimRaw)
  if (anoValido && isMesValido(mesInicioNum)) {
    const fim = isMesValido(mesFimNum) ? mesFimNum : mesInicioNum
    const inicio = mesInicioNum
    const fimOk = fim < inicio ? inicio : fim
    return {
      ...GastosPorCategoriaDefaultValues,
      meses: null,
      mes: inicio === fimOk ? inicio : null,
      ano: anoUrl,
      mes_inicio: inicio,
      mes_fim: fimOk,
      data_inicio: null,
      data_fim: null,
      cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
      responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
      categoria_id: null,
      origem_compra: isOrigemValida(origem) ? origem : null,
      plataforma_id: parsePositiveId(urlParams?.get('plataforma_id')),
    }
  }

  const usaCalendario = mesValido && anoValido
  const mesesResolved = usaCalendario || dataInicio || dataFim
    ? null
    : mesesUrl ?? readMesesGastosPorCategoria()

  if (mesesResolved === 12) {
    const ano = anoValido ? anoUrl : new Date().getFullYear()
    return {
      ...GastosPorCategoriaDefaultValues,
      meses: null,
      mes: null,
      ano,
      mes_inicio: GASTOS_ANO_TODO,
      mes_fim: null,
      data_inicio: null,
      data_fim: null,
      cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
      responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
      categoria_id: null,
      origem_compra: isOrigemValida(origem) ? origem : null,
      plataforma_id: parsePositiveId(urlParams?.get('plataforma_id')),
    }
  }

  return {
    ...GastosPorCategoriaDefaultValues,
    meses: mesesResolved,
    mes: usaCalendario ? mesUrl : null,
    ano: usaCalendario ? anoUrl : null,
    mes_inicio: usaCalendario ? mesUrl : null,
    mes_fim: usaCalendario ? mesUrl : null,
    data_inicio: usaCalendario ? null : dataInicio,
    data_fim: usaCalendario ? null : dataFim,
    cartao_id: parsePositiveId(urlParams?.get('cartao_id')),
    responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
    categoria_id: null,
    origem_compra: isOrigemValida(origem) ? origem : null,
    plataforma_id: parsePositiveId(urlParams?.get('plataforma_id')),
  }
}

export const persistGastosPorCategoriaSearch = (search: GastosPorCategoriaSearch) => {
  if (search.meses != null) persistMesesGastosPorCategoria(Number(search.meses))
}

export const buildGastosPorCategoriaSearchParams = (
  filters: GastosPorCategoriaSearch
): URLSearchParams => {
  const next = new URLSearchParams()
  const intervalo = resolverIntervaloCalendario(filters)
  const dataInicio = typeof filters.data_inicio === 'string' ? filters.data_inicio.trim() : ''
  const dataFim = typeof filters.data_fim === 'string' ? filters.data_fim.trim() : ''

  if (intervalo) {
    next.set('ano', String(intervalo.ano))
    if (intervalo.mes_inicio === GASTOS_ANO_TODO) {
      next.set('mes_inicio', GASTOS_ANO_TODO)
    } else {
      next.set('mes_inicio', String(intervalo.mes_inicio))
      next.set('mes_fim', String(intervalo.mes_fim ?? intervalo.mes_inicio))
    }
  } else if (dataInicio || dataFim) {
    if (dataInicio) next.set('data_inicio', dataInicio)
    if (dataFim) next.set('data_fim', dataFim)
  } else {
    const meses = parseMeses(filters.meses) ?? 3
    next.set('meses', String(meses))
  }

  if (filters.cartao_id) next.set('cartao_id', String(filters.cartao_id))
  if (filters.responsavel_id) next.set('responsavel_id', String(filters.responsavel_id))
  if (isOrigemValida(filters.origem_compra)) next.set('origem_compra', filters.origem_compra)
  const plataformaId = Number(filters.plataforma_id)
  if (Number.isFinite(plataformaId) && plataformaId > 0) next.set('plataforma_id', String(plataformaId))

  return next
}

export const cleanGastosPorCategoriaParams = (
  params: GastosPorCategoriaSearch
): Record<string, unknown> => {
  const clean: Record<string, unknown> = {}
  const intervalo = resolverIntervaloCalendario(params)
  const dataInicio = typeof params.data_inicio === 'string' ? params.data_inicio.trim() : ''
  const dataFim = typeof params.data_fim === 'string' ? params.data_fim.trim() : ''

  if (intervalo?.mesUnico != null) {
    clean.mes = intervalo.mesUnico
    clean.ano = intervalo.ano
  } else if (intervalo) {
    clean.data_inicio = intervalo.data_inicio
    clean.data_fim = intervalo.data_fim
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

  if (isOrigemValida(params.origem_compra)) clean.origem_compra = params.origem_compra

  const plataformaId = Number(params.plataforma_id)
  if (Number.isFinite(plataformaId) && plataformaId > 0) clean.plataforma_id = plataformaId

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

export const hexToRgba = (hex: string, alpha: number): string => {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  if (full.length !== 6 || Number.isNaN(parseInt(full, 16))) {
    return `rgba(156, 163, 175, ${alpha})`
  }
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const corBarraDim = (cor?: string | null, dim?: boolean): string => {
  const hex = cor || corCategoria(cor)
  return dim ? hexToRgba(hex, 0.4) : hex
}

export const barraPercentual = (value?: number | null): number => {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export const dashboardLimite = (data?: GastosPorCategoriaView | null): number => {
  const n = Number(data?.dashboards?.limite)
  return Number.isFinite(n) && n > 0 ? n : 10
}

export const chaveCategoria = (item?: {
  chave?: string | null
  categoria_id?: number | null
} | null): string => {
  const id = Number(item?.categoria_id)
  if (Number.isFinite(id) && id > 0) return `categoria-${id}`
  const chave = item?.chave ? String(item.chave) : ''
  if (chave.startsWith('categoria-')) return chave
  return 'categoria-0'
}

export const isSelecaoAtiva = (selecao?: GastosPorCategoriaSelecao | null): boolean =>
  Boolean(selecao?.categoria_chave) || selecao?.subcategoria_id != null

export const mesmaCategoria = (
  item?: { chave?: string | null; categoria_id?: number | null } | null,
  selecao?: GastosPorCategoriaSelecao | null
): boolean => {
  if (!item || !selecao?.categoria_chave) return false
  return chaveCategoria(item) === selecao.categoria_chave
}

export const mesmaSubcategoria = (
  item?: { subcategoria_id?: number | null } | null,
  selecao?: GastosPorCategoriaSelecao | null
): boolean => {
  if (item?.subcategoria_id == null || selecao?.subcategoria_id == null) return false
  return Number(item.subcategoria_id) === Number(selecao.subcategoria_id)
}

const parseSelecaoId = (value?: string | null): number | 'sem' | null => {
  if (value == null || value === '') return null
  if (value === '0' || value === 'null' || value === 'sem') return 'sem'
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const resolveGastosPorCategoriaSelecao = (
  urlParams?: URLSearchParams | null
): GastosPorCategoriaSelecao => {
  const rawCat = urlParams?.get('selecao_categoria') ?? urlParams?.get('categoria_id')
  const cat = parseSelecaoId(rawCat)
  const subRaw = urlParams?.get('selecao_subcategoria')
  const sub = Number(subRaw)
  const subcategoria_id = Number.isFinite(sub) && sub > 0 ? sub : null

  if (cat === 'sem') {
    return { categoria_id: null, categoria_chave: 'categoria-0', subcategoria_id }
  }
  if (typeof cat === 'number') {
    return { categoria_id: cat, categoria_chave: `categoria-${cat}`, subcategoria_id }
  }
  return { ...GastosPorCategoriaSelecaoVazia, subcategoria_id }
}

export const appendSelecaoParams = (
  params: URLSearchParams,
  selecao?: GastosPorCategoriaSelecao | null
): URLSearchParams => {
  if (!selecao?.categoria_chave && selecao?.subcategoria_id == null) return params
  if (selecao.categoria_chave === 'categoria-0' || (selecao.categoria_chave && selecao.categoria_id == null)) {
    params.set('selecao_categoria', '0')
  } else if (selecao.categoria_id != null) {
    params.set('selecao_categoria', String(selecao.categoria_id))
  }
  if (selecao.subcategoria_id != null) {
    params.set('selecao_subcategoria', String(selecao.subcategoria_id))
  }
  return params
}

export const buildPageSearchParams = (
  filters: GastosPorCategoriaSearch,
  selecao?: GastosPorCategoriaSelecao | null
): URLSearchParams => appendSelecaoParams(buildGastosPorCategoriaSearchParams(filters), selecao)

export const aplicarCliqueCategoria = (
  selecao: GastosPorCategoriaSelecao,
  barra: GastosPorCategoriaDashboardBarra
): GastosPorCategoriaSelecao => {
  const chave = chaveCategoria(barra)
  if (selecao.categoria_chave === chave) return { ...GastosPorCategoriaSelecaoVazia }
  return {
    categoria_id: barra.categoria_id ?? null,
    categoria_chave: chave,
    subcategoria_id: null,
  }
}

export const aplicarCliqueSubcategoria = (
  selecao: GastosPorCategoriaSelecao,
  barra: GastosPorCategoriaSubcategoriaBarra
): GastosPorCategoriaSelecao => {
  const chave = chaveCategoria(barra)
  const subId = barra.subcategoria_id ?? null
  if (mesmaSubcategoria(barra, selecao)) {
    return {
      categoria_id: barra.categoria_id ?? null,
      categoria_chave: chave,
      subcategoria_id: null,
    }
  }
  return {
    categoria_id: barra.categoria_id ?? null,
    categoria_chave: chave,
    subcategoria_id: subId,
  }
}

const flattenTopSubcategorias = (
  categorias?: GastosPorCategoriaItem[] | null
): GastosPorCategoriaSubcategoriaBarra[] => {
  const lista: GastosPorCategoriaSubcategoriaBarra[] = []
  ;(categorias ?? []).forEach((cat) => {
    ;(cat.top_subcategorias ?? []).forEach((sub) => {
      lista.push({
        chave: sub.subcategoria_id != null ? `subcategoria-${sub.subcategoria_id}` : null,
        subcategoria_id: sub.subcategoria_id,
        nome: sub.nome,
        categoria_id: cat.categoria_id,
        categoria_nome: cat.nome,
        categoria_cor: cat.cor,
        cor: sub.cor,
        valor_total: sub.valor_total,
        compras: sub.compras,
        ticket_medio: sub.ticket_medio,
        percentual_da_categoria: sub.percentual_da_categoria,
        atalho: sub.atalho,
      })
    })
  })
  return lista.sort((a, b) => Number(b.valor_total ?? 0) - Number(a.valor_total ?? 0))
}

export const listaSubcategorias = (
  data?: GastosPorCategoriaView | null
): GastosPorCategoriaSubcategoriaBarra[] => {
  if (Array.isArray(data?.subcategorias) && data.subcategorias.length > 0) {
    return data.subcategorias
  }
  return flattenTopSubcategorias(data?.categorias)
}

export const FATIA_OUTROS_CHAVE = 'outros'

export const isFatiaOutros = (item?: { chave?: string | null } | null): boolean =>
  item?.chave === FATIA_OUTROS_CHAVE

export const comFatiaOutros = <T extends GastosPorCategoriaDashboardBarra>(
  itens: T[],
  limite: number
): T[] => {
  if (!Array.isArray(itens) || itens.length <= limite) return itens
  const top = itens.slice(0, limite)
  const resto = itens.slice(limite)
  const valor = resto.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)
  const compras = resto.reduce((acc, item) => acc + Number(item.compras ?? 0), 0)
  const total = itens.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)
  const percentual = total > 0 ? Math.round((valor / total) * 10) / 10 : 0
  const outros = {
    chave: FATIA_OUTROS_CHAVE,
    nome: 'Outros',
    cor: COR_FATIA_OUTROS,
    categoria_cor: COR_FATIA_OUTROS,
    valor_total: valor,
    compras,
    percentual_gasto: percentual,
    percentual_da_categoria: percentual,
    atalho: null,
  } as T
  return [...top, outros]
}

export const fonteCategorias = (
  data?: GastosPorCategoriaView | null
): GastosPorCategoriaDashboardBarra[] => {
  if (Array.isArray(data?.categorias) && data.categorias.length > 0) return data.categorias
  return Array.isArray(data?.dashboards?.categorias) ? data.dashboards.categorias : []
}

export const fonteSubcategorias = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaSubcategoriaBarra[] => {
  if (selecao?.categoria_chave) {
    return listaSubcategorias(data).filter((item) => mesmaCategoria(item, selecao))
  }
  if (Array.isArray(data?.subcategorias) && data.subcategorias.length > 0) return data.subcategorias
  if (Array.isArray(data?.dashboards?.subcategorias) && data.dashboards.subcategorias.length > 0) {
    return data.dashboards.subcategorias
  }
  return listaSubcategorias(data)
}

export const fatiasCategoria = (
  data?: GastosPorCategoriaView | null
): GastosPorCategoriaDashboardBarra[] =>
  comFatiaOutros(fonteCategorias(data), dashboardLimite(data))

export const fatiasSubcategoria = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaSubcategoriaBarra[] =>
  comFatiaOutros(fonteSubcategorias(data, selecao), dashboardLimite(data))

export const barrasCategoria = (
  data?: GastosPorCategoriaView | null
): GastosPorCategoriaDashboardBarra[] =>
  fonteCategorias(data).slice(0, dashboardLimite(data))

export const barrasSubcategoria = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaSubcategoriaBarra[] =>
  fonteSubcategorias(data, selecao).slice(0, dashboardLimite(data))

export const coresFatiasCategoria = (
  fatias: GastosPorCategoriaDashboardBarra[],
  selecionadaChave?: string | null
): string[] =>
  fatias.map((item) => {
    const cor = isFatiaOutros(item) ? COR_FATIA_OUTROS : corCategoria(item)
    const ativa =
      !isFatiaOutros(item) && Boolean(selecionadaChave) && chaveCategoria(item) === selecionadaChave
    return corBarraDim(cor, Boolean(selecionadaChave) && !ativa)
  })

export const coresFatiasSubcategoria = (
  fatias: GastosPorCategoriaSubcategoriaBarra[],
  selecionadaId?: number | null
): string[] =>
  fatias.map((item) => {
    if (isFatiaOutros(item)) {
      return selecionadaId != null ? hexToRgba(COR_FATIA_OUTROS, 0.4) : COR_FATIA_OUTROS
    }
    const ativa = selecionadaId != null && Number(item.subcategoria_id) === Number(selecionadaId)
    return corBarraDim(corSubcategoria(item), selecionadaId != null && !ativa)
  })

export const percentualFatia = (
  item?: {
    percentual_gasto?: number | null
    percentual_da_categoria?: number | null
  } | null,
  usarDaCategoria?: boolean
): number | null => {
  const value = usarDaCategoria ? item?.percentual_da_categoria : item?.percentual_gasto
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(value)
}

export const encontrarCategoria = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaItem | GastosPorCategoriaDashboardBarra | null => {
  if (!selecao?.categoria_chave) return null
  const daLista = (data?.categorias ?? []).find((item) => mesmaCategoria(item, selecao))
  if (daLista) return daLista
  return fonteCategorias(data).find((item) => mesmaCategoria(item, selecao)) ?? null
}

export const coresFatiasOrigem = (
  fatias: GastosPorCategoriaOrigemItem[],
  selecionadaChave?: string | null
): string[] =>
  fatias.map((item) => {
    const cor = origemCor(item.origem_compra, item.chave)
    const ativa = Boolean(selecionadaChave) && selecionadaChave === chaveOrigem(item)
    return corBarraDim(cor, Boolean(selecionadaChave) && !ativa)
  })

export const tituloOrigem = (categoriaNome?: string | null): string =>
  categoriaNome ? `Origem em ${categoriaNome}` : 'Origem'

export const centroValorOrigem = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): { valor: number | null; label: string } => {
  const cat = encontrarCategoria(data, selecao)
  if (cat) {
    return {
      valor: cat.valor_total ?? null,
      label: cat.nome ? `Em ${cat.nome}` : 'Total',
    }
  }
  return {
    valor: data?.totais?.valor_total ?? null,
    label: 'Total',
  }
}

export const coresFatiasPlataforma = (
  fatias: GastosPorCategoriaPlataformaItem[],
  selecionadaChave?: string | null
): string[] =>
  fatias.map((item) => {
    const cor = plataformaCorItem(item)
    const ativa = Boolean(selecionadaChave) && selecionadaChave === chavePlataforma(item)
    return corBarraDim(cor, Boolean(selecionadaChave) && !ativa)
  })

export const tituloPlataforma = (categoriaNome?: string | null): string =>
  categoriaNome ? `Plataforma em ${categoriaNome}` : 'Plataforma'

export const centroValorPlataforma = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): { valor: number | null; label: string } => centroValorOrigem(data, selecao)

export const encontrarSubcategoria = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaSubcategoriaBarra | null => {
  if (selecao?.subcategoria_id == null) return null
  return listaSubcategorias(data).find((item) => mesmaSubcategoria(item, selecao)) ?? null
}

export interface GastosPorCategoriaKpiView {
  valor_total?: number | null
  compras?: number | null
  ticket_medio?: number | null
  variacao_valor_percentual?: number | null
  mostrarVariacao: boolean
  label: string
  atalho?: GastosPorCategoriaAtalho | null
}

export const resolveKpis = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaKpiView => {
  const sub = encontrarSubcategoria(data, selecao)
  if (sub) {
    return {
      valor_total: sub.valor_total,
      compras: sub.compras,
      ticket_medio: sub.ticket_medio,
      variacao_valor_percentual: null,
      mostrarVariacao: false,
      label: `Em ${sub.nome || 'subcategoria'}`,
      atalho: sub.atalho,
    }
  }
  const cat = encontrarCategoria(data, selecao)
  if (cat) {
    return {
      valor_total: cat.valor_total,
      compras: cat.compras,
      ticket_medio: cat.ticket_medio,
      variacao_valor_percentual: 'variacao_valor_percentual' in cat ? cat.variacao_valor_percentual : null,
      mostrarVariacao: true,
      label: `Em ${cat.nome || 'categoria'}`,
      atalho: cat.atalho,
    }
  }
  return {
    valor_total: data?.totais?.valor_total,
    compras: data?.totais?.compras,
    ticket_medio: data?.totais?.ticket_medio,
    variacao_valor_percentual: data?.totais?.variacao_valor_percentual,
    mostrarVariacao: true,
    label: 'No período',
    atalho: null,
  }
}

export const resolvePorOrigemSelecao = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaOrigemItem[] => {
  const cat = encontrarCategoria(data, selecao)
  if (cat && 'por_origem' in cat && Array.isArray(cat.por_origem)) return cat.por_origem
  return Array.isArray(data?.por_origem) ? data.por_origem : []
}

export const resolvePorPlataformaSelecao = (
  data?: GastosPorCategoriaView | null,
  selecao?: GastosPorCategoriaSelecao | null
): GastosPorCategoriaPlataformaItem[] => {
  const cat = encontrarCategoria(data, selecao)
  if (cat && 'por_plataforma' in cat && Array.isArray(cat.por_plataforma)) return cat.por_plataforma
  return Array.isArray(data?.por_plataforma) ? data.por_plataforma : []
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
