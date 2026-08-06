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
        const response = await this.httpClient.get<CartoesView>({
            url: `${this.url}/listar/${params.id}`
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
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
        const response = await this.httpClient.get<LookupsCartoes>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
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
