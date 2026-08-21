import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import {
  RankingParceladasInterface,
  RankingParceladasSearch,
  RankingParceladasView,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'

const cleanParams = (params: RankingParceladasSearch): Record<string, unknown> => {
  const clean: Record<string, unknown> = {}

  const mes = Number(params.mes)
  const ano = Number(params.ano)
  if (Number.isFinite(mes) && mes > 0) clean.mes = mes
  if (Number.isFinite(ano) && ano > 0) clean.ano = ano

  const cartaoId = Number(params.cartao_id)
  if (Number.isFinite(cartaoId) && cartaoId > 0) clean.cartao_id = cartaoId

  const responsavelId = Number(params.responsavel_id)
  if (Number.isFinite(responsavelId) && responsavelId > 0) clean.responsavel_id = responsavelId

  const categoriaId = Number(params.categoria_id)
  if (Number.isFinite(categoriaId) && categoriaId > 0) clean.categoria_id = categoriaId

  clean.ordenar = 'percentual_asc'

  const palavra = typeof params.palavra_chave === 'string' ? params.palavra_chave.trim() : ''
  if (palavra) clean.palavra_chave = palavra

  const apenas = params.apenas_abertas
  const aberto =
    apenas === true ||
    apenas === 1 ||
    apenas === '1' ||
    apenas === 'true'
  clean.apenas_abertas = aberto ? 1 : 0

  return clean
}

export class RankingParceladasService implements RankingParceladasInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'dashboard'
    this.httpClient = new AxiosHttpClient()
  }

  async getRankingParceladas(
    params: RankingParceladasSearch
  ): Promise<RankingParceladasView | undefined> {
    try {
      const response = await this.httpClient.get<any>({
        url: `${this.url}/ranking-parceladas`,
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
    } catch (error) {
      console.error('Erro ao buscar ranking de parceladas:', error)
      throw error
    }
  }
}
