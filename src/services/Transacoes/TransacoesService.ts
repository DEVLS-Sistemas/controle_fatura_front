import { parseContentDispositionFilename } from "../../helpers/anexo_filename_helpers"
import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    CandidatoConciliacao,
    CompraAnexo,
    CompraHistoricoItem,
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

    async listCandidatosConciliacao(identificador: string | number): Promise<CandidatoConciliacao[]> {
        const response = await this.httpClient.get<any>({
            url: `${this.url}/candidatos-conciliacao/${encodeURIComponent(String(identificador))}`,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return unwrapCandidatos(response.body)
            case HttpStatusCode.unauthorized:
                throw new AccessDeniedError()
            case HttpStatusCode.invalidForm:
                throw new ValidationError(response.body)
            default:
                throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async conciliarTransacao(params: { compra_id: string | number; lancamento_id: string | number }) {
        const response = await this.httpClient.post({
            url: this.url + '/conciliar',
            body: params,
        })
        return unwrapMutation(response, 'Erro ao conciliar')
    }

    async desvincularConciliacao(params: {
        compra_id?: string | number
        lancamento_id?: string | number
        id?: string | number
    }) {
        const body: Record<string, unknown> = {}
        if (params.compra_id != null) body.compra_id = params.compra_id
        if (params.lancamento_id != null) body.lancamento_id = params.lancamento_id
        if (params.id != null) body.id = params.id
        const response = await this.httpClient.post({
            url: this.url + '/desvincular',
            body,
        })
        return unwrapMutation(response, 'Erro ao desvincular')
    }

    async rejeitarConciliacao(params: { compra_id: string | number }) {
        const response = await this.httpClient.post({
            url: this.url + '/rejeitar-conciliacao',
            body: params,
        })
        return unwrapMutation(response, 'Erro ao rejeitar conciliação')
    }

    async listAnexosTransacao(params: {
        transacao_id?: number | string
        identificador?: string | number
    }): Promise<CompraAnexo[]> {
        const body: Record<string, unknown> = {}
        if (params.transacao_id != null) body.transacao_id = params.transacao_id
        if (params.identificador != null) body.identificador = params.identificador
        const response = await this.httpClient.get<any>({
            url: this.url + '/anexos',
            body,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return unwrapAnexos(response.body)
            case HttpStatusCode.unauthorized:
                throw new AccessDeniedError()
            default:
                throw new UnexpectedError(response.body?.message || response.message)
        }
    }

    async uploadAnexosTransacao(params: {
        transacao_id?: number | string
        identificador?: string | number
        arquivos: File[]
        tipo?: string
    }) {
        const form = new FormData()
        if (params.transacao_id != null) form.append('transacao_id', String(params.transacao_id))
        if (params.identificador != null) form.append('identificador', String(params.identificador))
        if (params.tipo) form.append('tipo', params.tipo)
        if (params.arquivos.length === 1) {
            form.append('arquivo', params.arquivos[0])
        } else {
            params.arquivos.forEach((file) => form.append('arquivos[]', file))
        }
        const response = await this.httpClient.post({
            url: this.url + '/anexos',
            body: form,
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return unwrapMutation(response, 'Erro ao enviar anexo')
    }

    async downloadAnexoTransacao(id: number): Promise<{ blob: Blob; filename: string }> {
        const { ApiConfig } = await import('../../libs/api/ApiConfig')
        const response = await ApiConfig.get(`${this.url}/anexos/${id}`, {
            responseType: 'blob',
        })
        const filename = parseContentDispositionFilename(
            String(response.headers?.['content-disposition'] ?? ''),
        ) ?? `anexo-${id}`
        return { blob: response.data, filename }
    }

    async deleteAnexoTransacao(id: number) {
        const response = await this.httpClient.delete({
            url: `${this.url}/anexos/${id}`,
        })
        return unwrapMutation(response, 'Erro ao excluir anexo')
    }

    async getHistoricoTransacao(identificador: string | number): Promise<CompraHistoricoItem[]> {
        const response = await this.httpClient.get<any>({
            url: `${this.url}/historico/${encodeURIComponent(String(identificador))}`,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok:
                return unwrapHistorico(response.body)
            case HttpStatusCode.unauthorized:
                throw new AccessDeniedError()
            default:
                throw new UnexpectedError(response.body?.message || response.message)
        }
    }
}

const unwrapList = (body: any): any[] => {
    if (Array.isArray(body)) return body
    if (Array.isArray(body?.data)) return body.data
    if (Array.isArray(body?.candidatos)) return body.candidatos
    if (Array.isArray(body?.candidatos?.data)) return body.candidatos.data
    if (Array.isArray(body?.anexos)) return body.anexos
    if (Array.isArray(body?.anexos?.data)) return body.anexos.data
    if (Array.isArray(body?.historico)) return body.historico
    if (Array.isArray(body?.historico?.data)) return body.historico.data
    return []
}

const unwrapCandidatos = (body: any): CandidatoConciliacao[] =>
    unwrapList(body)
        .map((item: any) => {
            const id = Number(item?.id ?? item?.lancamento_id)
            if (!Number.isFinite(id) || id <= 0) return null
            return {
                id,
                lancamento_id: item?.lancamento_id != null ? Number(item.lancamento_id) : id,
                descricao: item?.descricao ?? item?.descricao_fatura ?? item?.estabelecimento_nome ?? null,
                descricao_fatura: item?.descricao_fatura ?? item?.descricao ?? null,
                estabelecimento_nome: item?.estabelecimento_nome ?? item?.estabelecimento ?? null,
                valor: item?.valor ?? item?.valor_parcela ?? null,
                data: item?.data ?? item?.data_compra ?? null,
                score: item?.score != null ? Number(item.score) : null,
                sugestao: item?.sugestao === true || item?.sugestao === 1,
            } as CandidatoConciliacao
        })
        .filter(Boolean) as CandidatoConciliacao[]

const unwrapAnexos = (body: any): CompraAnexo[] =>
    unwrapList(body)
        .map((item: any) => {
            const id = Number(item?.id)
            if (!Number.isFinite(id) || id <= 0) return null
            return {
                id,
                nome: item?.nome ?? item?.nome_original ?? null,
                nome_original: item?.nome_original ?? item?.nome ?? null,
                tipo: item?.tipo ?? null,
                mime: item?.mime ?? item?.mime_type ?? null,
                tamanho: item?.tamanho != null ? Number(item.tamanho) : null,
                created_at: item?.created_at ?? item?.data ?? null,
            } as CompraAnexo
        })
        .filter(Boolean) as CompraAnexo[]

const unwrapHistorico = (body: any): CompraHistoricoItem[] =>
    unwrapList(body).map((item: any, index: number) => ({
        id: item?.id != null ? Number(item.id) : index,
        acao: item?.acao ?? item?.action ?? null,
        descricao: item?.descricao ?? item?.message ?? item?.texto ?? null,
        created_at: item?.created_at ?? item?.data ?? null,
    }))

const unwrapMutation = (response: { statusCode: number; body?: any; message?: string }, fallback: string) => {
    switch (response.statusCode) {
        case HttpStatusCode.ok:
        case HttpStatusCode.created:
        case HttpStatusCode.noContent:
            return response.body
        case HttpStatusCode.unauthorized:
            throw new AccessDeniedError()
        case HttpStatusCode.invalidForm:
            throw new ValidationError(response.body)
        default:
            throw new UnexpectedError(response.body?.message || response.message || fallback)
    }
}
