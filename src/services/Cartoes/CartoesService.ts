import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    BandeiraListItem,
    CartoesInterface,
    CartoesList,
    CartoesModel,
    CartoesSearch,
    CartoesView,
    CartaoRapidoPayload,
    CartaoRapidoResult,
    LookupsCartoes,
    NumeroListItem,
    NumerosListParams,
} from "interfaces/Cartoes/CartoesInterface"

export class CartoesService implements CartoesInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'cartoes'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewCartoes(params: { id: number | string }): Promise<CartoesView | undefined> {
        const response = await this.httpClient.get<any>({
            url: `${this.url}/listar/${params.id}`
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: {
                const body = response.body
                if (!body) return undefined
                if (body.nome != null || body.cor_fundo || body.bandeiras) return body
                return body.data ?? body.cartao?.data ?? body.cartao ?? body
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listCartoesPaginate(params: CartoesSearch): Promise<PaginateInterface<CartoesList> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<CartoesList>>({
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
            console.error('Erro ao buscar cartoes:', error)
            throw error
        }
    }

    async AsyncListCartoes(params: CartoesSearch): Promise<CartoesModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/cartoes-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async AsyncListBandeiras(params: { cartao_id: number | string }): Promise<BandeiraListItem[] | undefined> {
        const response = await this.httpClient.get<BandeiraListItem[]>({
            url: this.url + '/bandeiras-list',
            body: params,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async AsyncListNumeros(params: NumerosListParams): Promise<NumeroListItem[] | undefined> {
        const response = await this.httpClient.get<NumeroListItem[]>({
            url: this.url + '/numeros-list',
            body: params,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsCartoes(): Promise<LookupsCartoes | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: {
                const body = response.body
                const data = body?.data && !Array.isArray(body.data) ? body.data : body
                return data
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createCartoes(params: CartoesModel) {
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

    async createCartoesRapido(params: CartaoRapidoPayload): Promise<CartaoRapidoResult> {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar-rapido',
            body: params,
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok:
            case HttpStatusCode.created: {
                const wrap = response.body?.cartao ?? response.body
                const data = wrap?.data ?? wrap
                const id = Number(data?.id ?? data?.cartao_id)
                if (!Number.isFinite(id) || id <= 0) {
                    throw new UnexpectedError(response.message || 'Resposta inválida do cadastro rápido')
                }
                return {
                    data: {
                        id,
                        cartao_id: Number(data.cartao_id ?? id),
                        cartao_numero_id: data.cartao_numero_id != null
                            ? Number(data.cartao_numero_id)
                            : null,
                        nome: String(data.nome ?? params.nome ?? `Cartão ${id}`),
                        banco: data.banco ?? null,
                        dia_limite_fatura: data.dia_limite_fatura != null
                            ? Number(data.dia_limite_fatura)
                            : (params.dia_limite_fatura ?? null),
                        dia_vencimento_fatura: data.dia_vencimento_fatura != null
                            ? Number(data.dia_vencimento_fatura)
                            : (params.dia_vencimento_fatura ?? null),
                        cor_fundo: data.cor_fundo ?? null,
                        cor_texto: data.cor_texto ?? null,
                        pessoa_id: data.pessoa_id != null ? Number(data.pessoa_id) : null,
                        pessoa_nome: data.pessoa_nome
                            ?? data.pessoa?.nome_completo
                            ?? data.pessoa?.nome
                            ?? null,
                        bandeiras: Array.isArray(data.bandeiras) ? data.bandeiras : [],
                    },
                    status: Boolean(wrap?.status ?? true),
                    criado: Boolean(wrap?.criado),
                    message: String(wrap?.message ?? response.message ?? 'Cartão salvo'),
                }
            }
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async editCartoes(params: CartoesModel) {
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

    /**
     * Atualiza só a regra de senha do PDF no cartão (sem alterar a senha).
     * Usado após desbloqueio com "salvar senha", pois o processar grava a senha
     * mas pode não persistir `senha_pdf_regra`.
     */
    async atualizarSenhaPdfRegra(cartaoId: number, senhaPdfRegra: string) {
        const view = await this.getViewCartoes({ id: cartaoId })
        const cartao = ((view as any)?.data ?? (view as any)?.cartao?.data ?? view) as CartoesView | undefined
        if (!cartao?.nome) {
            throw new UnexpectedError('Não foi possível carregar o cartão para atualizar a regra da senha.')
        }

        return this.editCartoes({
            id: cartaoId,
            cartao_id: cartaoId,
            nome: cartao.nome ?? null,
            banco: cartao.banco ?? null,
            dia_limite_fatura: cartao.dia_limite_fatura ?? null,
            dia_vencimento_fatura: cartao.dia_vencimento_fatura ?? null,
            cor_fundo: cartao.cor_fundo ?? null,
            cor_texto: cartao.cor_texto ?? null,
            ativo: cartao.ativo !== false,
            senha_pdf_regra: senhaPdfRegra,
        })
    }

    async deleteCartoes(id: number) {
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
