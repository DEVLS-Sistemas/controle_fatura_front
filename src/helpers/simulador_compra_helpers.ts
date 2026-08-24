import { splitValorEmParcelas, toCentavos } from 'helpers/fatura_helpers'
import { pessoaNomeCompleto, PessoaListItem } from 'interfaces/Pessoas/PessoasInterface'
import {
  ProjecaoColuna,
  ProjecaoFaturasView,
  ProjecaoPorCartao,
  ProjecaoPorResponsavel,
  ProjecaoSplitParte,
  ProjecaoUsoLimite,
  ProjecaoValor,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import {
  SimuladorImpacto,
  SimuladorImpactoValor,
  SimuladorOverlayResult,
  SimuladorParcela,
} from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { ResponsavelLookup } from 'interfaces/Transacoes/TransacoesInterface'

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_NOMES = [
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

export const roundMoney = (n: number): number => Math.round((Number(n) || 0) * 100) / 100

export const competenciaChave = (mes: number, ano: number): string =>
  `${ano}-${String(mes).padStart(2, '0')}`

export const labelCompetencia = (mes: number, ano: number): string =>
  `${MESES_ABREV[(mes || 1) - 1] || String(mes)}/${ano}`

export const labelCompetenciaCompleta = (mes: number, ano: number): string =>
  `${MESES_NOMES[(mes || 1) - 1] || String(mes)}/${ano}`

export const adicionarMesesCompetencia = (
  mes: number,
  ano: number,
  delta: number
): { mes: number; ano: number } => {
  const cursor = new Date(ano, mes - 1 + delta, 1)
  return { mes: cursor.getMonth() + 1, ano: cursor.getFullYear() }
}

export const diasNoMes = (mes: number, ano: number): number => new Date(ano, mes, 0).getDate()

export const todayISO = (): string => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const parseISODate = (
  iso?: string | null
): { day: number; mes: number; ano: number } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '').trim())
  if (!m) return null
  return { ano: Number(m[1]), mes: Number(m[2]), day: Number(m[3]) }
}

/**
 * Mesma regra do cadastro de compra (`Cartao::periodoFaturaParaData`):
 * data.day <= dia_limite → competência do mês da data;
 * data.day > dia_limite → mês seguinte;
 * dia_limite null → mês calendário.
 */
export const competenciaPrimeiraParcela = (
  dataISO: string | null | undefined,
  diaLimite: number | null | undefined
): { mes: number; ano: number } | null => {
  const parsed = parseISODate(dataISO)
  if (!parsed) return null
  if (diaLimite == null || !Number.isFinite(Number(diaLimite))) {
    return { mes: parsed.mes, ano: parsed.ano }
  }
  const limite = Math.min(Math.max(1, Math.floor(Number(diaLimite))), diasNoMes(parsed.mes, parsed.ano))
  if (parsed.day <= limite) return { mes: parsed.mes, ano: parsed.ano }
  return adicionarMesesCompetencia(parsed.mes, parsed.ano, 1)
}

/** Deep-link `valor=3000` = R$ 3.000; com vírgula/ponto usa a máscara de centavos. */
export const parseValorQuery = (raw?: string | null): string | null => {
  if (raw == null || String(raw).trim() === '') return null
  const str = String(raw).trim()
  if (str.includes(',') || str.includes('.')) {
    const cents = toCentavos(str)
    return cents > 0 ? String(cents) : null
  }
  const n = Number(str.replace(/\s/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return String(Math.round(n * 100))
}

export const parseQueryNumber = (raw?: string | null): number | null => {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export const cartoesDoTitular = (
  porCartao: ProjecaoPorCartao[] | undefined,
  pessoaId: number | null,
  ehPrincipal: boolean
): ProjecaoPorCartao[] => filtrarCartoesDoTitular(porCartao || [], pessoaId, ehPrincipal)

const pessoaIdCartao = (pessoaId?: number | string | null): number | null => {
  if (pessoaId == null || pessoaId === '') return null
  const n = Number(pessoaId)
  return Number.isFinite(n) ? n : null
}

/** Cartões do titular: `pessoa_id` igual ao titular. Legado sem titular só no principal, e só se a lista já tiver algum cartão com titular. Nunca devolve a lista inteira. */
export const filtrarCartoesDoTitular = <T extends { pessoa_id?: number | string | null }>(
  cartoes: T[] | undefined,
  pessoaId: number | null | undefined,
  ehPrincipal: boolean
): T[] => {
  if (!cartoes?.length || pessoaId == null || pessoaId === '') return []
  const titularId = Number(pessoaId)
  if (!Number.isFinite(titularId)) return []
  const temTitularNaLista = cartoes.some((c) => pessoaIdCartao(c.pessoa_id) != null)
  return cartoes.filter((c) => {
    const id = pessoaIdCartao(c.pessoa_id)
    if (id != null && id === titularId) return true
    if (temTitularNaLista && ehPrincipal && id == null) return true
    return false
  })
}

export const titularPrincipal = (pessoas: PessoaListItem[]): PessoaListItem | undefined =>
  pessoas.find((p) => p.eh_principal === true) ?? pessoas[0]

export const responsavelPadraoDoTitular = (opts: {
  titular: PessoaListItem | undefined
  pessoasDetalhe?: PessoaListItem | undefined
  defaultResponsavelId?: number | null
  responsaveis: ResponsavelLookup[]
}): number | null => {
  const { titular, pessoasDetalhe, defaultResponsavelId, responsaveis } = opts
  if (!titular) return defaultResponsavelId ?? null
  if (titular.eh_principal) return defaultResponsavelId ?? null

  const fromCadastro =
    pessoasDetalhe?.responsavel_id ?? titular.responsavel_id ?? null
  if (fromCadastro != null) return Number(fromCadastro)

  const nomeTitular = pessoaNomeCompleto(pessoasDetalhe || titular).trim().toLowerCase()
  if (!nomeTitular) return defaultResponsavelId ?? null
  const match = responsaveis.find(
    (r) => String(r.nome || '').trim().toLowerCase() === nomeTitular
  )
  return match?.id != null ? Number(match.id) : defaultResponsavelId ?? null
}

export const somaParcelasBate = (parcelasCentavos: number[], valorCentavos: number): boolean => {
  if (parcelasCentavos.length <= 1) return true
  const soma = parcelasCentavos.reduce((acc, v) => acc + (Number(v) || 0), 0)
  return Math.abs(soma - valorCentavos) <= 1
}

const emptySplit = (): ProjecaoSplitParte => ({
  realizado: 0,
  projetado: 0,
  total: 0,
  percentual: null,
  percentual_do_limite: null,
})

const emptyValor = (): ProjecaoValor => ({
  realizado: 0,
  projetado: 0,
  total: 0,
  fonte: 'vazio',
  em_uso: 0,
  livre: null,
  percentual_utilizado: null,
  percentual_livre: null,
  disponivel: null,
  percentual_participacao: null,
})

const cloneView = (data: ProjecaoFaturasView): ProjecaoFaturasView =>
  JSON.parse(JSON.stringify(data)) as ProjecaoFaturasView

const pctOf = (parte: number, total: number | null | undefined): number | null => {
  if (total == null || !Number.isFinite(Number(total)) || Number(total) <= 0) return null
  return roundMoney((parte / Number(total)) * 100)
}

const recalcSplitPct = (
  parte: ProjecaoSplitParte | undefined,
  totalGasto: number,
  limite: number | null | undefined
): ProjecaoSplitParte => {
  const next = { ...(parte || emptySplit()) }
  next.percentual = totalGasto > 0 ? pctOf(next.total, totalGasto) : null
  next.percentual_do_limite =
    limite != null && Number(limite) > 0 ? pctOf(next.total, limite) : null
  return next
}

const aplicarLimiteNaCelula = (valor: ProjecaoValor, limite: number | null | undefined) => {
  valor.em_uso = valor.total
  if (limite == null || !Number.isFinite(Number(limite)) || Number(limite) <= 0) {
    valor.livre = null
    valor.percentual_utilizado = null
    valor.percentual_livre = null
    valor.disponivel = null
    return
  }
  const lim = Number(limite)
  valor.livre = roundMoney(lim - valor.total)
  valor.disponivel = valor.livre
  valor.percentual_utilizado = pctOf(valor.total, lim)
  valor.percentual_livre = pctOf(Number(valor.livre), lim)
}

const somarDeltaNoSplit = (
  valor: ProjecaoValor,
  delta: number,
  paraEu: boolean,
  limite: number | null | undefined
) => {
  const totalDepois = valor.total
  if (paraEu) {
    const meu = { ...(valor.meu || emptySplit()) }
    meu.total = roundMoney(meu.total + delta)
    valor.meu = recalcSplitPct(meu, totalDepois, limite)
    valor.outros = recalcSplitPct(valor.outros, totalDepois, limite)
  } else {
    const outros = { ...(valor.outros || emptySplit()) }
    outros.total = roundMoney(outros.total + delta)
    valor.outros = recalcSplitPct(outros, totalDepois, limite)
    valor.meu = recalcSplitPct(valor.meu, totalDepois, limite)
  }
}

const aplicarDeltaNaCelula = (
  valor: ProjecaoValor,
  delta: number,
  limite: number | null | undefined,
  paraEu: boolean,
  temSplit: boolean
) => {
  if (!(delta > 0)) return
  valor.total_antes = roundMoney(valor.total)
  valor.simulado = roundMoney((valor.simulado || 0) + delta)
  valor.total = roundMoney(valor.total + delta)
  valor.projetado = roundMoney(Number(valor.projetado || 0) + delta)
  if (valor.fonte === 'vazio') valor.fonte = 'projecao'
  aplicarLimiteNaCelula(valor, limite)
  if (temSplit) somarDeltaNoSplit(valor, delta, paraEu, limite)
}

const atualizarUsoLimite = (
  uso: ProjecaoUsoLimite | null | undefined,
  valorRef: ProjecaoValor | undefined,
  limite: number | null | undefined
): ProjecaoUsoLimite | null | undefined => {
  if (!uso && !valorRef) return uso
  const lim = uso?.limite ?? limite ?? null
  const emUso = valorRef?.em_uso ?? valorRef?.total ?? uso?.em_uso ?? 0
  const livre =
    lim != null && Number(lim) > 0 ? roundMoney(Number(lim) - Number(emUso)) : null
  return {
    limite: lim,
    em_uso: emUso,
    percentual_em_uso: pctOf(Number(emUso), lim),
    livre,
    percentual_livre: pctOf(Number(livre || 0), lim),
    meu: valorRef?.meu ?? uso?.meu,
    outros: valorRef?.outros ?? uso?.outros,
  }
}

const valoresVazios = (n: number, limite?: number | null): ProjecaoValor[] =>
  Array.from({ length: n }, () => {
    const v = emptyValor()
    aplicarLimiteNaCelula(v, limite)
    return v
  })

const garantirResponsavel = (
  lista: ProjecaoPorResponsavel[],
  opts: {
    responsavelId: number
    nome: string
    ehEu: boolean
    nColunas: number
  }
): ProjecaoPorResponsavel => {
  const found = lista.find((r) => Number(r.responsavel_id) === opts.responsavelId)
  if (found) return found
  const stub: ProjecaoPorResponsavel = {
    responsavel_id: opts.responsavelId,
    nome: opts.nome,
    eh_eu: opts.ehEu,
    valores: valoresVazios(opts.nColunas),
    total: 0,
  }
  lista.push(stub)
  return stub
}

const somaValores = (valores: ProjecaoValor[]): number =>
  roundMoney(valores.reduce((acc, v) => acc + Number(v?.total || 0), 0))

const recalcularParticipacao = (lista: ProjecaoPorResponsavel[], totais: number[]) => {
  lista.forEach((resp) => {
    resp.valores.forEach((valor, i) => {
      const den = totais[i] || 0
      valor.percentual_participacao = den > 0 ? pctOf(valor.total, den) : null
    })
    resp.total = somaValores(resp.valores)
  })
}

export const montarParcelasSimuladas = (opts: {
  valorCentavos: number
  nParcelas: number
  valoresManuaisCentavos?: number[]
  dataISO: string | null | undefined
  diaLimite: number | null | undefined
  colunas: ProjecaoColuna[]
}): SimuladorOverlayResult => {
  const n = Math.max(1, Math.min(36, Math.floor(opts.nParcelas) || 1))
  const valorCentavos = Math.max(0, Math.round(opts.valorCentavos || 0))
  const manuais = opts.valoresManuaisCentavos
  const cents =
    n > 1 && manuais && manuais.length === n
      ? manuais.map((v) => Math.max(0, Math.round(Number(v) || 0)))
      : splitValorEmParcelas(valorCentavos, n).map((s) => parseInt(s || '0', 10) || 0)

  const totaisBatem = n <= 1 || somaParcelasBate(cents, valorCentavos)
  const primeiraComp = competenciaPrimeiraParcela(opts.dataISO, opts.diaLimite)
  const colunas = opts.colunas || []
  const deltas = colunas.map(() => 0)
  const parcelas: SimuladorParcela[] = []

  if (!primeiraComp || valorCentavos <= 0 || !totaisBatem) {
    return {
      parcelas,
      deltas,
      parcelas_na_janela: 0,
      parcelas_fora_da_janela: 0,
      primeira: null,
      ultima: null,
      totais_batem: totaisBatem,
    }
  }

  let fora = 0
  for (let k = 0; k < n; k++) {
    const comp = adicionarMesesCompetencia(primeiraComp.mes, primeiraComp.ano, k)
    const chave = competenciaChave(comp.mes, comp.ano)
    const idx = colunas.findIndex((c) => c.chave === chave || (c.mes === comp.mes && c.ano === comp.ano))
    const naJanela = idx >= 0
    const valor = roundMoney(cents[k] / 100)
    if (naJanela) deltas[idx] = roundMoney(deltas[idx] + valor)
    else fora += 1
    const col = naJanela ? colunas[idx] : undefined
    parcelas.push({
      parcela: k + 1,
      valor,
      mes: comp.mes,
      ano: comp.ano,
      chave,
      label: col?.label || labelCompetencia(comp.mes, comp.ano),
      na_janela: naJanela,
      indice_coluna: naJanela ? idx : null,
    })
  }

  return {
    parcelas,
    deltas,
    parcelas_na_janela: n - fora,
    parcelas_fora_da_janela: fora,
    primeira: parcelas[0] || null,
    ultima: parcelas[parcelas.length - 1] || null,
    totais_batem: totaisBatem,
  }
}

export const aplicarOverlaySimulacao = (
  base: ProjecaoFaturasView,
  opts: {
    cartaoId: number
    responsavelId: number
    responsavelNome: string
    ehEu: boolean
    deltas: number[]
  }
): ProjecaoFaturasView => {
  const view = cloneView(base)
  const colunas = view.colunas || []
  const n = colunas.length
  const deltas = (opts.deltas || []).slice(0, n)
  while (deltas.length < n) deltas.push(0)
  if (!deltas.some((d) => d > 0)) return view

  const paraEu = opts.ehEu || Number(view.responsavel_eu_id) === Number(opts.responsavelId)
  const idxRef = colunas.findIndex((c) => c.referencia)

  const cartao = (view.por_cartao || []).find((c) => Number(c.cartao_id) === Number(opts.cartaoId))
  if (cartao) {
    cartao.valores = cartao.valores || valoresVazios(n, cartao.limite_credito)
    cartao.valores.forEach((valor, i) => {
      aplicarDeltaNaCelula(valor, deltas[i], cartao.limite_credito, paraEu, true)
    })
    cartao.total = somaValores(cartao.valores)
    if (idxRef >= 0) {
      cartao.uso_limite = atualizarUsoLimite(
        cartao.uso_limite,
        cartao.valores[idxRef],
        cartao.limite_credito
      )
    }
    if (cartao.resumo_eu_outros?.length) {
      cartao.resumo_eu_outros = cartao.valores.map((valor, i) => ({
        meu: valor.meu || cartao.resumo_eu_outros![i]?.meu || emptySplit(),
        outros: valor.outros || cartao.resumo_eu_outros![i]?.outros || emptySplit(),
        total: valor.total,
      }))
    }
  }

  const cruz = (view.por_cartao_responsavel || []).find(
    (c) => Number(c.cartao_id) === Number(opts.cartaoId)
  )
  if (cruz) {
    cruz.valores = cruz.valores || valoresVazios(n, cruz.limite_credito)
    cruz.valores.forEach((valor, i) => {
      aplicarDeltaNaCelula(valor, deltas[i], cruz.limite_credito, paraEu, true)
    })
    cruz.total = somaValores(cruz.valores)
    if (idxRef >= 0) {
      cruz.uso_limite = atualizarUsoLimite(cruz.uso_limite, cruz.valores[idxRef], cruz.limite_credito)
    }
    const respLinha = garantirResponsavel(cruz.por_responsavel || (cruz.por_responsavel = []), {
      responsavelId: opts.responsavelId,
      nome: opts.responsavelNome,
      ehEu: paraEu,
      nColunas: n,
    })
    respLinha.valores.forEach((valor, i) => {
      aplicarDeltaNaCelula(valor, deltas[i], null, paraEu, false)
    })
    const totaisCartao = cruz.valores.map((v) => Number(v.total || 0))
    recalcularParticipacao(cruz.por_responsavel, totaisCartao)
  }

  const respGeral = garantirResponsavel(view.por_responsavel || (view.por_responsavel = []), {
    responsavelId: opts.responsavelId,
    nome: opts.responsavelNome,
    ehEu: paraEu,
    nColunas: n,
  })
  respGeral.valores.forEach((valor, i) => {
    aplicarDeltaNaCelula(valor, deltas[i], null, paraEu, false)
  })

  if (view.totais_por_coluna?.length) {
    view.totais_por_coluna.forEach((tot, i) => {
      const d = deltas[i] || 0
      if (!(d > 0)) return
      tot.cartoes = {
        ...tot.cartoes,
        total: roundMoney(Number(tot.cartoes?.total || 0) + d),
      }
      tot.responsaveis = {
        ...tot.responsaveis,
        total: roundMoney(Number(tot.responsaveis?.total || 0) + d),
      }
    })
  }

  const totaisResp = (view.totais_por_coluna || []).map((t) => Number(t.responsaveis?.total || 0))
  if (totaisResp.length === n) {
    recalcularParticipacao(view.por_responsavel, totaisResp)
  } else {
    respGeral.total = somaValores(respGeral.valores)
  }

  if (view.resumo_eu_outros?.length) {
    view.resumo_eu_outros = view.resumo_eu_outros.map((resumo, i) => {
      const d = deltas[i] || 0
      if (!(d > 0)) return resumo
      const next = {
        meu: { ...(resumo.meu || emptySplit()) },
        outros: { ...(resumo.outros || emptySplit()) },
        total: roundMoney(Number(resumo.total || 0) + d),
      }
      if (paraEu) next.meu.total = roundMoney(next.meu.total + d)
      else next.outros.total = roundMoney(next.outros.total + d)
      next.meu = recalcSplitPct(next.meu, next.total, null)
      next.outros = recalcSplitPct(next.outros, next.total, null)
      return next
    })
  }

  return view
}

const impactoValor = (antes: number, simulado: number): SimuladorImpactoValor => ({
  antes: roundMoney(antes),
  simulado: roundMoney(simulado),
  depois: roundMoney(antes + simulado),
})

const cellTotal = (valores: ProjecaoValor[] | undefined, idx: number): number =>
  roundMoney(Number(valores?.[idx]?.total || 0))

const somaSerie = (valores: ProjecaoValor[] | undefined): number =>
  roundMoney((valores || []).reduce((acc, v) => acc + Number(v?.total || 0), 0))

export const calcularImpactoSimulacao = (opts: {
  base: ProjecaoFaturasView
  overlay: ProjecaoFaturasView
  cartaoId: number
  responsavelId: number
  deltas: number[]
  primeira: SimuladorParcela | null
}): SimuladorImpacto => {
  const colunas = opts.base.colunas || []
  const idxPrimeira =
    opts.primeira?.indice_coluna != null && opts.primeira.indice_coluna >= 0
      ? opts.primeira.indice_coluna
      : colunas.findIndex((c) => c.referencia)
  const idx = idxPrimeira >= 0 ? idxPrimeira : 0
  const competencia = colunas[idx] || null
  const simuladoColuna = roundMoney(opts.deltas[idx] || 0)

  const cartaoBase = (opts.base.por_cartao || []).find((c) => Number(c.cartao_id) === opts.cartaoId)
  const cartaoOver = (opts.overlay.por_cartao || []).find((c) => Number(c.cartao_id) === opts.cartaoId)
  const cruzBase = (opts.base.por_cartao_responsavel || []).find(
    (c) => Number(c.cartao_id) === opts.cartaoId
  )
  const respCartaoBase = cruzBase?.por_responsavel?.find(
    (r) => Number(r.responsavel_id) === opts.responsavelId
  )
  const respGeralBase = (opts.base.por_responsavel || []).find(
    (r) => Number(r.responsavel_id) === opts.responsavelId
  )
  const respGeralOver = (opts.overlay.por_responsavel || []).find(
    (r) => Number(r.responsavel_id) === opts.responsavelId
  )

  const nesteAntes = cellTotal(respCartaoBase?.valores, idx)
  const geralAntes = cellTotal(respGeralBase?.valores, idx)
  const outrosAntes = roundMoney(geralAntes - nesteAntes)
  const faturaAntes = cellTotal(cartaoBase?.valores, idx)
  const limite = cartaoOver?.limite_credito ?? cartaoBase?.limite_credito ?? null
  const faturaDepois = roundMoney(faturaAntes + simuladoColuna)
  const livreDepois =
    limite != null && Number(limite) > 0 ? roundMoney(Number(limite) - faturaDepois) : null

  return {
    competencia,
    neste_cartao: impactoValor(nesteAntes, simuladoColuna),
    outros_cartoes: impactoValor(outrosAntes, 0),
    geral_responsavel: impactoValor(geralAntes, simuladoColuna),
    fatura_cartao: {
      ...impactoValor(faturaAntes, simuladoColuna),
      limite,
      percentual_em_uso_depois: pctOf(faturaDepois, limite),
      livre_depois: livreDepois,
      percentual_livre_depois: pctOf(Number(livreDepois || 0), limite),
    },
    soma_janela_neste_cartao: impactoValor(
      somaSerie(respCartaoBase?.valores),
      roundMoney((opts.deltas || []).reduce((a, b) => a + b, 0))
    ),
    soma_janela_geral: impactoValor(
      somaSerie(respGeralBase?.valores),
      roundMoney((opts.deltas || []).reduce((a, b) => a + b, 0))
    ),
    soma_janela_fatura: impactoValor(
      somaSerie(cartaoBase?.valores),
      roundMoney((opts.deltas || []).reduce((a, b) => a + b, 0))
    ),
  }
}

export const breakdownResponsavelPorCartao = (opts: {
  overlay: ProjecaoFaturasView
  base: ProjecaoFaturasView
  responsavelId: number
  cartaoSimuladoId: number
  indice: number
}): Array<{
  cartao_id: number
  nome: string
  cor_fundo?: string | null
  cor_texto?: string | null
  antes: number
  simulado: number
  depois: number
  eh_simulado: boolean
}> => {
  const grupos = opts.overlay.por_cartao_responsavel || []
  return grupos
    .map((grupo) => {
      const respOver = grupo.por_responsavel?.find(
        (r) => Number(r.responsavel_id) === opts.responsavelId
      )
      const grupoBase = (opts.base.por_cartao_responsavel || []).find(
        (c) => Number(c.cartao_id) === Number(grupo.cartao_id)
      )
      const respBase = grupoBase?.por_responsavel?.find(
        (r) => Number(r.responsavel_id) === opts.responsavelId
      )
      const depois = cellTotal(respOver?.valores, opts.indice)
      const antes = cellTotal(respBase?.valores, opts.indice)
      const eh = Number(grupo.cartao_id) === Number(opts.cartaoSimuladoId)
      if (depois <= 0 && antes <= 0 && !eh) return null
      return {
        cartao_id: grupo.cartao_id,
        nome: grupo.nome,
        cor_fundo: grupo.cor_fundo,
        cor_texto: grupo.cor_texto,
        antes,
        simulado: roundMoney(depois - antes),
        depois,
        eh_simulado: eh,
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
}
