import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { ValidationError } from '../../libs/api/exceptions/ValidationError'
import {
  LookupsRepasses,
  RepasseList,
  RepasseMatrizView,
  RepasseModel,
  RepasseQuitarCompetenciaPayload,
  RepassesInterface,
  RepassesSearch,
} from 'interfaces/Repasses/RepassesInterface'

const unwrap = <T>(body: any): T => (body?.data ?? body) as T

export class RepassesService implements RepassesInterface {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'repasses'
    this.httpClient = new AxiosHttpClient()
  }

  async getMatriz(params: RepassesSearch): Promise<RepasseMatrizView | undefined> {
    try {
      const response = await this.httpClient.get<any>({
        url: `${this.url}/matriz`,
        body: {
          responsavel_id: params.responsavel_id,
          mes: params.mes,
          ano: params.ano,
          janela: params.janela ?? 13,
          incluir_abertos: params.incluir_abertos ?? 1,
          somente_abertos: params.somente_abertos ? 1 : 0,
          cartao_id: params.cartao_id || undefined,
        },
      })
      if (!response || !response.statusCode) throw new UnexpectedError()
      switch (response.statusCode) {
        case HttpStatusCode.ok:
          return unwrap<RepasseMatrizView>(response.body)
        case HttpStatusCode.unauthorized:
          throw new AccessDeniedError()
        default:
          throw new UnexpectedError(response.body?.message || response.message)
      }
    } catch (error) {
      console.error('Erro ao buscar matriz de repasses:', error)
      throw error
    }
  }

  async listRepasses(params: { transacao_id: number | string }): Promise<RepasseList[]> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/listar`,
      body: { transacao_id: params.transacao_id },
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const body = unwrap<any>(response.body)
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data)) return body.data
        return []
      }
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async getViewRepasse(id: number | string): Promise<RepasseList | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/listar/${id}`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return unwrap<RepasseList>(response.body)
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async createRepasse(params: RepasseModel) {
    const response = await this.httpClient.post({
      url: `${this.url}/cadastrar`,
      body: params,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
      case HttpStatusCode.created:
        return unwrap(response.body)
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

  async editRepasse(params: RepasseModel) {
    const response = await this.httpClient.put({
      url: `${this.url}/editar`,
      body: params,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return unwrap(response.body)
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

  async deleteRepasse(id: number) {
    const response = await this.httpClient.delete({
      url: `${this.url}/excluir/${id}`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response
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

  async quitarCompetencia(params: RepasseQuitarCompetenciaPayload) {
    const response = await this.httpClient.post({
      url: `${this.url}/quitar-competencia`,
      body: params,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
      case HttpStatusCode.created:
        return unwrap(response.body)
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

  async getLookups(): Promise<LookupsRepasses | undefined> {
    const response = await this.httpClient.get<any>({
      url: `${this.url}/lookups`,
    })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return unwrap<LookupsRepasses>(response.body)
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }
}
