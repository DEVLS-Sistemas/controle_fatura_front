import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import {
  GastosPorCategoriaInterface,
  GastosPorCategoriaSearch,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import { cleanGastosPorCategoriaParams } from 'helpers/gastos_por_categoria_helpers'

export class GastosPorCategoriaService implements GastosPorCategoriaInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getGastosPorCategoria(
    params: GastosPorCategoriaSearch
  ): Promise<GastosPorCategoriaView | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/gastos-por-categoria`,
      body: cleanGastosPorCategoriaParams(params),
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
  }
}
