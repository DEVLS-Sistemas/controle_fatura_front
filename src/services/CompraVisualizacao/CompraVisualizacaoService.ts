import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import {
  CompraVisualizacaoInterface,
  CompraVisualizacaoSearch,
  CompraVisualizacaoView,
} from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'

export class CompraNaoEncontradaError extends Error {
  constructor(message = 'Compra não encontrada') {
    super(message)
    this.name = 'CompraNaoEncontradaError'
  }
}

const extractPayload = (body: any): CompraVisualizacaoView | undefined => {
  if (!body) return undefined
  if (body.titulo != null || body.parcelas || body.transacao_id != null || body.compra_grupo_id || body.conciliacao) {
    return body
  }
  const nested = body.data
  if (nested && (nested.titulo != null || nested.parcelas || nested.transacao_id != null || nested.conciliacao)) {
    return nested
  }
  return nested ?? body
}

export class CompraVisualizacaoService implements CompraVisualizacaoInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'transacoes'
    this.httpClient = new AxiosHttpClient()
  }

  async getVisualizarCompra(
    identificador: string,
    params?: CompraVisualizacaoSearch
  ): Promise<CompraVisualizacaoView | undefined> {
    const query: Record<string, number> = {}
    const mes = Number(params?.mes)
    const ano = Number(params?.ano)
    if (Number.isFinite(mes) && mes >= 1 && mes <= 12) query.mes = mes
    if (Number.isFinite(ano) && ano > 2000) query.ano = ano

    const response = await this.httpClient.get<any>({
      url: `${this.url}/visualizar/${encodeURIComponent(identificador)}`,
      body: Object.keys(query).length ? query : undefined,
    })

    if (!response || !response.statusCode) throw new UnexpectedError()

    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return extractPayload(response.body)
      case HttpStatusCode.notFound:
        throw new CompraNaoEncontradaError(
          response.body?.message || response.message || 'Compra não encontrada'
        )
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }
}
