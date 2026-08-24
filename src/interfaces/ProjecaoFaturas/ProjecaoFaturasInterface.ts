export type ProjecaoFonte = 'fatura' | 'parcial' | 'projecao' | 'misto' | 'vazio'

export interface ProjecaoFaturasSearch {
  mes?: number | null
  ano?: number | null
  palavra_chave?: string | null | undefined | unknown
}

export interface ProjecaoColuna {
  mes: number
  ano: number
  chave: string
  label: string
  referencia: boolean
}

/** Split Eu / Outros (valor + % do gasto + % do limite quando houver) */
export interface ProjecaoSplitParte {
  realizado: number
  projetado: number
  total: number
  /** Fatia do total gasto (null se total = 0) */
  percentual: number | null
  /** % do limite — null quando não há limite no contexto */
  percentual_do_limite: number | null
}

export interface ProjecaoResumoEuOutros {
  meu: ProjecaoSplitParte
  outros: ProjecaoSplitParte
  total: number
}

/** Snapshot do mês de referência: limite / em uso / livre + split */
export interface ProjecaoUsoLimite {
  limite: number | null
  em_uso: number
  percentual_em_uso: number | null
  livre: number | null
  percentual_livre: number | null
  meu?: ProjecaoSplitParte
  outros?: ProjecaoSplitParte
}

export interface ProjecaoValor {
  realizado: number
  projetado: number
  total: number
  fonte: ProjecaoFonte
  /** Alias de total — quanto do limite está comprometido no mês */
  em_uso?: number
  /** limite - em_uso — null se sem limite */
  livre?: number | null
  /** % do limite utilizado — null se sem limite */
  percentual_utilizado?: number | null
  /** % do limite livre — null se sem limite */
  percentual_livre?: number | null
  /** Alias legado de livre */
  disponivel?: number | null
  meu?: ProjecaoSplitParte
  outros?: ProjecaoSplitParte
  /** Na linha do responsável: fatia no total do mês (ou do cartão) */
  percentual_participacao?: number | null
}

export interface ProjecaoPorCartao {
  cartao_id: number
  nome: string
  bandeira?: string
  ultimos_digitos?: string
  qtd_bandeiras?: number
  pessoa_id?: number | null
  pessoa_nome?: string | null
  limite_credito?: number | null
  cor_fundo?: string | null
  cor_texto?: string | null
  dia_limite_fatura?: number | null
  dia_vencimento_fatura?: number | null
  uso_limite?: ProjecaoUsoLimite | null
  valores: ProjecaoValor[]
  total: number
  resumo_eu_outros?: ProjecaoResumoEuOutros[]
}

export interface ProjecaoPorResponsavel {
  responsavel_id: number
  nome: string
  tipo?: string
  eh_eu?: boolean
  valores: ProjecaoValor[]
  total: number
}

export interface ProjecaoPorCartaoResponsavel extends ProjecaoPorCartao {
  por_responsavel: ProjecaoPorResponsavel[]
}

export interface ProjecaoTotalColuna {
  mes: number
  ano: number
  chave: string
  cartoes: { realizado: number; projetado: number; total: number }
  responsaveis: { realizado: number; projetado: number; total: number }
}

export interface ProjecaoFaturasView {
  referencia: { mes: number; ano: number }
  colunas: ProjecaoColuna[]
  responsavel_eu_id?: number | null
  por_cartao: ProjecaoPorCartao[]
  por_responsavel: ProjecaoPorResponsavel[]
  por_cartao_responsavel?: ProjecaoPorCartaoResponsavel[]
  resumo_eu_outros?: ProjecaoResumoEuOutros[]
  totais_por_coluna: ProjecaoTotalColuna[]
}

export interface ProjecaoFaturasInterface {
  getProjecaoFaturas(params: ProjecaoFaturasSearch): Promise<ProjecaoFaturasView | undefined>
}

export const ProjecaoFaturasDefaultValues: ProjecaoFaturasSearch = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  palavra_chave: null,
}
