import { ProjecaoFaturasView } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import {
  SimuladorOverlayResult,
  SimuladorVeredito,
  SimuladorVereditoMes,
  SimuladorVereditoMotivo,
  SimuladorVereditoNivel,
  SimuladorVereditoScore,
} from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

const TITULO: Record<SimuladorVereditoNivel, string> = {
  baixo: 'Baixo impacto',
  moderado: 'Impacto moderado',
  alto: 'Compra compromete demais os próximos meses',
}

const EYEBROW: Record<SimuladorVereditoNivel, string> = {
  baixo: 'Pode comprar',
  moderado: 'Dá para comprar, com ressalva',
  alto: 'Melhor não agora',
}

const FRASE_SEM_HISTORICO =
  'Esta parcela entra sozinha nas faturas. Não há histórico neste cartão para comparar.'
const FRASE_SEM_PROJECAO = 'Não há faturas projetadas nesse período.'

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const roundMoney = (n: number): number => Math.round((Number(n) || 0) * 100) / 100

const labelCompetencia = (mes: number, ano: number): string =>
  `${MESES_ABREV[(mes || 1) - 1] || String(mes)}/${ano}`

const formatBRL = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const nivelFromScore = (score: number): SimuladorVereditoNivel => {
  if (score >= 2) return 'alto'
  if (score >= 1) return 'moderado'
  return 'baixo'
}

export const formatPctVeredito = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(Number(value))) return '0'
  const rounded = Math.round(Number(value) * 10) / 10
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(1).replace('.', ',')
}

export const formatTotalCurto = (value: number): string => {
  const n = Number(value) || 0
  if (Math.abs(n) >= 1000) {
    const mil = Math.round((n / 1000) * 10) / 10
    const s = Number.isInteger(mil) ? String(mil) : mil.toFixed(1).replace('.', ',')
    return `${s} mil`
  }
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

/** Peso = parcela / fatura que já existia. Acima de 100% vira múltiplo, não "349% da fatura". */
export const formatPesoChip = (peso: number): string => {
  if (peso >= 1) return `Parcela = ${formatPctVeredito(peso)}x a fatura`
  return `Parcela = ${formatPctVeredito(peso * 100)}% da fatura`
}

const frasePesoAlto = (c: SimuladorVereditoMes, cartaoNome: string): string => {
  const peso = c.peso ?? 0
  const cartao = cartaoNome ? ` do ${cartaoNome}` : ''
  if (peso >= 1) {
    return `Em ${c.label} esta parcela é ${formatPctVeredito(peso)} vezes a fatura atual${cartao} (${formatBRL(c.antes)} → ${formatBRL(c.depois)}). Melhor reduzir o valor, alongar as parcelas ou outro cartão.`
  }
  return `Em ${c.label} esta parcela representa ${formatPctVeredito(peso * 100)}% da fatura${cartao}. Melhor reduzir o valor, alongar as parcelas ou outro cartão.`
}

export const nivelMes = (
  antes: number,
  _depois: number,
  parcela: number,
  _limite: number | null,
  usoDepois: number | null
): SimuladorVereditoScore => {
  let score: SimuladorVereditoScore = 0
  if (usoDepois != null && Number.isFinite(usoDepois)) {
    if (usoDepois >= 90) score = 2
    else if (usoDepois >= 70) score = 1
  }
  if (antes > 0) {
    const peso = parcela / antes
    if (peso >= 0.4) score = Math.max(score, 2) as SimuladorVereditoScore
    else if (peso >= 0.2) score = Math.max(score, 1) as SimuladorVereditoScore
  }
  return score
}

const pickMesCritico = (meses: SimuladorVereditoMes[]): SimuladorVereditoMes | null => {
  if (!meses.length) return null
  return meses.reduce((best, atual) => {
    if (atual.score > best.score) return atual
    if (atual.score < best.score) return best
    if (atual.usoDepois != null && best.usoDepois != null) {
      if (atual.usoDepois > best.usoDepois) return atual
      if (atual.usoDepois < best.usoDepois) return best
    } else if (atual.usoDepois != null) return atual
    else if (best.usoDepois != null) return best
    // Sem limite: o mês mais carregado em R$, não o de maior ratio
    // (senão uma fatura de R$ 143 ganha de uma de R$ 1.700).
    if (atual.depois > best.depois) return atual
    if (atual.depois < best.depois) return best
    if (atual.antes > best.antes) return atual
    return best
  })
}

const montarMotivos = (opts: {
  critico: SimuladorVereditoMes | null
  limite: number | null
  bumpDuracao: boolean
  kPesados: number
  nParcelas: number
}): SimuladorVereditoMotivo[] => {
  const motivos: SimuladorVereditoMotivo[] = []
  const { critico, limite, bumpDuracao, kPesados, nParcelas } = opts

  if (limite != null && critico?.usoDepois != null && critico.usoDepois >= 70) {
    motivos.push({ id: 'limite', label: `Limite ${formatPctVeredito(critico.usoDepois)}%` })
  }
  if (critico && critico.antes > 0 && (critico.peso ?? 0) >= 0.2) {
    motivos.push({
      id: 'peso',
      label: formatPesoChip(critico.peso || 0),
    })
  }
  if (bumpDuracao) {
    motivos.push({ id: 'duracao', label: `${kPesados} meses pesados` })
  }
  if (motivos.length < 3) {
    motivos.push({ id: 'parcela', label: nParcelas <= 1 ? 'à vista' : `${nParcelas}x` })
  }
  return motivos.slice(0, 3)
}

const montarContexto = (opts: {
  cartaoNome: string
  valorCompra: number
  nParcelas: number
  primeiraLabel: string
  ultimaLabel: string
}): string => {
  const partes = [opts.cartaoNome].filter(Boolean)
  const valor = formatBRL(opts.valorCompra)
  partes.push(opts.nParcelas <= 1 ? `${valor} à vista` : `${valor} em ${opts.nParcelas}x`)
  if (opts.primeiraLabel && opts.ultimaLabel) {
    partes.push(
      opts.primeiraLabel === opts.ultimaLabel
        ? opts.primeiraLabel
        : `${opts.primeiraLabel} → ${opts.ultimaLabel}`
    )
  } else if (opts.primeiraLabel) {
    partes.push(opts.primeiraLabel)
  }
  return partes.join('  ·  ')
}

const fraseBaixo = (opts: {
  semHistorico: boolean
  nParcelas: number
  janelaTruncada: boolean
  parcela: string
  n: number
  mesCritico: string
}): string => {
  if (opts.semHistorico) return FRASE_SEM_HISTORICO
  if (opts.nParcelas === 1) return `Esta compra à vista cabe na fatura de ${opts.mesCritico}.`
  if (opts.janelaTruncada) return `A parcela de ${opts.parcela} cabe nas faturas visíveis.`
  return `A parcela de ${opts.parcela} cabe nas próximas ${opts.n} faturas.`
}

const fraseModerado = (opts: {
  critico: SimuladorVereditoMes | null
}): string => {
  const c = opts.critico
  if (c && c.antes > 0) {
    return `Dá para comprar, mas ${c.label} fica mais pesado: a fatura vai de ${formatBRL(c.antes)} para ${formatBRL(c.depois)}.`
  }
  if (c && c.usoDepois != null && c.limite != null) {
    return `A parcela cabe, porém ${c.label} vai a ${formatPctVeredito(c.usoDepois)}% do limite.`
  }
  return 'Dá para comprar, mas os próximos meses ficam mais carregados.'
}

const fraseAlto = (opts: {
  critico: SimuladorVereditoMes | null
  cartaoNome: string
  bumpDuracao: boolean
  algumUso70: boolean
  kPesados: number
}): string => {
  const c = opts.critico
  const usoAlto = (c?.usoDepois ?? 0) >= 90 || (opts.bumpDuracao && opts.algumUso70)
  if (usoAlto && c?.usoDepois != null && c.limite != null) {
    return `Em ${c.label} o ${opts.cartaoNome || 'cartão'} iria a ${formatPctVeredito(c.usoDepois)}% do limite (${formatBRL(c.depois)} de ${formatBRL(c.limite)}).`
  }
  const pesoDisparou = c && c.antes > 0 && (c.peso ?? 0) >= 0.2
  const limiteAlto = c?.usoDepois != null && c.usoDepois >= 70
  if (pesoDisparou && !limiteAlto) {
    return frasePesoAlto(c, opts.cartaoNome)
  }
  if (opts.bumpDuracao) {
    return `A parcela pesa em ${opts.kPesados} faturas seguidas. Isso compromete demais os próximos meses.`
  }
  return 'Esta compra compromete demais os próximos meses.'
}

const fraseDoNivel = (
  nivel: SimuladorVereditoNivel,
  ctx: {
    semHistorico: boolean
    semProjecao: boolean
    nParcelas: number
    janelaTruncada: boolean
    parcela: string
    n: number
    mesCritico: string
    critico: SimuladorVereditoMes | null
    cartaoNome: string
    bumpDuracao: boolean
    algumUso70: boolean
    kPesados: number
  }
): string => {
  if (ctx.semProjecao) return FRASE_SEM_PROJECAO
  if (nivel === 'baixo') return fraseBaixo(ctx)
  if (nivel === 'moderado') return fraseModerado(ctx)
  return fraseAlto(ctx)
}

const colunaDoIndice = (
  view: ProjecaoFaturasView | undefined,
  indice: number
): { mes: number; ano: number; chave: string; label: string } | null => {
  const col = view?.colunas?.[indice]
  if (!col) return null
  return {
    mes: col.mes,
    ano: col.ano,
    chave: col.chave,
    label: col.label || labelCompetencia(col.mes, col.ano),
  }
}

export const calcularVereditoCompra = (opts: {
  base: ProjecaoFaturasView
  overlay: ProjecaoFaturasView
  cartaoId: number
  cartaoNome: string
  nParcelas: number
  valorCompra: number
  overlayInput: SimuladorOverlayResult
}): SimuladorVeredito | null => {
  const { base, overlay, cartaoId, cartaoNome, overlayInput } = opts
  if (!base) return null

  const nParcelas = Math.max(1, Math.floor(opts.nParcelas) || 1)
  const cartaoBase = (base.por_cartao || []).find((c) => Number(c.cartao_id) === Number(cartaoId))
  const cartaoOver = (overlay.por_cartao || []).find((c) => Number(c.cartao_id) === Number(cartaoId))
  const limite = cartaoOver?.limite_credito ?? cartaoBase?.limite_credito ?? null
  const semLimite = limite == null || !Number.isFinite(Number(limite)) || Number(limite) <= 0
  const valorParcela =
    overlayInput.primeira?.valor ?? (nParcelas > 0 ? roundMoney(opts.valorCompra / nParcelas) : 0)

  const naJanela = (overlayInput.parcelas || []).filter(
    (p) => p.na_janela && p.indice_coluna != null && p.indice_coluna >= 0
  )

  let indices = Array.from(
    new Set(naJanela.map((p) => Number(p.indice_coluna)).filter((i) => Number.isFinite(i)))
  ).sort((a, b) => a - b)

  if (!indices.length) {
    const firstDelta = (overlayInput.deltas || []).findIndex((d) => Number(d) > 0)
    if (firstDelta >= 0) indices = [firstDelta]
  }

  const janelaTruncada = nParcelas > indices.length
  const primeira = overlayInput.primeira
  const ultima = overlayInput.ultima
  const contexto = montarContexto({
    cartaoNome,
    valorCompra: opts.valorCompra,
    nParcelas,
    primeiraLabel: primeira ? labelCompetencia(primeira.mes, primeira.ano) : '',
    ultimaLabel: ultima ? labelCompetencia(ultima.mes, ultima.ano) : '',
  })

  const empty = (extra: Partial<SimuladorVeredito>): SimuladorVeredito => ({
    nivel: 'moderado',
    titulo: TITULO.moderado,
    eyebrow: EYEBROW.moderado,
    frase: FRASE_SEM_PROJECAO,
    contexto,
    motivos: [{ id: 'parcela', label: nParcelas <= 1 ? 'à vista' : `${nParcelas}x` }],
    meses: [],
    mesCritico: null,
    nParcelas,
    valorParcela,
    valorCompra: opts.valorCompra,
    cartaoNome,
    semLimite,
    janelaTruncada,
    bumpDuracao: false,
    kPesados: 0,
    semProjecao: true,
    ...extra,
  })

  if (!indices.length) {
    return empty({
      nivel: 'moderado',
      titulo: TITULO.moderado,
      eyebrow: EYEBROW.moderado,
      frase: FRASE_SEM_PROJECAO,
    })
  }

  const meses: SimuladorVereditoMes[] = indices.map((indice) => {
    const col = colunaDoIndice(overlay, indice) || colunaDoIndice(base, indice)
    const antes = roundMoney(Number(cartaoBase?.valores?.[indice]?.total || 0))
    const depoisOverlay = Number(cartaoOver?.valores?.[indice]?.total)
    const delta = roundMoney(Number(overlayInput.deltas?.[indice] || 0))
    const depois =
      Number.isFinite(depoisOverlay) && cartaoOver
        ? roundMoney(depoisOverlay)
        : roundMoney(antes + delta)
    const parcela = roundMoney(depois - antes || delta)
    const usoDepois = semLimite
      ? null
      : cartaoOver?.valores?.[indice]?.percentual_utilizado ?? null
    const peso = antes > 0 ? parcela / antes : null
    const score = nivelMes(antes, depois, parcela, semLimite ? null : Number(limite), usoDepois)
    const mes = col?.mes ?? primeira?.mes ?? 1
    const ano = col?.ano ?? primeira?.ano ?? new Date().getFullYear()
    const label = col?.label || labelCompetencia(mes, ano)
    return {
      indice,
      chave: col?.chave || `${ano}-${String(mes).padStart(2, '0')}`,
      label,
      labelCurto: label.split('/')[0] || label,
      mes,
      ano,
      antes,
      depois,
      parcela,
      limite: semLimite ? null : Number(limite),
      usoDepois,
      peso,
      score,
      ehCritico: false,
    }
  })

  const kPesados = meses.filter((m) => m.score >= 1).length
  const maxScore = meses.reduce((acc, m) => Math.max(acc, m.score), 0)
  const bumpDuracao = nParcelas > 1 && maxScore === 1 && kPesados >= 4
  const scoreGlobal = bumpDuracao ? 2 : maxScore
  const nivel = nivelFromScore(scoreGlobal)

  const semHistorico = semLimite && meses.every((m) => m.antes <= 0)
  const nivelFinal: SimuladorVereditoNivel = semHistorico ? 'baixo' : nivel

  const critico = pickMesCritico(meses)
  const mesesMarcados = meses.map((m) => ({
    ...m,
    ehCritico: Boolean(critico && m.indice === critico.indice),
  }))
  const mesCritico = mesesMarcados.find((m) => m.ehCritico) || critico

  const algumUso70 = meses.some((m) => m.usoDepois != null && m.usoDepois >= 70)
  const frase = fraseDoNivel(nivelFinal, {
    semHistorico,
    semProjecao: false,
    nParcelas,
    janelaTruncada,
    parcela: formatBRL(valorParcela),
    n: nParcelas,
    mesCritico: mesCritico?.label || '',
    critico: mesCritico,
    cartaoNome,
    bumpDuracao,
    algumUso70,
    kPesados,
  })

  return {
    nivel: nivelFinal,
    titulo: TITULO[nivelFinal],
    eyebrow: EYEBROW[nivelFinal],
    frase,
    contexto,
    motivos: montarMotivos({
      critico: mesCritico,
      limite: semLimite ? null : Number(limite),
      bumpDuracao,
      kPesados,
      nParcelas,
    }),
    meses: mesesMarcados,
    mesCritico,
    nParcelas,
    valorParcela,
    valorCompra: opts.valorCompra,
    cartaoNome,
    semLimite,
    janelaTruncada,
    bumpDuracao,
    kPesados,
    semProjecao: false,
  }
}
