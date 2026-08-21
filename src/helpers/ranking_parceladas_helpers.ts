import {
  RankingParceladaColuna,
  RankingParceladaItem,
  RankingParceladaParcelaResumo,
  RankingParceladaTimeline,
  RankingParceladasOrdenar,
  RankingParceladasTotais,
  RankingParceladasView,
  RankingParceladasVisualizacao,
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

const compareChain = (
  a: RankingParceladaItem,
  b: RankingParceladaItem,
  chain: Array<[keyof RankingParceladaItem | 'titulo', 'asc' | 'desc']>
): number => {
  for (const [field, dir] of chain) {
    if (field === 'titulo' || field === 'data_compra' || field === 'estimativa_termino') {
      const av = String(a[field] ?? '')
      const bv = String(b[field] ?? '')
      const cmp = av.localeCompare(bv, 'pt-BR')
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp
      continue
    }
    const av = num(a[field as keyof RankingParceladaItem])
    const bv = num(b[field as keyof RankingParceladaItem])
    if (av !== bv) return dir === 'desc' ? bv - av : av - bv
  }
  return 0
}

export const ordenarRankingParceladas = (
  itens: RankingParceladaItem[],
  ordenar: RankingParceladasOrdenar | string | null | undefined
): RankingParceladaItem[] => {
  const copy = [...itens]
  const chain: Array<[keyof RankingParceladaItem | 'titulo', 'asc' | 'desc']> =
    ordenar === 'restantes_asc'
      ? [
          ['parcelas_restantes', 'asc'],
          ['valor_aberto', 'desc'],
          ['percentual_pago', 'asc'],
          ['titulo', 'asc'],
        ]
      : ordenar === 'percentual_asc'
        ? [
            ['percentual_pago', 'asc'],
            ['parcelas_restantes', 'desc'],
            ['valor_aberto', 'desc'],
            ['titulo', 'asc'],
          ]
        : ordenar === 'percentual_desc'
          ? [
              ['percentual_pago', 'desc'],
              ['parcelas_restantes', 'desc'],
              ['valor_aberto', 'desc'],
              ['titulo', 'asc'],
            ]
          : ordenar === 'valor_aberto_desc'
            ? [
                ['valor_aberto', 'desc'],
                ['parcelas_restantes', 'desc'],
                ['percentual_pago', 'asc'],
                ['titulo', 'asc'],
              ]
            : ordenar === 'data_compra_desc'
              ? [
                  ['data_compra', 'desc'],
                  ['titulo', 'asc'],
                ]
              : [
                  ['parcelas_restantes', 'desc'],
                  ['valor_aberto', 'desc'],
                  ['percentual_pago', 'asc'],
                  ['titulo', 'asc'],
                ]

  copy.sort((a, b) => {
    const aQuitada = estaQuitada(a)
    const bQuitada = estaQuitada(b)
    if (aQuitada !== bQuitada) return aQuitada ? 1 : -1
    return compareChain(a, b, chain)
  })
  return copy
}

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
    itens,
  }
}

export const faturaDestinoRanking = (item: RankingParceladaItem): string | null => {
  const faturaId =
    item.proxima_parcela?.fatura_id ??
    item.competencia_atual?.fatura_id ??
    item.ultima_parcela?.fatura_id ??
    null
  return faturaId ? `/faturas/view/${faturaId}` : null
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
