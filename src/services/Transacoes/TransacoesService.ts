import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    EstabelecimentoDoFiltro,
    LookupsTransacoes,
    TransacoesInterface,
    TransacoesList,
    TransacoesModel,
    TransacoesSearch,
    TransacoesView,
} from "interfaces/Transacoes/TransacoesInterface"

const cleanSearchParams = (params: TransacoesSearch): Record<string, unknown> => {
    const clean: Record<string, unknown> = { ...params }
    Object.keys(clean).reduce(
        (acc, k) => (!clean[k] && clean[k] !== 0 && clean[k] !== false && delete acc[k], acc),
        clean
    )
    delete clean.page
    delete clean.perPage
    return clean
}

const normalizeEstabelecimentosDoFiltro = (body: any): EstabelecimentoDoFiltro[] => {
    const raw = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.estabelecimentos)
                ? body.estabelecimentos
                : Array.isArray(body?.estabelecimentos?.data)
                    ? body.estabelecimentos.data
                    : []

    return raw
        .map((item: any) => {
            const id = Number(item?.id ?? item?.estabelecimento_id)
            if (!Number.isFinite(id)) return null
            return {
                id,
                nome: String(item?.nome ?? item?.estabelecimento_nome ?? `#${id}`),
                loja_id: item?.loja_id != null ? Number(item.loja_id) : null,
                loja_nome: item?.loja_nome ?? null,
                transacoes_count: Number(item?.transacoes_count ?? item?.total ?? 0) || 0,
            } as EstabelecimentoDoFiltro
        })
        .filter(Boolean) as EstabelecimentoDoFiltro[]
}

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

    async listEstabelecimentosDoFiltro(params: TransacoesSearch): Promise<EstabelecimentoDoFiltro[]> {
        const body = cleanSearchParams(params)
        if (params.apenas_sem_loja) {
            body.apenas_sem_loja = 1
        } else {
            delete body.apenas_sem_loja
        }

        const response = await this.httpClient.get<any>({
            url: this.url + '/estabelecimentos-do-filtro',
            body,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return normalizeEstabelecimentosDoFiltro(response.body)
            case HttpStatusCode.unauthorized:
                throw new AccessDeniedError()
            case HttpStatusCode.invalidForm:
                throw new ValidationError(response.body)
            default:
                throw new UnexpectedError(response.message)
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

    async deleteTransacoes(id: number, options?: { excluir_grupo?: boolean }) {
        const qs = options?.excluir_grupo ? '?excluir_grupo=1' : ''
        const response = await this.httpClient.delete({
            url: this.url + '/excluir/' + id + qs
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
