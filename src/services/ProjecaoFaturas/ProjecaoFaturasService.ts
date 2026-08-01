import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import {
  ProjecaoFaturasInterface,
  ProjecaoFaturasSearch,
  ProjecaoFaturasView,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'

export class ProjecaoFaturasService implements ProjecaoFaturasInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getProjecaoFaturas(params: ProjecaoFaturasSearch): Promise<ProjecaoFaturasView | undefined> {
    try {
      const response = await this.httpClient.get<any>({
        url: `${this.url}/projecao-faturas`,
        body: {
          mes: params.mes,
          ano: params.ano,
        },
      })

      if (!response || !response.statusCode) throw new UnexpectedError()

      switch (response.statusCode) {
        case HttpStatusCode.ok:
          return response.body?.data ?? response.body
        case HttpStatusCode.unauthorized:
          throw new AccessDeniedError()
        default:
          throw new UnexpectedError(response.body?.message || response.message)
      }
    } catch (error) {
      console.error('Erro ao buscar projeção de faturas:', error)
      throw error
    }
  }
}
