export type GastosPorCategoriaMeses = 1 | 3 | 6 | 12

export type GastosPorCategoriaOrigem =
  | 'COMPRAS_ONLINE'
  | 'COMPRAS_PRESENCIAL'
  | 'PAGAMENTO_SERVICOS'
  | 'PAGAMENTO_FATURA'

export const GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY = 'gastos_por_categoria_meses'

export const GASTOS_POR_CATEGORIA_ORIGENS: GastosPorCategoriaOrigem[] = [
  'COMPRAS_ONLINE',
  'COMPRAS_PRESENCIAL',
  'PAGAMENTO_SERVICOS',
  'PAGAMENTO_FATURA',
]

export interface GastosPorCategoriaSearch {
  meses?: number | null
  data_inicio?: string | null
  data_fim?: string | null
  mes?: number | string | null
  ano?: number | string | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  categoria_id?: number | string | null
  origem_compra?: string | null
}

export interface GastosPorCategoriaAtalhoQuery {
  data_inicio?: string | null
  data_fim?: string | null
  mes?: number | string | null
  ano?: number | string | null
  categoria_id?: number | string | null
  subcategoria_id?: number | string | null
  origem_compra?: string | null
  cartao_id?: number | string | null
  responsavel_id?: number | string | null
  [key: string]: string | number | null | undefined
}

export interface GastosPorCategoriaAtalho {
  rota?: string | null
  id?: number | string | null
  query?: GastosPorCategoriaAtalhoQuery | null
}

export interface GastosPorCategoriaFrequencia {
  label?: string | null
  por_mes?: number | null
  por_dia?: number | null
}

export interface GastosPorCategoriaPeriodo {
  inicio?: string | null
  fim?: string | null
  meses?: number | null
  dias?: number | null
  origem?: string | null
  label?: string | null
  label_frase?: string | null
}

export interface GastosPorCategoriaPeriodoAnterior {
  inicio?: string | null
  fim?: string | null
  label?: string | null
}

export interface GastosPorCategoriaSemCategoria {
  valor_total?: number | null
  compras?: number | null
  percentual_gasto?: number | null
}

export interface GastosPorCategoriaTotais {
  valor_total?: number | null
  compras?: number | null
  ocorrencias?: number | null
  ticket_medio?: number | null
  categorias_com_gasto?: number | null
  variacao_valor_percentual?: number | null
  frequencia?: GastosPorCategoriaFrequencia | null
  sem_categoria?: GastosPorCategoriaSemCategoria | null
}

export interface GastosPorCategoriaSubDestaque {
  subcategoria_id?: number | null
  nome?: string | null
  valor_total?: number | null
  compras?: number | null
  percentual_da_categoria?: number | null
  atalho?: GastosPorCategoriaAtalho | null
}

export interface GastosPorCategoriaDestaqueCategoria {
  categoria_id?: number | null
  nome?: string | null
  cor?: string | null
  valor_total?: number | null
  compras?: number | null
  percentual_gasto?: number | null
  variacao_valor_percentual?: number | null
  atalho?: GastosPorCategoriaAtalho | null
}

export interface GastosPorCategoriaDestaque {
  categoria?: GastosPorCategoriaDestaqueCategoria | null
  subcategorias?: GastosPorCategoriaSubDestaque[] | null
  frase?: string | null
}

export interface GastosPorCategoriaOutras {
  quantidade?: number | null
  valor_total?: number | null
  compras?: number | null
  percentual_da_categoria?: number | null
}

export interface GastosPorCategoriaOrigemItem {
  origem_compra?: string | null
  label?: string | null
  valor_total?: number | null
  compras?: number | null
  percentual_gasto?: number | null
  frase?: string | null
  atalho?: GastosPorCategoriaAtalho | null
}

export interface GastosPorCategoriaItem {
  chave?: string | null
  categoria_id?: number | null
  nome?: string | null
  cor?: string | null
  valor_total?: number | null
  compras?: number | null
  percentual_gasto?: number | null
  variacao_valor_percentual?: number | null
  frase?: string | null
  subcategorias_total?: number | null
  top_subcategorias?: GastosPorCategoriaSubDestaque[] | null
  outras_subcategorias?: GastosPorCategoriaOutras | null
  sem_subcategoria?: GastosPorCategoriaSemCategoria | null
  por_origem?: GastosPorCategoriaOrigemItem[] | null
  atalho?: GastosPorCategoriaAtalho | null
}

export interface GastosPorCategoriaEvolucaoMes {
  chave?: string | null
  label?: string | null
  valor_total?: number | null
  compras?: number | null
  parcial?: boolean | null
}

export interface GastosPorCategoriaEvolucaoSeriePonto {
  chave?: string | null
  valor_total?: number | null
  compras?: number | null
}

export interface GastosPorCategoriaEvolucaoSerie {
  categoria_id?: number | null
  nome?: string | null
  cor?: string | null
  serie?: GastosPorCategoriaEvolucaoSeriePonto[] | null
}

export interface GastosPorCategoriaEvolucao {
  por_mes?: GastosPorCategoriaEvolucaoMes[] | null
  por_categoria?: GastosPorCategoriaEvolucaoSerie[] | null
}

export interface GastosPorCategoriaView {
  periodo?: GastosPorCategoriaPeriodo | null
  periodo_anterior?: GastosPorCategoriaPeriodoAnterior | null
  totais?: GastosPorCategoriaTotais | null
  destaque?: GastosPorCategoriaDestaque | null
  categorias?: GastosPorCategoriaItem[] | null
  por_origem?: GastosPorCategoriaOrigemItem[] | null
  evolucao?: GastosPorCategoriaEvolucao | null
}

export interface GastosPorCategoriaInterface {
  getGastosPorCategoria(params: GastosPorCategoriaSearch): Promise<GastosPorCategoriaView | undefined>
}

export const GastosPorCategoriaDefaultValues: GastosPorCategoriaSearch = {
  meses: 3,
  data_inicio: null,
  data_fim: null,
  mes: null,
  ano: null,
  cartao_id: null,
  responsavel_id: null,
  categoria_id: null,
  origem_compra: null,
}
