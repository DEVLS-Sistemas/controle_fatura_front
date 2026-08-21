export type RankingParceladasOrdenar =
  | 'restantes_desc'
  | 'restantes_asc'
  | 'percentual_asc'
  | 'percentual_desc'
  | 'valor_aberto_desc'
  | 'data_compra_desc'

export type RankingParceladaTituloOrigem = 'observacoes' | 'estabelecimento'

export type RankingParceladasVisualizacao = 'lista' | 'competencias'

export interface RankingParceladasSearch {
  mes?: number | null
  ano?: number | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  categoria_id?: number | string | null
  apenas_abertas?: boolean | number | string | null
  ordenar?: RankingParceladasOrdenar | string | null
  palavra_chave?: string | null | unknown
}

export interface RankingParceladaParcelaResumo {
  parcela_atual: number
  mes: number
  ano: number
  valor: number
  fatura_id?: number | null
}

export type RankingParceladaProximaParcela = RankingParceladaParcelaResumo
export type RankingParceladaUltimaParcela = RankingParceladaParcelaResumo

export interface RankingParceladaColuna {
  mes: number
  ano: number
  chave: string
  label: string
  centro: boolean
  indice: number
}

export interface RankingParceladaTimeline {
  inicio_chave?: string | null
  fim_chave?: string | null
  progresso_chave?: string | null
  indice_inicio?: number | null
  indice_fim?: number | null
  indice_progresso?: number | null
  fora_da_janela?: boolean
}

export interface RankingParceladaItem {
  compra_grupo_id: string
  titulo: string
  titulo_origem?: RankingParceladaTituloOrigem | string | null
  observacoes?: string | null
  estabelecimento_id?: number | null
  estabelecimento_nome?: string | null
  data_compra?: string | null
  parcelas_total: number
  parcela_atual: number
  parcelas_pagas: number
  parcelas_restantes: number
  valor_parcela?: number | null
  valor_total: number
  valor_pago: number
  valor_aberto: number
  percentual_pago: number
  quitada?: boolean
  estimativa_termino?: string | null
  categoria_id?: number | null
  categoria_nome?: string | null
  subcategoria_id?: number | null
  subcategoria_nome?: string | null
  responsavel_id?: number | null
  responsavel_nome?: string | null
  cartao_id?: number | null
  cartao_nome?: string | null
  cartao_cor_fundo?: string | null
  cartao_cor_texto?: string | null
  cartao_bandeira_id?: number | null
  bandeira_nome?: string | null
  origem_compra?: string | null
  proxima_parcela?: RankingParceladaParcelaResumo | null
  primeira_parcela?: RankingParceladaParcelaResumo | null
  ultima_parcela?: RankingParceladaParcelaResumo | null
  competencia_atual?: RankingParceladaParcelaResumo | null
  timeline?: RankingParceladaTimeline | null
}

export interface RankingParceladasTotais {
  compras: number
  valor_total: number
  valor_pago: number
  valor_aberto: number
  percentual_pago: number
}

export interface RankingParceladasView {
  referencia: { mes: number; ano: number }
  colunas?: RankingParceladaColuna[]
  totais: RankingParceladasTotais
  itens: RankingParceladaItem[]
}

export interface RankingParceladasInterface {
  getRankingParceladas(params: RankingParceladasSearch): Promise<RankingParceladasView | undefined>
}

export const RankingParceladasDefaultValues: RankingParceladasSearch = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  cartao_id: null,
  responsavel_id: null,
  categoria_id: null,
  apenas_abertas: true,
  ordenar: 'percentual_asc',
  palavra_chave: null,
}

export const RANKING_VIEW_STORAGE_KEY = 'ranking_parceladas_view'
