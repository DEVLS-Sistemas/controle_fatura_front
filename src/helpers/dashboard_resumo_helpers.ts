export const DASHBOARD_ANO_STORAGE_KEY = 'dashboard_ano'
export const DASHBOARD_MES_INICIO_STORAGE_KEY = 'dashboard_mes_inicio'
export const DASHBOARD_MES_FIM_STORAGE_KEY = 'dashboard_mes_fim'
export const DASHBOARD_ANO_TODO = 'all'

export type DashboardMesInicio = typeof DASHBOARD_ANO_TODO | number

export type DashboardFiltro = {
  ano: number
  mes_inicio: DashboardMesInicio
  mes_fim: number | null
}

export type DashboardResumoParams = {
  ano: number
  mes?: number
  mes_inicio?: number
  mes_fim?: number
}

export const MESES_ABREV_DASHBOARD = [
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

export const isMesValido = (value: unknown): value is number => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 12
}

export const isAnoValido = (value: unknown): value is number => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 2000 && n <= 2100
}

const readStored = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStored = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export const persistDashboardFiltro = (filtro: DashboardFiltro) => {
  writeStored(DASHBOARD_ANO_STORAGE_KEY, String(filtro.ano))
  if (filtro.mes_inicio === DASHBOARD_ANO_TODO) {
    writeStored(DASHBOARD_MES_INICIO_STORAGE_KEY, DASHBOARD_ANO_TODO)
    writeStored(DASHBOARD_MES_FIM_STORAGE_KEY, '')
    return
  }
  writeStored(DASHBOARD_MES_INICIO_STORAGE_KEY, String(filtro.mes_inicio))
  writeStored(DASHBOARD_MES_FIM_STORAGE_KEY, String(filtro.mes_fim ?? filtro.mes_inicio))
}

const parseMesInicio = (raw: string | null): DashboardMesInicio | null => {
  if (raw == null || raw === '') return null
  if (raw === DASHBOARD_ANO_TODO) return DASHBOARD_ANO_TODO
  return isMesValido(Number(raw)) ? Number(raw) : null
}

export const normalizeDashboardFiltro = (filtro: DashboardFiltro): DashboardFiltro => {
  const ano = isAnoValido(filtro.ano) ? Number(filtro.ano) : new Date().getFullYear()
  if (filtro.mes_inicio === DASHBOARD_ANO_TODO || filtro.mes_inicio == null) {
    return { ano, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null }
  }

  const inicio = Number(filtro.mes_inicio)
  if (!isMesValido(inicio)) {
    return { ano, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null }
  }

  let fim = isMesValido(filtro.mes_fim) ? Number(filtro.mes_fim) : inicio
  if (fim < inicio) fim = inicio

  return { ano, mes_inicio: inicio, mes_fim: fim }
}

export const buildDashboardResumoParams = (filtro: DashboardFiltro): DashboardResumoParams => {
  const normalizado = normalizeDashboardFiltro(filtro)
  if (normalizado.mes_inicio === DASHBOARD_ANO_TODO) {
    return { ano: normalizado.ano }
  }

  const inicio = Number(normalizado.mes_inicio)
  const fim = Number(normalizado.mes_fim ?? inicio)

  if (inicio === 1 && fim === 12) {
    return { ano: normalizado.ano }
  }

  if (inicio === fim) {
    return { ano: normalizado.ano, mes: inicio }
  }

  return { ano: normalizado.ano, mes_inicio: inicio, mes_fim: fim }
}

export const buildDashboardSearchParams = (filtro: DashboardFiltro): URLSearchParams => {
  const query = buildDashboardResumoParams(filtro)
  const next = new URLSearchParams()
  next.set('ano', String(query.ano))
  if (query.mes) next.set('mes', String(query.mes))
  if (query.mes_inicio) next.set('mes_inicio', String(query.mes_inicio))
  if (query.mes_fim) next.set('mes_fim', String(query.mes_fim))
  return next
}

export const mesesDoFiltro = (filtro: DashboardFiltro): number[] => {
  const normalizado = normalizeDashboardFiltro(filtro)
  if (normalizado.mes_inicio === DASHBOARD_ANO_TODO) {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }
  const inicio = Number(normalizado.mes_inicio)
  const fim = Number(normalizado.mes_fim ?? inicio)
  return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i)
}

export const resolveDashboardFiltro = (
  urlParams?: URLSearchParams | null,
  now: Date = new Date()
): DashboardFiltro => {
  const atualAno = now.getFullYear()
  const atualMes = now.getMonth() + 1

  const hasUrl =
    Boolean(urlParams?.has('ano')) ||
    Boolean(urlParams?.has('mes')) ||
    Boolean(urlParams?.has('mes_inicio')) ||
    Boolean(urlParams?.has('mes_fim'))

  if (hasUrl) {
    const anoUrl = Number(urlParams?.get('ano'))
    const ano = isAnoValido(anoUrl) ? anoUrl : atualAno
    const mesInicioUrl = Number(urlParams?.get('mes_inicio'))
    const mesFimUrl = Number(urlParams?.get('mes_fim'))
    const mesUrl = Number(urlParams?.get('mes'))

    if (isMesValido(mesInicioUrl) || isMesValido(mesFimUrl)) {
      const inicio = isMesValido(mesInicioUrl) ? mesInicioUrl : 1
      const fim = isMesValido(mesFimUrl) ? mesFimUrl : 12
      return normalizeDashboardFiltro({
        ano,
        mes_inicio: inicio === 1 && fim === 12 ? DASHBOARD_ANO_TODO : inicio,
        mes_fim: inicio === 1 && fim === 12 ? null : fim,
      })
    }

    if (isMesValido(mesUrl)) {
      return { ano, mes_inicio: mesUrl, mes_fim: mesUrl }
    }

    return { ano, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null }
  }

  const anoStored = Number(readStored(DASHBOARD_ANO_STORAGE_KEY))
  const inicioStored = parseMesInicio(readStored(DASHBOARD_MES_INICIO_STORAGE_KEY))
  const fimStored = Number(readStored(DASHBOARD_MES_FIM_STORAGE_KEY))
  const ano = isAnoValido(anoStored) ? anoStored : atualAno

  if (inicioStored === DASHBOARD_ANO_TODO) {
    return { ano, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null }
  }

  if (isMesValido(inicioStored)) {
    return normalizeDashboardFiltro({
      ano,
      mes_inicio: inicioStored,
      mes_fim: isMesValido(fimStored) ? fimStored : inicioStored,
    })
  }

  return { ano: atualAno, mes_inicio: atualMes, mes_fim: atualMes }
}
