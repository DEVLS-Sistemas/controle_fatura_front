import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import { extractVisualizarPayload } from "helpers/responsavel_visualizar_helpers"
import {
    ResponsaveisInterface,
    ResponsaveisList,
    ResponsaveisModel,
    ResponsaveisSearch,
    ResponsaveisView,
    ResponsavelVisualizarSearch,
    ResponsavelVisualizarView,
} from "interfaces/Responsaveis/ResponsaveisInterface"

export class ResponsavelNaoEncontradoError extends Error {
    constructor(message = 'Responsável não encontrado') {
        super(message)
        this.name = 'ResponsavelNaoEncontradoError'
    }
}

export class ResponsaveisService implements ResponsaveisInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'responsaveis'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewResponsaveis(params: any): Promise<ResponsaveisView | undefined> {
        const response = await this.httpClient.get<ResponsaveisView>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getVisualizarResponsavel(
        id: number | string,
        params?: ResponsavelVisualizarSearch
    ): Promise<ResponsavelVisualizarView | undefined> {
        const query: Record<string, number> = {}
        const mes = Number(params?.mes)
        const ano = Number(params?.ano)
        if (Number.isFinite(mes) && mes >= 1 && mes <= 12) query.mes = mes
        if (Number.isFinite(ano) && ano > 2000) query.ano = ano

        const response = await this.httpClient.get<any>({
            url: `${this.url}/visualizar/${id}`,
            body: Object.keys(query).length ? query : undefined,
        })
        if (!response || !response.statusCode) throw new UnexpectedError()

        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return extractVisualizarPayload(response.body)
            case HttpStatusCode.notFound:
                throw new ResponsavelNaoEncontradoError(
                    response.body?.message || response.message || 'Responsável não encontrado'
                )
            case HttpStatusCode.unauthorized:
                throw new AccessDeniedError()
            default:
                throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async listResponsaveisPaginate(params: ResponsaveisSearch): Promise<PaginateInterface<ResponsaveisList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<ResponsaveisList>>({
                url: this.url + '/listar',
                body: params
            })
            if (!response || !response.statusCode) throw new UnexpectedError()
            switch (response.statusCode) {
                case HttpStatusCode.ok: return response.body
                case HttpStatusCode.unauthorized: throw new AccessDeniedError()
                default: throw new UnexpectedError()
            }
        } catch (error) {
            console.error('Erro ao buscar responsaveis:', error)
            throw error
        }
    }

    async AsyncListResponsaveis(params: ResponsaveisSearch): Promise<ResponsaveisModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/responsaveis-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createResponsaveis(params: ResponsaveisModel) {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar', body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }

    async editResponsaveis(params: ResponsaveisModel) {
        const response = await this.httpClient.put({
            url: this.url + '/editar', body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }

    async deleteResponsaveis(id: number) {
        const response = await this.httpClient.delete({
            url: this.url + '/excluir/' + id
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }
}
