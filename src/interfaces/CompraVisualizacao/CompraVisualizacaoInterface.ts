export type CompraTituloOrigem = 'observacoes' | 'estabelecimento'

export type CompraStatusParcela = 'paga' | 'atual' | 'aberta'

export interface CompraVisualizacaoSearch {
  mes?: number | null
  ano?: number | null
}

export interface CompraRefIdNome {
  id: number
  nome: string
}

export interface CompraEstabelecimentoRef {
  id: number
  nome: string
  loja_id?: number | null
  loja_nome?: string | null
}

export interface CompraCategoriaRef {
  id: number
  nome: string
  cor?: string | null
}

export interface CompraSubcategoriaRef {
  id: number
  nome: string
}

export interface CompraResponsavelRef {
  id: number
  nome: string
  tipo?: string | null
}

export interface CompraCartaoRef {
  id: number
  nome: string
  banco?: string | null
  cor_fundo?: string | null
  cor_texto?: string | null
}

export interface CompraBandeiraRef {
  id: number
  nome: string
}

export interface CompraCartaoNumeroRef {
  id: number
  ultimos_digitos?: string | null
  tipo?: string | null
  tipo_label?: string | null
  apelido?: string | null
  nome_no_cartao?: string | null
}

export interface CompraParcelaResumo {
  parcela_atual: number
  mes: number
  ano: number
  valor: number
  fatura_id?: number | null
}

export interface CompraParcelaRepasse {
  status_repasse?: string | null
  status_repasse_label?: string | null
  valor_pago?: number | null
  valor_aberto?: number | null
  data_ultimo?: string | null
}

export interface CompraParcelaItem {
  id: number
  parcela_atual: number
  parcelas_total: number
  data?: string | null
  valor: number
  fatura_id?: number | null
  fatura_mes?: number | null
  fatura_ano?: number | null
  fatura_label?: string | null
  fatura_status?: string | null
  fatura_status_label?: string | null
  paga?: boolean
  status_parcela?: CompraStatusParcela | string | null
  status_parcela_label?: string | null
  importada_pdf?: boolean
  repasse?: CompraParcelaRepasse | null
}

export interface CompraVisualizacaoView {
  referencia?: { mes: number; ano: number } | null
  compra_grupo_id?: string | null
  transacao_id?: number | null
  avista?: boolean
  titulo?: string | null
  titulo_origem?: CompraTituloOrigem | string | null
  observacoes?: string | null
  data_compra?: string | null
  tipo?: string | null
  tipo_label?: string | null
  origem_compra?: string | null
  origem_compra_label?: string | null
  importada_pdf?: boolean
  parcelas_total?: number | null
  parcela_atual?: number | null
  parcelas_pagas?: number | null
  parcelas_restantes?: number | null
  valor_parcela?: number | null
  valor_total?: number | null
  valor_pago?: number | null
  valor_aberto?: number | null
  percentual_pago?: number | null
  quitada?: boolean
  estimativa_termino?: string | null
  estabelecimento?: CompraEstabelecimentoRef | null
  categoria?: CompraCategoriaRef | null
  subcategoria?: CompraSubcategoriaRef | null
  responsavel?: CompraResponsavelRef | null
  cartao?: CompraCartaoRef | null
  bandeira?: CompraBandeiraRef | null
  cartao_numero?: CompraCartaoNumeroRef | null
  primeira_parcela?: CompraParcelaResumo | null
  competencia_atual?: CompraParcelaResumo | null
  ultima_parcela?: CompraParcelaResumo | null
  proxima_parcela?: CompraParcelaResumo | null
  parcelas?: CompraParcelaItem[]
  categoria_nome?: string | null
  cartao_nome?: string | null
  cartao_cor_fundo?: string | null
  cartao_cor_texto?: string | null
}

export interface CompraVisualizacaoInterface {
  getVisualizarCompra(
    identificador: string,
    params?: CompraVisualizacaoSearch
  ): Promise<CompraVisualizacaoView | undefined>
}
