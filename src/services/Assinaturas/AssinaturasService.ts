import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { ValidationError } from '../../libs/api/exceptions/ValidationError'
import {
  AssinaturaView,
  AssinaturasInterface,
  AssinaturasListItem,
  AssinaturasListView,
  AssinaturasModel,
  AssinaturasSearch,
  LookupsAssinaturas,
} from 'interfaces/Assinaturas/AssinaturasInterface'

export class AssinaturaNaoEncontradaError extends Error {
  constructor(message = 'Assinatura não encontrada') {
    super(message)
    this.name = 'AssinaturaNaoEncontradaError'
  }
}

const unwrap = <T>(body: any): T => {
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data as T
  }
  if (body?.assinatura?.data) return body.assinatura.data as T
  if (body?.assinatura && typeof body.assinatura === 'object') return body.assinatura as T
  return body as T
}

const cleanSearchParams = (params: AssinaturasSearch): Record<string, unknown> => {
  const clean: Record<string, unknown> = {}

  const status = typeof params.status === 'string' ? params.status.trim() : ''
  if (status) clean.status = status

  const periodicidade = typeof params.periodicidade === 'string' ? params.periodicidade.trim() : ''
  if (periodicidade) clean.periodicidade = periodicidade

  const ordenar = typeof params.ordenar === 'string' ? params.ordenar.trim() : ''
  if (ordenar) clean.ordenar = ordenar

  const palavra = typeof params.palavra_chave === 'string' ? params.palavra_chave.trim() : ''
  if (palavra) clean.palavra_chave = palavra

  const cartaoId = Number(params.cartao_id)
  if (Number.isFinite(cartaoId) && cartaoId > 0) clean.cartao_id = cartaoId

  const responsavelId = Number(params.responsavel_id)
  if (Number.isFinite(responsavelId) && responsavelId > 0) clean.responsavel_id = responsavelId

  const categoriaId = Number(params.categoria_id)
  if (Number.isFinite(categoriaId) && categoriaId > 0) clean.categoria_id = categoriaId

  return clean
}

const encodeIdentificador = (identificador: string): string =>
  encodeURIComponent(String(identificador).trim())

export class AssinaturasService implements AssinaturasInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'assinaturas'
    this.httpClient = new AxiosHttpClient()
  }

  async getLookupsAssinaturas(): Promise<LookupsAssinaturas | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/lookups`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const data = unwrap<LookupsAssinaturas & { lookups?: LookupsAssinaturas }>(response.body)
        return data?.ordenar || data?.status || data?.periodicidades ? data : data?.lookups ?? data
      }
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async listAssinaturas(params: AssinaturasSearch): Promise<AssinaturasListView | undefined> {
    try {
      const response = await this.httpClient.get<any>({
        url: `${this.url}/listar`,
        body: cleanSearchParams(params),
      })
      if (!response || !response.statusCode) throw new UnexpectedError()
      switch (response.statusCode) {
        case HttpStatusCode.ok: {
          const data = unwrap<AssinaturasListView>(response.body)
          const itens = Array.isArray(data?.itens) ? data.itens : []
          const hasSplit = Array.isArray(data?.assinaturas) || Array.isArray(data?.candidatas)
          const assinaturas = hasSplit
            ? (data.assinaturas ?? [])
            : itens.filter((item) => item.status === 'confirmada')
          const candidatas = hasSplit
            ? (data.candidatas ?? [])
            : itens.filter((item) => item.status === 'candidata')
          const ignoradas = Array.isArray(data?.ignoradas)
            ? data.ignoradas
            : itens.filter((item) => item.status === 'ignorada')
          const pendentes = Number(
            data?.totais?.pendentes_confirmacao ?? data?.totais?.candidatas ?? candidatas.length
          )
          return {
            ...data,
            assinaturas,
            candidatas,
            ignoradas,
            itens: hasSplit ? (data.itens ?? assinaturas) : itens,
            totais: {
              ...(data?.totais ?? {}),
              pendentes_confirmacao: pendentes,
            },
          }
        }
        case HttpStatusCode.unauthorized:
          throw new AccessDeniedError()
        default:
          throw new UnexpectedError(response.body?.message || response.message)
      }
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error)
      throw error
    }
  }

  async getViewAssinaturas(identificador: string): Promise<AssinaturaView | undefined> {
    const id = String(identificador).trim()
    if (!id) throw new AssinaturaNaoEncontradaError()

    const response = await this.httpClient.get<any>({
      url: `${this.url}/listar/${encodeIdentificador(id)}`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return unwrap<AssinaturaView>(response.body)
      case HttpStatusCode.notFound:
        throw new AssinaturaNaoEncontradaError(
          response.body?.message || response.message || 'Assinatura não encontrada'
        )
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async AsyncListAssinaturas(params: AssinaturasSearch): Promise<AssinaturasListItem[] | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/assinaturas-list`,
      body: cleanSearchParams(params),
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const body = response.body
        const raw = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : []
        return raw.map((item: any) => ({
          id: String(item?.id ?? item?.identificador ?? ''),
          nome: String(item?.nome ?? item?.titulo ?? item?.id ?? ''),
        }))
      }
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async createAssinaturas(params: AssinaturasModel) {
    const body: Record<string, unknown> = {}
    if (params.identificador) body.identificador = params.identificador
    if (params.transacao_id) body.transacao_id = params.transacao_id

    const response = await this.httpClient.post({
      url: `${this.url}/cadastrar`,
      body,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
      case HttpStatusCode.created:
        return response.body
      case HttpStatusCode.noContent:
        return
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async editAssinaturas(params: AssinaturasModel) {
    const payload: Record<string, unknown> = {
      acao: params.acao,
    }
    if (params.identificador) payload.identificador = params.identificador
    if (params.transacao_id) payload.transacao_id = params.transacao_id
    if (params.loja_id) payload.loja_id = params.loja_id
    if (params.estabelecimento_id) payload.estabelecimento_id = params.estabelecimento_id

    const response = await this.httpClient.put({
      url: `${this.url}/editar`,
      body: payload,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response.body
      case HttpStatusCode.noContent:
        return
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async deleteAssinaturas(identificador: string) {
    const response = await this.httpClient.delete({
      url: `${this.url}/excluir/${encodeIdentificador(identificador)}`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response.body
      case HttpStatusCode.noContent:
        return
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }
}
