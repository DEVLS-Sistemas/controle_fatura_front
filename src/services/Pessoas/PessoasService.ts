import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    normalizePessoasList,
    PessoaListItem,
    PessoasInterface,
    PessoasList,
    PessoasModel,
    PessoasSearch,
    PessoasView,
} from "interfaces/Pessoas/PessoasInterface"

export class PessoasService implements PessoasInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'pessoas'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewPessoas(params: any): Promise<PessoasView | undefined> {
        const response = await this.httpClient.get<any>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: {
                const body = response.body
                if (!body) return undefined
                if (body.nome != null || body.id != null) return body
                return body.data ?? body.pessoa?.data ?? body.pessoa ?? body
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listPessoasPaginate(params: PessoasSearch): Promise<PaginateInterface<PessoasList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<PessoasList>>({
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
            console.error('Erro ao buscar pessoas:', error)
            throw error
        }
    }

    async AsyncListPessoas(params?: PessoasSearch): Promise<PessoaListItem[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/pessoas-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return normalizePessoasList(response.body)
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createPessoas(params: PessoasModel) {
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

    async editPessoas(params: PessoasModel) {
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

    async deletePessoas(id: number) {
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
