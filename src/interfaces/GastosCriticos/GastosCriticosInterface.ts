export type GastosCriticosMeses = 1 | 3 | 6 | 12

export type GastosCriticosRankingCriterio = 'gasto' | 'compras'

export type GastosCriticosDimensao =
  | 'lojas'
  | 'estabelecimentos'
  | 'categorias'
  | 'subcategorias'

export type GastosCriticosEntidadeTipo =
  | 'loja'
  | 'estabelecimento'
  | 'categoria'
  | 'subcategoria'

export type GastosCriticosAlertaTipo = 'frequencia' | 'gasto' | 'concentracao' | 'evolucao'

export type GastosCriticosSeveridade = 'alta' | 'media' | 'baixa'

export type GastosCriticosAtalhoRota = 'lojas' | 'estabelecimentos' | 'transacoes'

export const GASTOS_CRITICOS_MESES_STORAGE_KEY = 'gastos_criticos_meses'
export const GASTOS_CRITICOS_RANKING_STORAGE_KEY = 'gastos_criticos_ranking'

export interface GastosCriticosSearch {
  meses?: number | null
  data_inicio?: string | null
  data_fim?: string | null
  mes?: number | string | null
  ano?: number | string | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  categoria_id?: number | string | null
}

export interface GastosCriticosAtalhoQuery {
  data_inicio?: string | null
  data_fim?: string | null
  mes?: number | string | null
  ano?: number | string | null
  categoria_id?: number | string | null
  subcategoria_id?: number | string | null
  estabelecimento_id?: number | string | null
  loja_id?: number | string | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  [key: string]: string | number | null | undefined
}

export interface GastosCriticosAtalho {
  rota?: GastosCriticosAtalhoRota | string | null
  id?: number | string | null
  query?: GastosCriticosAtalhoQuery | null
}

export interface GastosCriticosFrequencia {
  label?: string | null
  por_mes?: number | null
  por_dia?: number | null
  por_semana?: number | null
  intervalo_medio_dias?: number | null
}

export interface GastosCriticosPeriodo {
  inicio?: string | null
  fim?: string | null
  meses?: number | null
  dias?: number | null
  origem?: string | null
  label?: string | null
  label_frase?: string | null
}

export interface GastosCriticosPeriodoAnterior {
  inicio?: string | null
  fim?: string | null
  label?: string | null
}

export interface GastosCriticosTotais {
  valor_total?: number | null
  compras?: number | null
  ocorrencias?: number | null
  ticket_medio?: number | null
  valor_anterior?: number | null
  compras_anterior?: number | null
  variacao_valor_percentual?: number | null
  variacao_compras_percentual?: number | null
  frequencia?: GastosCriticosFrequencia | null
}

export interface GastosCriticosDestaque {
  tipo?: string | null
  entidade_tipo?: GastosCriticosEntidadeTipo | string | null
  chave?: string | null
  id?: number | string | null
  nome?: string | null
  nome_exibicao?: string | null
  frase?: string | null
  contexto?: string | null
  valor_total?: number | null
  compras?: number | null
  percentual_gasto?: number | null
  percentual_compras?: number | null
  frequencia?: GastosCriticosFrequencia | null
  atalho?: GastosCriticosAtalho | null
}

export interface GastosCriticosDestaques {
  maior_gasto?: GastosCriticosDestaque | null
  mais_comprado?: GastosCriticosDestaque | null
}

export interface GastosCriticosAlertaEntidade {
  tipo?: GastosCriticosEntidadeTipo | string | null
  chave?: string | null
  id?: number | string | null
  nome_exibicao?: string | null
}

export interface GastosCriticosAlertaMetricas {
  compras?: number | null
  valor_total?: number | null
  percentual_gasto?: number | null
  percentual_compras?: number | null
  frequencia?: GastosCriticosFrequencia | null
}

export interface GastosCriticosAlerta {
  id?: string | null
  tipo?: GastosCriticosAlertaTipo | string | null
  motivos?: Array<GastosCriticosAlertaTipo | string> | null
  severidade?: GastosCriticosSeveridade | string | null
  titulo?: string | null
  frase?: string | null
  contexto?: string | null
  entidade?: GastosCriticosAlertaEntidade | null
  metricas?: GastosCriticosAlertaMetricas | null
  atalho?: GastosCriticosAtalho | null
}

export interface GastosCriticosRankingItem {
  posicao?: number | null
  chave?: string | null
  tipo?: GastosCriticosEntidadeTipo | string | null
  id?: number | string | null
  nome?: string | null
  nome_exibicao?: string | null
  compras?: number | null
  ocorrencias?: number | null
  valor_total?: number | null
  ticket_medio?: number | null
  percentual_gasto?: number | null
  percentual_compras?: number | null
  frequencia?: GastosCriticosFrequencia | null
  variacao_valor_percentual?: number | null
  variacao_compras_percentual?: number | null
  frase_frequencia?: string | null
  frase_gasto?: string | null
  frase_evolucao?: string | null
  categoria_id?: number | null
  categoria_nome?: string | null
  categoria_cor?: string | null
  subcategoria_id?: number | null
  subcategoria_nome?: string | null
  atalho?: GastosCriticosAtalho | null
}

export interface GastosCriticosRankings {
  estabelecimentos?: GastosCriticosRankingItem[] | null
  lojas?: GastosCriticosRankingItem[] | null
  categorias?: GastosCriticosRankingItem[] | null
  subcategorias?: GastosCriticosRankingItem[] | null
}

export interface GastosCriticosEvolucaoMes {
  chave?: string | null
  label?: string | null
  valor_total?: number | null
  compras?: number | null
  variacao_percentual?: number | null
  parcial?: boolean | null
}

export interface GastosCriticosEvolucao {
  por_mes?: GastosCriticosEvolucaoMes[] | null
}

export interface GastosCriticosView {
  periodo?: GastosCriticosPeriodo | null
  periodo_anterior?: GastosCriticosPeriodoAnterior | null
  totais?: GastosCriticosTotais | null
  destaques?: GastosCriticosDestaques | null
  alertas?: GastosCriticosAlerta[] | null
  maiores_gastos?: GastosCriticosRankings | null
  mais_comprados?: GastosCriticosRankings | null
  evolucao?: GastosCriticosEvolucao | null
}

export interface GastosCriticosInterface {
  getGastosCriticos(params: GastosCriticosSearch): Promise<GastosCriticosView | undefined>
}

export const GastosCriticosDefaultValues: GastosCriticosSearch = {
  meses: 3,
  data_inicio: null,
  data_fim: null,
  mes: null,
  ano: null,
  cartao_id: null,
  responsavel_id: null,
  categoria_id: null,
}
