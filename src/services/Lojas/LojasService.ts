import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    LojaLookup,
    LojaRapidoPayload,
    LojaRapidoResult,
    LojasInterface,
    LojasList,
    LojasModel,
    LojasSearch,
    LojasView,
    VincularEstabelecimentosPayload,
    VincularEstabelecimentosResult,
} from "interfaces/Lojas/LojasInterface"
import {
    PeriodoFiltro,
    unwrapApiData,
    withPeriodoQuery,
} from "interfaces/Estatisticas/EstatisticasCompraInterface"

export class LojasService implements LojasInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'lojas'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewLojas(params: { id: number | string } & PeriodoFiltro): Promise<LojasView | undefined> {
        const { id, ...periodo } = params
        const response = await this.httpClient.get<LojasView>({
            url: `${this.url}/listar/${id}`,
            body: withPeriodoQuery(periodo),
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return unwrapApiData<LojasView>(response.body, ['loja'])
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getEstatisticasLoja(id: number | string, periodo?: PeriodoFiltro): Promise<LojasView> {
        const response = await this.httpClient.get({
            url: `${this.url}/estatisticas/${id}`,
            body: withPeriodoQuery(periodo ?? {}),
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return unwrapApiData<LojasView>(response.body, ['loja'])
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listLojasPaginate(params: LojasSearch): Promise<PaginateInterface<LojasList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<LojasList>>({
                url: this.url + '/listar',
                body: withPeriodoQuery(params),
            })
            if (!response || !response.statusCode) throw new UnexpectedError()
            switch (response.statusCode) {
                case HttpStatusCode.ok: return response.body
                case HttpStatusCode.unauthorized: throw new AccessDeniedError()
                default: throw new UnexpectedError()
            }
        } catch (error) {
            console.error('Erro ao buscar lojas:', error)
            throw error
        }
    }

    async AsyncListLojas(params: LojasSearch): Promise<LojaLookup[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/lojas-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createLojas(params: LojasModel) {
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

    async createLojasRapido(params: LojaRapidoPayload): Promise<LojaRapidoResult> {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar-rapido',
            body: params,
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok:
            case HttpStatusCode.created: {
                const wrap = response.body?.loja ?? response.body
                const data = wrap?.data ?? wrap
                if (!data?.id) throw new UnexpectedError(response.message || 'Resposta inválida do cadastro rápido')
                return {
                    data: {
                        id: Number(data.id),
                        nome: String(data.nome ?? params.nome),
                        ativo: data.ativo ?? true,
                        estabelecimentos_count: data.estabelecimentos_count,
                        estabelecimentos: data.estabelecimentos,
                    },
                    status: Boolean(wrap?.status ?? true),
                    criado: Boolean(wrap?.criado),
                    message: String(wrap?.message ?? response.message ?? 'Loja salva'),
                }
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async vincularEstabelecimentos(params: VincularEstabelecimentosPayload): Promise<VincularEstabelecimentosResult> {
        const response = await this.httpClient.post({
            url: this.url + '/vincular-estabelecimentos',
            body: params,
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok:
            case HttpStatusCode.created: {
                const wrap = response.body?.loja ?? response.body
                const data = wrap?.data ?? wrap
                return {
                    data: data?.id
                        ? {
                            id: Number(data.id),
                            nome: String(data.nome ?? params.nome ?? ''),
                            ativo: data.ativo ?? true,
                            estabelecimentos_count: data.estabelecimentos_count,
                            estabelecimentos: data.estabelecimentos,
                        }
                        : undefined,
                    status: Boolean(wrap?.status ?? true),
                    criado: wrap?.criado != null ? Boolean(wrap.criado) : undefined,
                    vinculados: Number(wrap?.vinculados ?? params.estabelecimento_ids.length) || params.estabelecimento_ids.length,
                    message: String(
                        wrap?.message
                        ?? response.body?.message
                        ?? response.message
                        ?? 'Estabelecimentos vinculados com sucesso!'
                    ),
                }
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async editLojas(params: LojasModel) {
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

    async deleteLojas(id: number) {
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
