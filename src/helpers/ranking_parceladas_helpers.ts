import {
  RankingParceladaColuna,
  RankingParceladaItem,
  RankingParceladaParcelaResumo,
  RankingParceladaTimeline,
  RankingParceladasOrdenar,
  RankingParceladasSearch,
  RankingParceladasTotais,
  RankingParceladasView,
  RankingParceladasVisualizacao,
  RANKING_SEARCH_STORAGE_KEY,
  RANKING_VIEW_STORAGE_KEY,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'

export const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
export const MESES_JANELA = 13
export const MESES_ANTES_DO_CENTRO = 6

export const competenciaKey = (mes: number, ano: number): number => ano * 12 + mes

export const competenciaChave = (mes: number, ano: number): string =>
  `${ano}-${String(mes).padStart(2, '0')}`

export const labelCompetencia = (mes?: number | null, ano?: number | null): string => {
  if (!mes || !ano || mes < 1 || mes > 12) return ''
  return `${MESES_ABREV[mes - 1]}/${ano}`
}

export const shiftMesAno = (
  mes: number,
  ano: number,
  delta: number
): { mes: number; ano: number } => {
  const cursor = new Date(ano, mes - 1 + delta, 1)
  return { mes: cursor.getMonth() + 1, ano: cursor.getFullYear() }
}

export const isApenasAbertas = (value: unknown): boolean => {
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return true
}

export const estaVisivelNoRanking = (
  item: RankingParceladaItem,
  mesRef: number,
  anoRef: number
): boolean => {
  const ultima = item.ultima_parcela
  if (ultima?.mes && ultima?.ano) {
    return competenciaKey(Number(ultima.mes), Number(ultima.ano)) >= competenciaKey(mesRef, anoRef)
  }
  return Number(item.parcelas_restantes ?? 0) > 0
}

export const isUltimaParcelaNoMesAtual = (
  item: RankingParceladaItem,
  mesRef: number,
  anoRef: number
): boolean => {
  const ultima = item.ultima_parcela
  if (!ultima?.mes || !ultima?.ano) return false
  return competenciaKey(Number(ultima.mes), Number(ultima.ano)) === competenciaKey(mesRef, anoRef)
}

export const estaQuitada = (item: RankingParceladaItem): boolean => {
  if (item.quitada === true) return true
  if (Number(item.percentual_pago ?? 0) >= 100) return true
  return Number(item.valor_aberto ?? 0) <= 0.009 && Number(item.parcelas_restantes ?? 0) === 0
}

const num = (value: unknown): number => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const chaveFromParcela = (parcela?: RankingParceladaParcelaResumo | null): string | null => {
  if (!parcela?.mes || !parcela?.ano) return null
  return competenciaChave(Number(parcela.mes), Number(parcela.ano))
}

export const buildColunasRanking = (mes: number, ano: number): RankingParceladaColuna[] => {
  const inicio = shiftMesAno(mes, ano, -MESES_ANTES_DO_CENTRO)
  return Array.from({ length: MESES_JANELA }, (_, i) => {
    const cursor = shiftMesAno(inicio.mes, inicio.ano, i)
    return {
      mes: cursor.mes,
      ano: cursor.ano,
      chave: competenciaChave(cursor.mes, cursor.ano),
      label: labelCompetencia(cursor.mes, cursor.ano),
      centro: i === MESES_ANTES_DO_CENTRO,
      indice: i,
    }
  })
}

export const buildTimelineItem = (
  item: RankingParceladaItem,
  colunas: RankingParceladaColuna[]
): RankingParceladaTimeline => {
  const porChave: Record<string, number> = {}
  colunas.forEach((col) => {
    porChave[col.chave] = col.indice
  })

  const inicioChave = chaveFromParcela(item.primeira_parcela)
  const fimChave = chaveFromParcela(item.ultima_parcela)
  let progressoChave = chaveFromParcela(item.competencia_atual) ?? inicioChave
  if (estaQuitada(item)) progressoChave = fimChave

  let indiceInicio = inicioChave ? porChave[inicioChave] ?? null : null
  let indiceFim = fimChave ? porChave[fimChave] ?? null : null
  let indiceProgresso = progressoChave ? porChave[progressoChave] ?? null : null

  const primeiro = colunas[0]?.chave
  const ultimo = colunas[MESES_JANELA - 1]?.chave

  if (inicioChave && fimChave && indiceInicio == null && indiceFim == null) {
    if (primeiro && ultimo && inicioChave <= ultimo && fimChave >= primeiro) {
      indiceInicio = 0
      indiceFim = MESES_JANELA - 1
    }
  } else {
    if (inicioChave && indiceInicio == null && fimChave && porChave[fimChave] != null) {
      indiceInicio = 0
    }
    if (fimChave && indiceFim == null && inicioChave && porChave[inicioChave] != null) {
      indiceFim = MESES_JANELA - 1
    }
  }

  if (indiceProgresso == null && indiceInicio != null && indiceFim != null && progressoChave) {
    if (primeiro && progressoChave < primeiro) indiceProgresso = indiceInicio
    else if (ultimo && progressoChave > ultimo) indiceProgresso = indiceFim
  }

  const fora = indiceInicio == null || indiceFim == null

  return {
    inicio_chave: inicioChave,
    fim_chave: fimChave,
    progresso_chave: progressoChave,
    indice_inicio: indiceInicio,
    indice_fim: indiceFim,
    indice_progresso: indiceProgresso,
    fora_da_janela: fora,
  }
}

export const barraTimelineStyle = (
  inicio: number,
  fim: number
): { left: string; width: string } => {
  const span = Math.max(fim - inicio + 1, 1)
  return {
    left: `${(inicio / MESES_JANELA) * 100}%`,
    width: `${(span / MESES_JANELA) * 100}%`,
  }
}

const parsePercentual = (value: unknown): number | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const raw = String(value).replace('%', '').trim()
  if (!raw) return null
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** % de conclusão exibido no card (`percentual_pago`, senão parcela_atual / parcelas_total). */
export const percentualConclusao = (item: RankingParceladaItem): number => {
  const pago = parsePercentual(item.percentual_pago)
  if (pago != null) return pago
  const total = num(item.parcelas_total)
  if (total > 0 && item.parcela_atual != null) {
    return (num(item.parcela_atual) / total) * 100
  }
  return 0
}

/** Ranking fixo: menor % de conclusão no topo (10% acima de 25%). */
export const ordenarPorMenorPercentual = (
  itens: RankingParceladaItem[]
): RankingParceladaItem[] =>
  [...itens].sort((a, b) => {
    const pa = percentualConclusao(a)
    const pb = percentualConclusao(b)
    if (pa !== pb) return pa - pb
    return String(a.titulo ?? '').localeCompare(String(b.titulo ?? ''), 'pt-BR')
  })

export const ordenarRankingParceladas = (
  itens: RankingParceladaItem[],
  _ordenar?: RankingParceladasOrdenar | string | null
): RankingParceladaItem[] => ordenarPorMenorPercentual(itens)

export const buildTotaisRanking = (itens: RankingParceladaItem[]): RankingParceladasTotais => {
  const valorTotal = itens.reduce((acc, item) => acc + num(item.valor_total), 0)
  const valorPago = itens.reduce((acc, item) => acc + num(item.valor_pago), 0)
  const valorAberto = itens.reduce((acc, item) => acc + num(item.valor_aberto), 0)

  return {
    compras: itens.length,
    valor_total: Math.round(valorTotal * 100) / 100,
    valor_pago: Math.round(valorPago * 100) / 100,
    valor_aberto: Math.round(valorAberto * 100) / 100,
    percentual_pago: valorTotal > 0 ? Math.round((valorPago / valorTotal) * 10000) / 100 : 0,
  }
}

export const enriquecerRankingView = (
  result: RankingParceladasView,
  mes: number,
  ano: number
): RankingParceladasView => {
  const colunas =
    result.colunas && result.colunas.length === MESES_JANELA
      ? result.colunas
      : buildColunasRanking(mes, ano)

  const itens = (result.itens ?? []).map((item) => {
    const quitada = estaQuitada(item)
    const estimativa =
      item.estimativa_termino ||
      labelCompetencia(item.ultima_parcela?.mes, item.ultima_parcela?.ano) ||
      null
    const timeline =
      item.timeline && item.timeline.indice_inicio != null
        ? item.timeline
        : buildTimelineItem({ ...item, quitada }, colunas)

    return {
      ...item,
      quitada,
      estimativa_termino: estimativa,
      timeline,
    }
  })

  return {
    ...result,
    referencia: { mes, ano },
    colunas,
    itens: ordenarPorMenorPercentual(itens),
  }
}

export const compraDestinoRanking = (
  item: RankingParceladaItem,
  mes?: number | null,
  ano?: number | null
): string | null => {
  const id = item.compra_grupo_id
  if (!id) return null
  const params = new URLSearchParams()
  if (mes) params.set('mes', String(mes))
  if (ano) params.set('ano', String(ano))
  const qs = params.toString()
  return qs
    ? `/compras/${encodeURIComponent(String(id))}?${qs}`
    : `/compras/${encodeURIComponent(String(id))}`
}

export const readRankingSearch = (): Partial<RankingParceladasSearch> | null => {
  try {
    const raw = sessionStorage.getItem(RANKING_SEARCH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const persistRankingSearch = (search: RankingParceladasSearch) => {
  try {
    sessionStorage.setItem(RANKING_SEARCH_STORAGE_KEY, JSON.stringify(search))
  } catch {
    // ignore
  }
}

export const resolveRankingSearchDefaults = (
  urlParams?: URLSearchParams | null
): RankingParceladasSearch => {
  const now = new Date()
  const stored = readRankingSearch()
  const mesUrl = Number(urlParams?.get('mes'))
  const anoUrl = Number(urlParams?.get('ano'))
  const mesValido = Number.isFinite(mesUrl) && mesUrl >= 1 && mesUrl <= 12
  const anoValido = Number.isFinite(anoUrl) && anoUrl > 2000

  return {
    mes: mesValido ? mesUrl : stored?.mes ?? now.getMonth() + 1,
    ano: anoValido ? anoUrl : stored?.ano ?? now.getFullYear(),
    cartao_id: stored?.cartao_id ?? null,
    responsavel_id: stored?.responsavel_id ?? null,
    categoria_id: stored?.categoria_id ?? null,
    apenas_abertas: stored?.apenas_abertas ?? true,
    ordenar: 'percentual_asc',
    palavra_chave: stored?.palavra_chave ?? null,
  }
}

export const readVisualizacaoRanking = (): RankingParceladasVisualizacao => {
  try {
    const stored = localStorage.getItem(RANKING_VIEW_STORAGE_KEY)
    if (stored === 'competencias') return 'competencias'
  } catch {
    // ignore
  }
  return 'lista'
}

export const persistVisualizacaoRanking = (view: RankingParceladasVisualizacao) => {
  try {
    localStorage.setItem(RANKING_VIEW_STORAGE_KEY, view)
  } catch {
    // ignore
  }
}
