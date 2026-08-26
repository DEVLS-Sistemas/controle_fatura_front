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
  descricao?: string | null
  observacoes?: string | null
  descricao_fatura?: string | null
  estabelecimento_nome?: string | null
  estabelecimento?: string | null
  loja_nome?: string | null
}): TituloListagemCompra => {
  const descricao = String(row.descricao ?? '').trim()
  const observacoes = String(row.observacoes ?? '').trim()
  const estabelecimento = String(row.estabelecimento_nome ?? row.estabelecimento ?? '').trim()
  const loja = String(row.loja_nome ?? '').trim()
  const descricaoFatura = String(row.descricao_fatura ?? '').trim()
  const titulo = descricao || observacoes || estabelecimento || '—'

  const subParts = [
    descricaoFatura && descricaoFatura !== titulo ? descricaoFatura : null,
    !descricaoFatura && estabelecimento && estabelecimento !== titulo ? estabelecimento : null,
    loja && loja !== estabelecimento && loja !== titulo ? loja : null,
  ].filter(Boolean)

  return { titulo, subtitulo: subParts.join(' · ') || null }
}

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
    observacoes: compra.observacoes ?? null,
    descricao: compra.descricao
      ?? (compra.titulo_origem === 'descricao' || compra.titulo_origem === 'observacoes'
        ? compra.titulo
        : null)
      ?? null,
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

