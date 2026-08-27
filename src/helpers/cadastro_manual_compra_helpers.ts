import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import { TransacoesList, TransacoesModel } from 'interfaces/Transacoes/TransacoesInterface'

export type CompetenciaRef = { mes: number; ano: number }

export type TituloListagemCompra = {
  titulo: string
  subtitulo: string | null
}

const unwrapCreateData = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const transacao = root.transacao
  if (transacao && typeof transacao === 'object') {
    const envelope = transacao as Record<string, unknown>
    if (envelope.data && typeof envelope.data === 'object') {
      return envelope.data as Record<string, unknown>
    }
    return envelope
  }
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>
  }
  return root
}

const firstTransacaoId = (data: Record<string, unknown>): string | null => {
  const transacoes = data.transacoes
  if (Array.isArray(transacoes) && transacoes[0] && typeof transacoes[0] === 'object') {
    const id = (transacoes[0] as { id?: unknown }).id
    if (id != null && String(id).trim() !== '') return String(id)
  }
  if (data.id != null && String(data.id).trim() !== '') return String(data.id)
  if (data.transacao_id != null && String(data.transacao_id).trim() !== '') {
    return String(data.transacao_id)
  }
  return null
}

/** UUID do grupo (parcelada) ou id da 1ª transação (à vista). */
export const identificadorAposCadastro = (body: unknown): string | null => {
  const data = unwrapCreateData(body)
  if (!data) return null
  const grupo = data.compra_grupo_id
  if (grupo != null && String(grupo).trim() !== '') return String(grupo)
  return firstTransacaoId(data)
}

export const mensagemAposCadastro = (body: unknown, fallback: string): string => {
  if (!body || typeof body !== 'object') return fallback
  const root = body as Record<string, unknown>
  const transacao = root.transacao
  if (transacao && typeof transacao === 'object') {
    const message = (transacao as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message.trim()
  }
  if (typeof root.message === 'string' && root.message.trim()) return root.message.trim()
  return fallback
}

export const pathVisualizacaoCompra = (
  identificador: string,
  mes?: number | null,
  ano?: number | null
): string => {
  const path = `/compras/${encodeURIComponent(identificador)}`
  const params = new URLSearchParams()
  if (mes) params.set('mes', String(mes))
  if (ano) params.set('ano', String(ano))
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export const pathVisualizacaoDaLinha = (row: {
  id?: number | null
  compra_grupo_id?: string | number | null
}): string | null => {
  const identificador = row.compra_grupo_id || row.id
  if (identificador == null || String(identificador).trim() === '') return null
  return pathVisualizacaoCompra(String(identificador))
}

export const tituloListagemCompra = (row: {
  texto_compra?: string | null
  descricao?: string | null
  observacoes?: string | null
  descricao_fatura?: string | null
  estabelecimento_nome?: string | null
  estabelecimento?: string | null
  loja_nome?: string | null
}): TituloListagemCompra => {
  const textoCompra = String(row.texto_compra ?? row.observacoes ?? row.descricao ?? '').trim()
  const estabelecimento = String(row.estabelecimento_nome ?? row.estabelecimento ?? '').trim()
  const loja = String(row.loja_nome ?? '').trim()
  const descricaoFatura = String(row.descricao_fatura ?? '').trim()
  const titulo = textoCompra || estabelecimento || '—'
  const estabelecimentoLabel = estabelecimento || '—'

  const subParts = [
    textoCompra ? `Estabelecimento ${estabelecimentoLabel}` : null,
    !textoCompra && descricaoFatura && descricaoFatura !== titulo ? descricaoFatura : null,
    loja && loja !== estabelecimento && loja !== titulo ? loja : null,
  ].filter(Boolean)

  return { titulo, subtitulo: subParts.join(' · ') || null }
}

/** Só a compra que o usuário cadastrou (Nova compra / Posso comprar). Nunca inferir por `importada_pdf`. */
export const isCompraManual = (row?: { compra_manual?: boolean | null } | null): boolean =>
  row?.compra_manual === true

export type OrigemLancamentoTipo = 'manual' | 'pdf' | 'automatica'

export type OrigemLancamentoInfo = {
  tipo: OrigemLancamentoTipo
  label: string
  icon: string
  tone: string
}

/**
 * Origem persistida pelo back (`compra_manual`).
 * PDF = linha importada do anexo; automática = parcela materializada em fatura vizinha.
 */
export const origemLancamentoCompra = (row?: {
  compra_manual?: boolean | null
  importada_pdf?: boolean | null
} | null): OrigemLancamentoInfo | null => {
  if (!row) return null
  if (row.compra_manual === true) {
    return { tipo: 'manual', label: 'Cadastro manual', icon: 'ri-edit-line', tone: 'warning' }
  }
  if (row.importada_pdf === true) {
    return { tipo: 'pdf', label: 'Importada da fatura', icon: 'ri-file-pdf-line', tone: 'info' }
  }
  if (row.compra_manual === false) {
    return { tipo: 'automatica', label: 'Gerada automaticamente', icon: 'ri-repeat-line', tone: 'secondary' }
  }
  return null
}

export const precisaConciliarCompra = (row?: {
  precisa_conciliar?: boolean | null
  compra_manual?: boolean | null
  /** Ignorado: origem vem de `compra_manual`, não do PDF. */
  importada_pdf?: boolean | null
  status_conciliacao?: string | null
} | null): boolean => {
  if (!row) return false
  // PDF e parcelas copiadas para faturas sem anexo nunca pedem conciliar — só a compra cadastrada à mão.
  if (row.compra_manual === false) return false
  if (row.precisa_conciliar === true) return true
  if (row.precisa_conciliar === false) return false
  if (row.compra_manual !== true) return false
  const status = String(row.status_conciliacao ?? '').trim()
  if (status === 'conciliada' || status === 'rejeitada') return false
  return status === 'nao_conciliada' || status === 'pendente' || !status
}

export const labelPrecisaConciliar = (row?: {
  precisa_conciliar_label?: string | null
} | null): string =>
  String(row?.precisa_conciliar_label ?? '').trim() || 'Compra manual · conciliar com a fatura'

export const contaNoTotalLinha = (row?: { conta_no_total?: boolean | null } | null): boolean => {
  if (!row) return true
  return row.conta_no_total !== false
}

export const valorContaNoTotal = (row?: { conta_no_total?: boolean | null; valor?: number | string | null } | null): number =>
  contaNoTotalLinha(row) ? Number(row?.valor ?? 0) : 0

const moneyOrNull = (value?: number | string | null): number | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export type TotaisConciliacaoFatura = {
  valorExtrato: number
  valorNaoConciliado: number
  valorTotalComPendencias: number
  temComprasNaoConciliadas: boolean
  labelNaoConciliadas: string
}

/**
 * Totais do detalhe da fatura: extrato (PDF) + compras manuais ainda abertas.
 * Prefere os campos do GET /faturas/listar/{id}. Não soma o extrato no front.
 */
export const totaisConciliacaoFatura = (
  fatura?: {
    valor_total?: number | string | null
    valor_extrato?: number | string | null
    valor_nao_conciliado?: number | string | null
    valor_total_com_pendencias?: number | string | null
    tem_compras_nao_conciliadas?: boolean | null
    compras_nao_conciliadas_label?: string | null
    pagamentos_antecipado?: number | string | null
  } | null,
  transacoes: Array<{
    valor?: number | string | null
    compra_manual?: boolean | null
    precisa_conciliar?: boolean | null
    status_conciliacao?: string | null
    importada_pdf?: boolean | null
  }> = []
): TotaisConciliacaoFatura => {
  const valorQuitacao = moneyOrNull(fatura?.valor_total) ?? 0
  const antecipado = Math.max(moneyOrNull(fatura?.pagamentos_antecipado) ?? 0, 0)
  const extratoApi = moneyOrNull(fatura?.valor_extrato)
  const extratoPareceQuitacao = extratoApi != null
    && antecipado > 0.009
    && Math.abs(extratoApi - valorQuitacao) < 0.02

  const valorExtrato = extratoPareceQuitacao
    ? roundMoney(valorQuitacao + antecipado)
    : (extratoApi ?? roundMoney(valorQuitacao + antecipado))

  const valorNaoConciliadoApi = moneyOrNull(fatura?.valor_nao_conciliado)
  const valorNaoConciliado = valorNaoConciliadoApi != null
    ? roundMoney(Math.max(valorNaoConciliadoApi, 0))
    : roundMoney(transacoes.reduce((acc, tx) => (
      precisaConciliarCompra(tx) ? acc + Number(tx.valor ?? 0) : acc
    ), 0))

  const valorTotalComPendencias = roundMoney(valorExtrato + valorNaoConciliado)

  const temComprasNaoConciliadas = valorNaoConciliado > 0.009
    && fatura?.tem_compras_nao_conciliadas !== false

  const labelNaoConciliadas = String(fatura?.compras_nao_conciliadas_label ?? '').trim()
    || 'Compras ainda não conciliadas'

  return {
    valorExtrato,
    valorNaoConciliado,
    valorTotalComPendencias,
    temComprasNaoConciliadas,
    labelNaoConciliadas,
  }
}

export const identificadorCompraManualVinculada = (row?: {
  compra_manual_vinculada?: {
    id?: number | string | null
    compra_grupo_id?: string | number | null
  } | null
} | null): string | null => {
  const vinculada = row?.compra_manual_vinculada
  if (!vinculada) return null
  const id = vinculada.compra_grupo_id ?? vinculada.id
  if (id == null || String(id).trim() === '') return null
  return String(id)
}

export const conciliadaComManual = (row?: {
  conciliada_com_manual?: boolean | null
  compra_manual_vinculada?: { id?: number | string | null } | null
  status_conciliacao?: string | null
  compra_manual?: boolean | null
} | null): boolean => {
  if (!row) return false
  if (row.conciliada_com_manual === true) return true
  if (row.conciliada_com_manual === false) return false
  if (row.compra_manual === true) return false
  return Boolean(identificadorCompraManualVinculada(row)) && String(row.status_conciliacao ?? '') === 'conciliada'
}

export const labelConciliadaComManual = (row?: {
  conciliada_com_manual_label?: string | null
} | null): string =>
  String(row?.conciliada_com_manual_label ?? '').trim() || 'Conciliada com compra manual'

export const temSugestaoConciliacao = (row?: {
  tem_sugestao_conciliacao?: boolean | null
  sugestao_conciliacao_label?: string | null
  status_conciliacao?: string | null
  compra_manual?: boolean | null
  precisa_conciliar?: boolean | null
} | null): boolean => {
  if (!row || precisaConciliarCompra(row) || conciliadaComManual(row)) return false
  if (row.tem_sugestao_conciliacao === true) return true
  if (row.tem_sugestao_conciliacao === false) return false
  if (row.compra_manual === true) return false
  return String(row.status_conciliacao ?? '') === 'pendente'
}

export const labelSugestaoConciliacao = (row?: {
  sugestao_conciliacao_label?: string | null
  compra_manual_vinculada?: { texto_compra?: string | null; observacoes?: string | null } | null
} | null): string => {
  const label = String(row?.sugestao_conciliacao_label ?? '').trim()
  if (label) return label
  const texto = String(
    row?.compra_manual_vinculada?.texto_compra
    ?? row?.compra_manual_vinculada?.observacoes
    ?? ''
  ).trim()
  return texto
    ? `Pode ser a compra manual «${texto}»`
    : 'Pode ser uma compra manual desta fatura'
}

export const tituloLinhaFatura = (row: {
  texto_compra?: string | null
  descricao?: string | null
  observacoes?: string | null
  descricao_fatura?: string | null
  estabelecimento_nome?: string | null
  estabelecimento?: string | null
  loja_nome?: string | null
  compra_manual?: boolean | null
  precisa_conciliar?: boolean | null
  status_conciliacao?: string | null
  compra_manual_vinculada?: {
    texto_compra?: string | null
    observacoes?: string | null
  } | null
}): TituloListagemCompra => {
  if (precisaConciliarCompra(row) || isCompraManual(row)) {
    return tituloListagemCompra(row)
  }
  const estabelecimento = String(
    row.estabelecimento_nome ?? row.estabelecimento ?? row.descricao_fatura ?? ''
  ).trim()
  const textoManual = String(
    row.compra_manual_vinculada?.texto_compra
    ?? row.compra_manual_vinculada?.observacoes
    ?? row.texto_compra
    ?? row.observacoes
    ?? ''
  ).trim()
  const titulo = estabelecimento || textoManual || String(row.descricao ?? '').trim() || '—'
  const subtitulo = textoManual && textoManual !== titulo ? textoManual : null
  return { titulo, subtitulo }
}

export const idLancamentoCandidato = (item: {
  lancamento_id?: number | string | null
  id?: number | string | null
}): number | null => {
  const id = item.lancamento_id ?? item.id
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const idCompraCandidato = (item: {
  compra_id?: number | string | null
  compra_grupo_id?: string | number | null
  id?: number | string | null
}): string | null => {
  const id = item.compra_grupo_id ?? item.compra_id ?? item.id
  if (id == null || String(id).trim() === '') return null
  return String(id)
}

export const labelCandidatoConciliacao = (item: {
  texto_compra?: string | null
  observacoes?: string | null
  descricao_fatura?: string | null
  descricao?: string | null
  estabelecimento_nome?: string | null
  valor?: number | string | null
  data?: string | null
  id?: number | string | null
}): string => {
  const nome = String(
    item.texto_compra
    ?? item.observacoes
    ?? item.descricao_fatura
    ?? item.descricao
    ?? item.estabelecimento_nome
    ?? ''
  ).trim() || `Lançamento #${item.id ?? ''}`
  return nome
}

export const textoCompraDaCompra = (compra?: {
  texto_compra?: string | null
  observacoes?: string | null
  descricao?: string | null
  titulo?: string | null
} | null): string =>
  String(compra?.texto_compra ?? compra?.observacoes ?? compra?.descricao ?? compra?.titulo ?? '').trim()

export const LABEL_ESTABELECIMENTO_VAZIO = '—'


export const faturaIdDaCompra = (compra?: CompraVisualizacaoView | null): number | null => {
  const id =
    compra?.competencia_atual?.fatura_id
    ?? compra?.primeira_parcela?.fatura_id
    ?? compra?.parcelas?.find((p) => p.status_parcela === 'atual')?.fatura_id
    ?? compra?.parcelas?.[0]?.fatura_id
    ?? null
  return id != null ? Number(id) : null
}

export const dataCaiForaDaFaturaAberta = (
  preview: CompetenciaRef | null | undefined,
  faturaAberta: CompetenciaRef | null | undefined
): boolean => {
  if (!preview || !faturaAberta) return false
  return preview.mes !== faturaAberta.mes || preview.ano !== faturaAberta.ano
}

export const faturaAbertaDoSource = (source?: {
  fatura_mes?: number | string | null
  fatura_ano?: number | string | null
  mes?: number | string | null
  ano?: number | string | null
} | null): CompetenciaRef | null => {
  const mes = Number(source?.fatura_mes ?? source?.mes)
  const ano = Number(source?.fatura_ano ?? source?.ano)
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) return null
  if (!Number.isFinite(ano) || ano < 2000) return null
  return { mes, ano }
}

export const compraToEditSource = (compra: CompraVisualizacaoView): Partial<TransacoesModel> & TransacoesList => {
  const transacaoId = compra.transacao_id ?? compra.parcelas?.[0]?.id ?? null
  const valorLinha = compra.avista
    ? compra.valor_total
    : (compra.competencia_atual?.valor ?? compra.valor_parcela ?? compra.valor_total)
  const faturaId = faturaIdDaCompra(compra)

  return {
    id: transacaoId ?? undefined,
    transacao_id: transacaoId,
    cartao_id: compra.cartao?.id ?? null,
    cartao_numero_id: compra.cartao_numero?.id ?? null,
    cartao_numero: compra.cartao_numero
      ? {
          id: compra.cartao_numero.id,
          ultimos_digitos: compra.cartao_numero.ultimos_digitos ?? undefined,
          tipo: compra.cartao_numero.tipo ?? undefined,
          apelido: compra.cartao_numero.apelido ?? undefined,
          nome_no_cartao: compra.cartao_numero.nome_no_cartao ?? undefined,
        }
      : null,
    fatura_id: faturaId ?? undefined,
    data: compra.data_compra ?? null,
    estabelecimento_id: compra.estabelecimento?.id ?? null,
    estabelecimento: compra.estabelecimento?.nome ?? null,
    estabelecimento_nome: compra.estabelecimento?.nome,
    loja_nome: compra.estabelecimento?.loja_nome,
    valor: valorLinha ?? null,
    valor_compra: compra.valor_total ?? null,
    parcelas_total: compra.parcelas_total ?? 1,
    parcela_atual: compra.parcela_atual ?? null,
    compra_grupo_id: compra.compra_grupo_id ?? null,
    tipo: compra.tipo ?? 'purchase',
    origem_compra: compra.origem_compra ?? null,
    eh_assinatura: compra.eh_assinatura ?? false,
    categoria_id: compra.categoria?.id ?? null,
    categoria_nome: compra.categoria?.nome,
    subcategoria_id: compra.subcategoria?.id ?? null,
    subcategoria_nome: compra.subcategoria?.nome,
    responsavel_id: compra.responsavel?.id ?? null,
    responsavel_nome: compra.responsavel?.nome,
    responsavel_tipo: compra.responsavel?.tipo ?? undefined,
    observacoes: compra.observacoes ?? compra.texto_compra ?? compra.descricao ?? compra.titulo ?? null,
    descricao: compra.descricao ?? compra.texto_compra ?? compra.observacoes ?? null,
    cartao_nome: compra.cartao?.nome,
  }
}

export const identificadorDaCompra = (compra?: {
  compra_grupo_id?: string | number | null
  transacao_id?: number | null
  parcelas?: { id?: number | null }[] | null
} | null): string | null => {
  if (!compra) return null
  if (compra.compra_grupo_id != null && String(compra.compra_grupo_id).trim() !== '') {
    return String(compra.compra_grupo_id)
  }
  const id = compra.transacao_id ?? compra.parcelas?.[0]?.id
  return id != null ? String(id) : null
}

export const badgeConciliacaoColor = (status?: string | null): string => {
  switch (status) {
    case 'conciliada':
      return 'success'
    case 'pendente':
      return 'warning'
    case 'rejeitada':
      return 'secondary'
    case 'nao_conciliada':
    default:
      return 'warning'
  }
}

export const badgeConciliacaoStyle = (status?: string | null): {
  backgroundColor: string
  borderColor: string
  color: string
} | undefined => {
  if (status === 'pendente') {
    return { backgroundColor: '#f97316', borderColor: '#f97316', color: '#fff' }
  }
  if (status === 'nao_conciliada') {
    return { backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }
  }
  return undefined
}

export const ANEXO_TIPO_LABEL: Record<string, string> = {
  nota_fiscal: 'Nota fiscal',
  comprovante: 'Comprovante',
  recibo: 'Recibo',
  print: 'Print',
  pdf: 'PDF',
  imagem: 'Imagem',
  outro: 'Outro',
}

export const formatTamanhoAnexo = (bytes?: number | null): string => {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export const ANEXO_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif'
export const ANEXO_MAX_BYTES = 10 * 1024 * 1024

export const MENSAGEM_CAMPO_COMPRA = {
  observacoes: 'Informe a descrição da compra',
  valor_compra: 'Valor da compra é obrigatório',
  data: 'Informe a data da compra',
  cartao_id: 'Cartão é obrigatório',
  cartao_numero_id: 'Selecione o cartão (final) da compra',
  origem_compra: 'Origem da compra é obrigatória',
  soma_parcelas: 'A soma das parcelas deve ser igual ao valor da compra',
  parcelas_total: 'Quantidade de parcelas deve ser entre 1 e 36',
  sem_finais: 'Cadastre ao menos um final de cartão neste cartão/bandeira',
} as const

export const mensagemParcelaObrigatoria = (n: number): string =>
  `Valor da parcela ${n} é obrigatório`

export type ErrosFormularioCompra = Record<string, string>

export type ValidarFormularioCompraInput = {
  isEdit?: boolean
  validarDescricao?: boolean
  observacoes?: string | null
  valor_compra?: string | number | null
  data?: string | null
  cartao_id?: string | number | null
  fatura_id?: string | number | null
  cartao_numero_id?: string | number | null
  origem_compra?: string | null
  exigeFinalCartao?: boolean
  parcelas?: Array<string | number | null | undefined>
}

const ORDEM_CAMPOS_FORMULARIO_COMPRA = [
  'observacoes',
  'cartao_id',
  'cartao_numero_id',
  'data',
  'origem_compra',
  'valor_compra',
] as const

const isBlank = (value: unknown): boolean => {
  if (value == null) return true
  if (typeof value === 'number') return Number.isNaN(value)
  return String(value).trim() === ''
}

const isBlankId = (value: unknown): boolean => {
  if (isBlank(value)) return true
  return value === 0 || value === '0'
}

/** Mesma regra de `toCentavos` em fatura_helpers, sem importar axios. */
const centavosDoValor = (value: string | number | null | undefined): number => {
  if (value == null || value === '') return 0
  if (typeof value === 'number') return Math.round(value * 100)

  const str = String(value).trim()
  if (!str) return 0

  if (str.includes(',')) {
    const n = parseFloat(str.replace(/\./g, '').replace(',', '.'))
    return Math.round((Number.isNaN(n) ? 0 : n) * 100)
  }

  if (str.includes('.')) {
    const n = parseFloat(str)
    return Math.round((Number.isNaN(n) ? 0 : n) * 100)
  }

  const digits = str.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

export const valorCompraEstaInformado = (value: unknown): boolean => {
  if (value == null || value === '') return false
  if (typeof value === 'string' && value.trim() === '') return false
  const cents = centavosDoValor(value as string | number)
  return Number.isFinite(cents) && cents > 0
}

export const validarFormularioCompra = (
  input: ValidarFormularioCompraInput
): ErrosFormularioCompra => {
  const erros: ErrosFormularioCompra = {}
  const validarDescricao = input.validarDescricao !== false

  if (validarDescricao && isBlank(input.observacoes)) {
    erros.observacoes = MENSAGEM_CAMPO_COMPRA.observacoes
  }

  if (!valorCompraEstaInformado(input.valor_compra)) {
    erros.valor_compra = MENSAGEM_CAMPO_COMPRA.valor_compra
  }

  if (isBlank(input.data)) {
    erros.data = MENSAGEM_CAMPO_COMPRA.data
  }

  if (isBlankId(input.cartao_id) && isBlankId(input.fatura_id)) {
    erros.cartao_id = MENSAGEM_CAMPO_COMPRA.cartao_id
  }

  if (input.exigeFinalCartao && isBlankId(input.cartao_numero_id)) {
    erros.cartao_numero_id = MENSAGEM_CAMPO_COMPRA.cartao_numero_id
  }

  if (isBlank(input.origem_compra) || input.origem_compra === '0') {
    erros.origem_compra = MENSAGEM_CAMPO_COMPRA.origem_compra
  }

  if (!input.isEdit && Array.isArray(input.parcelas) && input.parcelas.length > 1) {
    input.parcelas.forEach((valor, idx) => {
      if (!valorCompraEstaInformado(valor)) {
        erros[`parcela_${idx + 1}`] = mensagemParcelaObrigatoria(idx + 1)
      }
    })
    const soma = input.parcelas.reduce((acc, valor) => acc + centavosDoValor(valor), 0)
    const total = centavosDoValor(input.valor_compra)
    if (Math.abs(soma - total) > 1) {
      erros.parcelas = MENSAGEM_CAMPO_COMPRA.soma_parcelas
    }
  }

  return erros
}

export const primeiroCampoInvalido = (erros: ErrosFormularioCompra): string | null => {
  for (const campo of ORDEM_CAMPOS_FORMULARIO_COMPRA) {
    if (erros[campo]) return campo
  }
  const parcelas = Object.keys(erros)
    .filter((key) => /^parcela_\d+$/.test(key))
    .sort((a, b) => Number(a.slice(8)) - Number(b.slice(8)))
  if (parcelas[0]) return parcelas[0]
  if (erros.parcelas) return 'parcelas'
  if (erros.parcelas_total) return 'parcelas_total'
  return Object.keys(erros)[0] ?? null
}

const CAMPOS_POR_MENSAGEM_API: Record<string, string[]> = {
  'Cartão é obrigatório': ['cartao_id'],
  'Informe a descrição da compra': ['observacoes'],
  'Valor da compra é obrigatório': ['valor_compra'],
  'Origem da compra é obrigatória': ['origem_compra'],
  'Origem da compra inválida': ['origem_compra'],
  'Selecione o cartão (final) da compra': ['cartao_numero_id'],
  'Cadastre ao menos um final de cartão neste cartão/bandeira': ['cartao_numero_id'],
  'Cartão (final) inválido para esta compra': ['cartao_numero_id'],
  'Quantidade de parcelas deve ser entre 1 e 36': ['parcelas_total'],
  'Valor inválido': ['valor_compra'],
  'Subcategoria exige categoria informada': ['subcategoria_id', 'categoria_id'],
  'Subcategoria não está vinculada à categoria informada': ['subcategoria_id'],
}

export const camposPorMensagemApiCompra = (message?: string | null): string[] => {
  const msg = String(message ?? '').trim()
  if (!msg) return []
  if (CAMPOS_POR_MENSAGEM_API[msg]) return CAMPOS_POR_MENSAGEM_API[msg]

  const parcela = msg.match(/^Valor da parcela (\d+) é obrigatório$/)
  if (parcela) return [`parcela_${parcela[1]}`]

  if (/^A soma das parcelas/.test(msg) && /deve ser igual ao valor da compra/.test(msg)) {
    return ['parcelas', 'valor_compra']
  }

  if (
    /^Parcela \d+ duplicada$/.test(msg)
    || /^Parcela \d+ não informada$/.test(msg)
    || msg === 'Número da parcela inválido'
    || msg === 'A quantidade de parcelas informadas deve ser igual a parcelas_total'
  ) {
    return ['parcelas']
  }

  return []
}

export const aplicarErrosMensagemApiCompra = (
  message?: string | null
): ErrosFormularioCompra => {
  const msg = String(message ?? '').trim()
  const erros: ErrosFormularioCompra = {}
  for (const campo of camposPorMensagemApiCompra(msg)) {
    erros[campo] = msg
  }
  return erros
}

