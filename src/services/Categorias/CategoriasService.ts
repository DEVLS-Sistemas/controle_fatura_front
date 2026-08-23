import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    CategoriaRapidoPayload,
    CategoriaRapidoResult,
    CategoriasInterface,
    CategoriasList,
    CategoriasModel,
    CategoriasSearch,
    CategoriasView,
    LookupsCategorias,
} from "interfaces/Categorias/CategoriasInterface"

export class CategoriasService implements CategoriasInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'categorias'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewCategorias(params: { id: number | string }): Promise<CategoriasView | undefined> {
        const response = await this.httpClient.get<CategoriasView>({
            url: `${this.url}/listar/${params.id}`
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listCategoriasPaginate(params: CategoriasSearch): Promise<PaginateInterface<CategoriasList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<CategoriasList>>({
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
            console.error('Erro ao buscar categorias:', error)
            throw error
        }
    }

    async AsyncListCategorias(params: CategoriasSearch): Promise<CategoriasModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/categorias-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsCategorias(): Promise<LookupsCategorias | undefined> {
        const response = await this.httpClient.get<LookupsCategorias>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createCategorias(params: CategoriasModel) {
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

    async createCategoriasRapido(params: CategoriaRapidoPayload): Promise<CategoriaRapidoResult> {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar-rapido',
            body: params,
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok:
            case HttpStatusCode.created: {
                const wrap = response.body?.categoria ?? response.body
                const data = wrap?.data ?? wrap
                if (!data?.id) throw new UnexpectedError(response.message || 'Resposta inválida do cadastro rápido')
                return {
                    data: {
                        id: Number(data.id),
                        nome: String(data.nome ?? params.nome),
                        cor: data.cor ?? params.cor ?? null,
                        ativo: data.ativo ?? true,
                    },
                    status: Boolean(wrap?.status ?? true),
                    criado: Boolean(wrap?.criado),
                    message: String(wrap?.message ?? response.message ?? 'Categoria salva'),
                }
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async editCategorias(params: CategoriasModel) {
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

    async deleteCategorias(id: number) {
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
