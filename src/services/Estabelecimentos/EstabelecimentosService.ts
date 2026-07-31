import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    EstabelecimentoLookup,
    EstabelecimentosInterface,
    EstabelecimentosList,
    EstabelecimentosModel,
    EstabelecimentosSearch,
    EstabelecimentosView,
    LookupsEstabelecimentos,
} from "interfaces/Estabelecimentos/EstabelecimentosInterface"

export class EstabelecimentosService implements EstabelecimentosInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'estabelecimentos'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewEstabelecimentos(params: { id: number | string }): Promise<EstabelecimentosView | undefined> {
        const response = await this.httpClient.get<EstabelecimentosView>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listEstabelecimentosPaginate(params: EstabelecimentosSearch): Promise<PaginateInterface<EstabelecimentosList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<EstabelecimentosList>>({
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
            console.error('Erro ao buscar estabelecimentos:', error)
            throw error
        }
    }

    async AsyncListEstabelecimentos(params: EstabelecimentosSearch): Promise<EstabelecimentoLookup[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/estabelecimentos-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsEstabelecimentos(): Promise<LookupsEstabelecimentos | undefined> {
        const response = await this.httpClient.get<LookupsEstabelecimentos>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createEstabelecimentos(params: EstabelecimentosModel) {
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

    async editEstabelecimentos(params: EstabelecimentosModel) {
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

    async deleteEstabelecimentos(id: number) {
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
