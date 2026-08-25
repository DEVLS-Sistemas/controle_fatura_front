export type AssinaturaStatus = 'candidata' | 'confirmada' | 'ignorada'
export type AssinaturaStatusFiltro = AssinaturaStatus | 'todas'

export type AssinaturaAcao = 'confirmar' | 'ignorar' | 'restaurar' | 'desfazer_confirmacao'

export type AssinaturaPeriodicidade =
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'irregular'

export type AssinaturaConfianca = 'alta' | 'media' | 'baixa'

export interface AssinaturaLookupOption {
  value?: string | number | null
  label?: string | null
}

export interface LookupsAssinaturas {
  status?: AssinaturaLookupOption[]
  periodicidades?: AssinaturaLookupOption[]
  confiancas?: AssinaturaLookupOption[]
  acoes?: AssinaturaLookupOption[]
  ordenar?: AssinaturaLookupOption[]
  origem_confirmacao?: AssinaturaLookupOption
}

export interface AssinaturasSearch {
  status?: AssinaturaStatusFiltro | string | null
  periodicidade?: string | null
  palavra_chave?: string | null | unknown
  ordenar?: string | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  categoria_id?: number | string | null
}

export interface AssinaturaEstabelecimento {
  id?: number | null
  nome?: string | null
}

export interface AssinaturaCobranca {
  id?: number | string | null
  transacao_id?: number | string | null
  data?: string | null
  valor?: number | null
  origem_compra?: string | null
  origem_compra_label?: string | null
  estabelecimento_id?: number | null
  estabelecimento_nome?: string | null
  fatura_id?: number | null
  fatura_mes?: number | null
  fatura_ano?: number | null
  confirmada?: boolean | null
  eh_assinatura?: boolean | null
}

export interface AssinaturaItem {
  identificador: string
  titulo?: string | null
  status?: AssinaturaStatus | string | null
  status_label?: string | null
  periodicidade?: AssinaturaPeriodicidade | string | null
  periodicidade_label?: string | null
  periodicidade_assumida?: boolean | null
  confianca?: AssinaturaConfianca | string | null
  confianca_label?: string | null
  cobrancas?: number | null
  cobrancas_confirmadas?: number | null
  cobrancas_pendentes?: number | null
  valor_medio?: number | null
  valor_ultima?: number | null
  gasto_12_meses?: number | null
  estimativa_mensal?: number | null
  estimativa_anual?: number | null
  primeira_cobranca?: string | null
  ultima_cobranca?: string | null
  proxima_estimada?: string | null
  loja_id?: number | null
  loja_nome?: string | null
  estabelecimento_id?: number | null
  estabelecimento_nome?: string | null
  estabelecimentos?: AssinaturaEstabelecimento[]
  categoria_id?: number | null
  categoria_nome?: string | null
  categoria_cor?: string | null
  subcategoria_id?: number | null
  subcategoria_nome?: string | null
  responsavel_id?: number | null
  responsavel_nome?: string | null
  origem_compra_predominante?: string | null
  origem_compra_predominante_label?: string | null
  ignorada?: boolean | null
  pode_confirmar?: boolean | null
  acoes_disponiveis?: AssinaturaAcao[] | string[] | null
}

export interface AssinaturaView extends AssinaturaItem {
  cobrancas_recentes?: AssinaturaCobranca[]
}

export interface AssinaturasTotais {
  assinaturas?: number
  confirmadas?: number
  candidatas?: number
  pendentes_confirmacao?: number
  gasto_12_meses?: number
  estimativa_mensal?: number
  estimativa_anual?: number
  gasto_12_meses_confirmadas?: number
  estimativa_anual_confirmadas?: number
  estimativa_anual_candidatas?: number
}

export interface AssinaturasListView {
  referencia?: { hoje?: string | null }
  ordenar_aplicada?: string | null
  status_aplicado?: string | null
  totais?: AssinaturasTotais
  /** Lista oficial — preferir este campo */
  assinaturas?: AssinaturaItem[]
  /** Sugestões do detector — nunca misturar com a oficial */
  candidatas?: AssinaturaItem[]
  ignoradas?: AssinaturaItem[]
  /** Atalho legado; no default só a oficial. Preferir assinaturas + candidatas. */
  itens?: AssinaturaItem[]
}

export interface AssinaturasModel {
  identificador?: string
  transacao_id?: number | string | null
  acao?: AssinaturaAcao | string | null
  loja_id?: number | null
  estabelecimento_id?: number | null
}

export interface AssinaturasListItem {
  id?: string
  nome?: string
}

export interface AssinaturasInterface {
  getLookupsAssinaturas(): Promise<LookupsAssinaturas | undefined>
  listAssinaturas(params: AssinaturasSearch): Promise<AssinaturasListView | undefined>
  getViewAssinaturas(identificador: string): Promise<AssinaturaView | undefined>
  AsyncListAssinaturas(params: AssinaturasSearch): Promise<AssinaturasListItem[] | undefined>
  createAssinaturas(params: AssinaturasModel): Promise<any>
  editAssinaturas(params: AssinaturasModel): Promise<any>
  deleteAssinaturas(identificador: string): Promise<any>
}

export const AssinaturasDefaultValues: AssinaturasSearch = {
  status: 'todas',
  periodicidade: null,
  palavra_chave: null,
  ordenar: 'anual_desc',
  cartao_id: null,
  responsavel_id: null,
  categoria_id: null,
}

export const AssinaturaAcaoDefaultValues: AssinaturasModel = {
  identificador: '',
  transacao_id: null,
  acao: 'confirmar',
}
