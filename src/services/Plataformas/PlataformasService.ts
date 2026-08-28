import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    LookupsPlataformas,
    PlataformaRapidoPayload,
    PlataformaRapidoResult,
    PlataformasInterface,
    PlataformasList,
    PlataformasModel,
    PlataformasSearch,
    PlataformasView,
} from "interfaces/Plataformas/PlataformasInterface"

export class PlataformasService implements PlataformasInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'plataformas'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewPlataformas(params: { id: number | string }): Promise<PlataformasView | undefined> {
        const response = await this.httpClient.get<PlataformasView>({
            url: `${this.url}/listar/${params.id}`
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listPlataformasPaginate(params: PlataformasSearch): Promise<PaginateInterface<PlataformasList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<PlataformasList>>({
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
            console.error('Erro ao buscar plataformas:', error)
            throw error
        }
    }

    async AsyncListPlataformas(params: PlataformasSearch): Promise<PlataformasModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/plataformas-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsPlataformas(): Promise<LookupsPlataformas | undefined> {
        const response = await this.httpClient.get<LookupsPlataformas>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createPlataformas(params: PlataformasModel) {
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

    async createPlataformasRapido(params: PlataformaRapidoPayload): Promise<PlataformaRapidoResult> {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar-rapido',
            body: params,
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok:
            case HttpStatusCode.created: {
                const wrap = response.body?.plataforma ?? response.body
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
                    message: String(wrap?.message ?? response.message ?? 'Plataforma salva'),
                }
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async editPlataformas(params: PlataformasModel) {
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

    async deletePlataformas(id: number) {
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
