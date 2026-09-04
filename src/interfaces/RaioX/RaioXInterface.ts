export type RaioXNivel = 'positivo' | 'atencao' | 'alerta' | 'incompleto'

export type RaioXSinalId = 'pagamentos' | 'crescimento' | 'comprometimento' | string

export type RaioXDiagnosticoTipo =
  | 'parceladas'
  | 'atraso'
  | 'assinaturas'
  | 'crescimento'
  | 'concentracao'
  | 'ok'
  | string

export type RaioXAtalhoRota =
  | 'faturas'
  | 'parceladas'
  | 'projecao'
  | 'simulador'
  | 'gastos-criticos'
  | 'assinaturas'
  | 'perfil'
  | string

export const RAIO_X_MES_STORAGE_KEY = 'raio_x_mes'
export const RAIO_X_ANO_STORAGE_KEY = 'raio_x_ano'

export interface RaioXSearch {
  mes: number
  ano: number
  responsavel_id?: number | null
}

export interface RaioXAtalhoQuery {
  mes?: number | string | null
  ano?: number | string | null
  responsavel_id?: number | string | null
  [key: string]: string | number | null | undefined
}

export interface RaioXAtalho {
  rota?: RaioXAtalhoRota | null
  query?: RaioXAtalhoQuery | null
}

export interface RaioXReferencia {
  mes: number
  ano: number
  label: string
  label_curto: string
}

export interface RaioXRenda {
  informada: boolean
  valor: number | null
  moeda?: string | null
}

export interface RaioXSinalMetricas {
  variacao_percentual?: number | null
  valor_atual?: number | null
  valor_anterior?: number | null
  percentual?: number | null
  valor_comprometido?: number | null
  renda?: number | null
  atrasadas?: number | null
  a_vencer?: number | null
  aguardando_confirmacao?: number | null
  em_aberto?: number | null
  valor_restante?: number | null
  valor_atrasado?: number | null
  valor_aguardando?: number | null
  [key: string]: number | null | undefined
}

export interface RaioXSinal {
  id: RaioXSinalId
  nivel: RaioXNivel
  titulo: string
  frase: string
  contexto?: string | null
  metricas?: RaioXSinalMetricas | null
  atalho?: RaioXAtalho | null
}

export interface RaioXDiagnosticoHorizonte {
  mes?: number | null
  ano?: number | null
  label?: string | null
}

export interface RaioXDiagnosticoMetricas {
  valor_aberto?: number | null
  compras?: number | null
  comprometimento_atual_percentual?: number | null
  comprometimento_projetado_percentual?: number | null
  horizonte?: RaioXDiagnosticoHorizonte | null
  [key: string]: number | RaioXDiagnosticoHorizonte | null | undefined
}

export interface RaioXDiagnostico {
  tipo: RaioXDiagnosticoTipo
  titulo: string
  frase: string
  projecao?: string | null
  contexto?: string | null
  metricas?: RaioXDiagnosticoMetricas | null
  atalho?: RaioXAtalho | null
}

export interface RaioXAcao {
  id: string
  label: string
  atalho?: RaioXAtalho | null
}

export interface RaioXView {
  referencia: RaioXReferencia
  renda: RaioXRenda
  sinais: RaioXSinal[]
  diagnostico: RaioXDiagnostico | null
  acoes: RaioXAcao[]
}

export interface RaioXInterface {
  getRaioX(params: RaioXSearch): Promise<RaioXView>
}
