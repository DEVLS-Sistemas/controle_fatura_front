import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import {
  GastosCriticosInterface,
  GastosCriticosSearch,
  GastosCriticosView,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'

const cleanParams = (params: GastosCriticosSearch): Record<string, unknown> => {
  const clean: Record<string, unknown> = {}

  const mes = Number(params.mes)
  const ano = Number(params.ano)
  const mesValido = Number.isFinite(mes) && mes >= 1 && mes <= 12
  const anoValido = Number.isFinite(ano) && ano > 2000
  const dataInicio = typeof params.data_inicio === 'string' ? params.data_inicio.trim() : ''
  const dataFim = typeof params.data_fim === 'string' ? params.data_fim.trim() : ''

  if (mesValido && anoValido) {
    clean.mes = mes
    clean.ano = ano
  } else if (dataInicio || dataFim) {
    if (dataInicio) clean.data_inicio = dataInicio
    if (dataFim) clean.data_fim = dataFim
  } else {
    const meses = Number(params.meses)
    clean.meses = meses === 1 || meses === 3 || meses === 6 || meses === 12 ? meses : 3
  }

  const cartaoId = Number(params.cartao_id)
  if (Number.isFinite(cartaoId) && cartaoId > 0) clean.cartao_id = cartaoId

  const responsavelId = Number(params.responsavel_id)
  if (Number.isFinite(responsavelId) && responsavelId > 0) clean.responsavel_id = responsavelId

  const categoriaId = Number(params.categoria_id)
  if (Number.isFinite(categoriaId) && categoriaId > 0) clean.categoria_id = categoriaId

  return clean
}

export class GastosCriticosService implements GastosCriticosInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getGastosCriticos(params: GastosCriticosSearch): Promise<GastosCriticosView | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/gastos-criticos`,
      body: cleanParams(params),
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
