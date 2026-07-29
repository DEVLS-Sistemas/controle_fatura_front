import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    LookupsTransacoes,
    TransacoesInterface,
    TransacoesList,
    TransacoesModel,
    TransacoesSearch,
    TransacoesView,
} from "interfaces/Transacoes/TransacoesInterface"

export class TransacoesService implements TransacoesInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'transacoes'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewTransacoes(params: { id: number | string }): Promise<TransacoesView | undefined> {
        const response = await this.httpClient.get<TransacoesView>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listTransacoesPaginate(params: TransacoesSearch): Promise<PaginateInterface<TransacoesList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<TransacoesList>>({
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
            console.error('Erro ao buscar transacoes:', error)
            throw error
        }
    }

    async AsyncListTransacoes(params: TransacoesSearch): Promise<TransacoesModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/transacoes-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsTransacoes(): Promise<LookupsTransacoes | undefined> {
        const response = await this.httpClient.get<LookupsTransacoes>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createTransacoes(params: TransacoesModel) {
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

    async editTransacoes(params: TransacoesModel) {
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

    async deleteTransacoes(id: number) {
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

    async exportCsv(params: TransacoesSearch): Promise<Blob> {
        const { ApiConfig } = await import('../../libs/api/ApiConfig')
        const cleanParams: Record<string, unknown> = { ...params }
        Object.keys(cleanParams).reduce(
            (acc, k) => (!cleanParams[k] && cleanParams[k] !== 0 && delete acc[k], acc),
            cleanParams
        )
        const response = await ApiConfig.get(`${this.url}/exportar`, {
            params: cleanParams,
            responseType: 'blob',
        })
        return response.data
    }
}
