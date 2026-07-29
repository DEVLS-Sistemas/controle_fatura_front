import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'

export interface DashboardResumo {
  periodo: { ano: number; mes: number | null }
  totais: {
    total_compras: number
    total_pagamentos: number
    total_estornos: number
    total_antecipacoes: number
    total_liquido: number
    total_transacoes: number
  }
  por_mes: Array<{ mes: number; total: number }>
  por_categoria: Array<{ categoria_id?: number; nome: string; cor?: string; total: number; quantidade: number }>
  por_responsavel: Array<{ responsavel_id?: number; nome: string; tipo?: string; total: number; quantidade: number }>
  por_cartao: Array<{ cartao_id?: number; nome: string; total: number; quantidade: number }>
  por_tipo: Array<{ tipo: string; total: number; quantidade: number }>
}

export class DashboardService {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getResumo(params: { ano?: number; mes?: number | null }): Promise<DashboardResumo | undefined> {
    const response = await this.httpClient.get({
      url: `${this.url}/resumo`,
      body: params,
    })

    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response.body?.data
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }
}
