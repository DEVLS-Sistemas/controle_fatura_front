import { PessoaListItem } from 'interfaces/Pessoas/PessoasInterface'
import { ProjecaoColuna, ProjecaoPorCartao } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { ResponsavelLookup } from 'interfaces/Transacoes/TransacoesInterface'

export interface SimuladorCompraFormValues {
  pessoa_id: number | string | null
  cartao_id: number | string | null
  responsavel_id: number | string | null
  valor_compra: string | number | null
  parcelas_total: number | string | null
  data: string | null
  mes: number | null
  ano: number | null
}

export interface SimuladorParcela {
  parcela: number
  valor: number
  mes: number
  ano: number
  chave: string
  label: string
  na_janela: boolean
  indice_coluna: number | null
}

export interface SimuladorImpactoValor {
  antes: number
  simulado: number
  depois: number
}

export interface SimuladorImpacto {
  competencia: ProjecaoColuna | null
  neste_cartao: SimuladorImpactoValor
  outros_cartoes: SimuladorImpactoValor
  geral_responsavel: SimuladorImpactoValor
  fatura_cartao: SimuladorImpactoValor & {
    limite: number | null
    percentual_em_uso_depois: number | null
    livre_depois: number | null
    percentual_livre_depois: number | null
  }
  soma_janela_neste_cartao: SimuladorImpactoValor
  soma_janela_geral: SimuladorImpactoValor
  soma_janela_fatura: SimuladorImpactoValor
}

export interface SimuladorOverlayResult {
  parcelas: SimuladorParcela[]
  deltas: number[]
  parcelas_na_janela: number
  parcelas_fora_da_janela: number
  primeira: SimuladorParcela | null
  ultima: SimuladorParcela | null
  totais_batem: boolean
}

export type SimuladorVereditoNivel = 'baixo' | 'moderado' | 'alto'
export type SimuladorVereditoScore = 0 | 1 | 2
export type SimuladorVereditoMotivoId = 'limite' | 'peso' | 'duracao' | 'parcela'

export interface SimuladorVereditoMotivo {
  id: SimuladorVereditoMotivoId
  label: string
}

export interface SimuladorVereditoMes {
  indice: number
  chave: string
  label: string
  labelCurto: string
  mes: number
  ano: number
  antes: number
  depois: number
  parcela: number
  limite: number | null
  usoDepois: number | null
  peso: number | null
  score: SimuladorVereditoScore
  ehCritico: boolean
}

export interface SimuladorVeredito {
  nivel: SimuladorVereditoNivel
  titulo: string
  eyebrow: string
  frase: string
  contexto: string
  motivos: SimuladorVereditoMotivo[]
  meses: SimuladorVereditoMes[]
  mesCritico: SimuladorVereditoMes | null
  nParcelas: number
  valorParcela: number
  valorCompra: number
  cartaoNome: string
  semLimite: boolean
  janelaTruncada: boolean
  bumpDuracao: boolean
  kPesados: number
  semProjecao: boolean
}

export type SimuladorTitular = PessoaListItem
export type SimuladorCartao = ProjecaoPorCartao
export type SimuladorResponsavel = ResponsavelLookup
