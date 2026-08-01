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

export interface ProjecaoValor {
  realizado: number
  projetado: number
  total: number
  fonte: ProjecaoFonte
}

export interface ProjecaoPorCartao {
  cartao_id: number
  nome: string
  bandeira?: string
  ultimos_digitos?: string
  cor_fundo?: string | null
  cor_texto?: string | null
  valores: ProjecaoValor[]
  total: number
}

export interface ProjecaoPorResponsavel {
  responsavel_id: number
  nome: string
  tipo?: string
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
  por_cartao: ProjecaoPorCartao[]
  por_responsavel: ProjecaoPorResponsavel[]
  por_cartao_responsavel?: ProjecaoPorCartaoResponsavel[]
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
