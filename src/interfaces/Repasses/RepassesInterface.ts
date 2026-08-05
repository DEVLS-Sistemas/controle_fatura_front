export type StatusRepasse = 'pendente' | 'parcial' | 'pago'

export interface RepassesSearch {
  responsavel_id?: number | string | null
  mes?: number | string | null
  ano?: number | string | null
  janela?: number | string | null
  incluir_abertos?: boolean | number | string | null
  somente_abertos?: boolean | number | string | null
  cartao_id?: number | string | null
  transacao_id?: number | string | null
}

export interface RepasseColuna {
  mes: number
  ano: number
  chave: string
  label: string
  referencia: boolean
}

export interface RepasseCelula {
  transacao_id: number
  fatura_id?: number | null
  parcela_atual?: number | null
  parcelas_total?: number | null
  valor_devido: number
  valor_pago: number
  valor_aberto: number
  status_repasse: StatusRepasse
  data_ultimo_pagamento?: string | null
  qtd_repasses?: number
}

export interface RepasseCompra {
  chave_compra: string
  compra_grupo_id?: string | number | null
  transacao_id_avista?: number | null
  estabelecimento?: string | null
  observacoes?: string | null
  data_compra?: string | null
  cartao_id?: number | null
  cartao_nome?: string | null
  cartao_cor_fundo?: string | null
  cartao_cor_texto?: string | null
  ultimos_digitos?: string | null
  parcelas_total?: number | null
  valor_total: number
  valor_pago: number
  valor_aberto: number
  parcelas_pagas?: number
  parcelas_parciais?: number
  parcelas_pendentes?: number
  status_repasse: StatusRepasse
  celulas: Record<string, RepasseCelula>
}

export interface RepasseMatrizResumo {
  valor_total_compras?: number
  valor_pago: number
  valor_aberto: number
  compras_abertas?: number
  compras_pagas?: number
  parcelas_pendentes_na_referencia?: number
  valor_aberto_na_referencia?: number
}

export interface RepasseMatrizView {
  responsavel_id: number
  responsavel_nome?: string
  responsavel_tipo?: string
  referencia: { mes: number; ano: number }
  colunas: RepasseColuna[]
  resumo: RepasseMatrizResumo
  compras: RepasseCompra[]
}

export interface RepasseList {
  id?: number
  user_id?: number
  transacao_id?: number
  valor?: number | string
  data_pagamento?: string
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface RepasseModel {
  id?: number | null
  transacao_id?: number | null
  valor?: string | number | null
  data_pagamento?: string | null
  observacoes?: string | null
  quitar?: boolean
}

export interface RepasseQuitarCompetenciaPayload {
  responsavel_id: number | string
  mes: number | string
  ano: number | string
  data_pagamento: string
}

export interface LookupsRepasses {
  status_repasse?: Array<{ value: StatusRepasse; label: string }>
  responsaveis?: Array<{ id?: number; nome?: string; tipo?: string }>
}

export interface RepassesInterface {
  getMatriz(params: RepassesSearch): Promise<RepasseMatrizView | undefined>
  listRepasses(params: { transacao_id: number | string }): Promise<RepasseList[]>
  getViewRepasse(id: number | string): Promise<RepasseList | undefined>
  createRepasse(params: RepasseModel): Promise<any>
  editRepasse(params: RepasseModel): Promise<any>
  deleteRepasse(id: number): Promise<any>
  quitarCompetencia(params: RepasseQuitarCompetenciaPayload): Promise<any>
  getLookups(): Promise<LookupsRepasses | undefined>
}

export const RepasseDefaultValues: RepasseModel = {
  id: null,
  transacao_id: null,
  valor: null,
  data_pagamento: null,
  observacoes: null,
  quitar: false,
}
