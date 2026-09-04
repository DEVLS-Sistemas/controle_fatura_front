import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { getAuthUser } from '../../helpers/auth_session'
import { applyRaioXViewGuards, buildRaioXMock } from '../../helpers/raio_x_helpers'
import { RaioXInterface, RaioXSearch, RaioXView } from 'interfaces/RaioX/RaioXInterface'

const cleanParams = (params: RaioXSearch): Record<string, unknown> => {
  const clean: Record<string, unknown> = {
    mes: params.mes,
    ano: params.ano,
  }
  const responsavelId = Number(params.responsavel_id)
  if (Number.isFinite(responsavelId) && responsavelId > 0) {
    clean.responsavel_id = responsavelId
  }
  return clean
}

const isValidView = (data: unknown): data is RaioXView => {
  if (!data || typeof data !== 'object') return false
  const view = data as RaioXView
  return Array.isArray(view.sinais) && Boolean(view.referencia)
}

export class RaioXService implements RaioXInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getRaioX(params: RaioXSearch): Promise<RaioXView> {
    try {
      const response = await this.httpClient.get<any>({
        url: `${this.url}/raio-x`,
        body: cleanParams(params),
      })

      if (!response || !response.statusCode) {
        return this.mock(params)
      }

      switch (response.statusCode) {
        case HttpStatusCode.ok: {
          const data = response.body?.data ?? response.body
          if (isValidView(data)) return applyRaioXViewGuards(data)
          return this.mock(params)
        }
        case HttpStatusCode.unauthorized:
          throw new AccessDeniedError()
        case HttpStatusCode.notFound:
          return this.mock(params)
        default:
          throw new UnexpectedError(response.body?.message || response.message)
      }
    } catch (error) {
      if (error instanceof AccessDeniedError || error instanceof UnexpectedError) {
        throw error
      }
      return this.mock(params)
    }
  }

  private mock(params: RaioXSearch): RaioXView {
    const user = getAuthUser()
    const renda = user?.renda_mensal
    const rendaInformada = renda != null && Number(renda) > 0
    return applyRaioXViewGuards(
      buildRaioXMock({
        mes: params.mes,
        ano: params.ano,
        rendaInformada,
        rendaValor: rendaInformada ? Number(renda) : null,
      })
    )
  }
}
