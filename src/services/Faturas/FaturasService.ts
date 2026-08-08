import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    ExcluirTodasFaturasResponse,
    FaturasCartaoGroup,
    FaturasInterface,
    FaturasModel,
    FaturasSearch,
    FaturasView,
    LookupsFaturas,
    ProcessarPdfParams,
} from "interfaces/Faturas/FaturasInterface"
import { PdfSenhaError } from "../../libs/api/exceptions/PdfSenhaError"
import { FaturaSelecaoError } from "../../libs/api/exceptions/FaturaSelecaoError"
import { FaturaMetadadosError } from "../../libs/api/exceptions/FaturaMetadadosError"

export class FaturasService implements FaturasInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'faturas'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewFaturas(params: any): Promise<FaturasView | undefined> {
        const response = await this.httpClient.get<FaturasView>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async listFaturasPaginate(params: FaturasSearch): Promise<PaginateInterface<FaturasCartaoGroup> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<FaturasCartaoGroup>>({
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
            console.error('Erro ao buscar faturas:', error)
            throw error
        }
    }

    async AsyncListFaturas(params: FaturasSearch): Promise<FaturasModel[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/faturas-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async getLookupsFaturas(): Promise<LookupsFaturas | undefined> {
        const response = await this.httpClient.get<LookupsFaturas>({
            url: this.url + '/lookups'
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async createFaturas(params: FaturasModel) {
        const form = new FormData()
        Object.entries(params).forEach(([k, v]) => {
            if (v === null || v === undefined) return
            if (k === 'arquivo_pdf' && v instanceof File) form.append('arquivo_pdf', v)
            else form.append(k, String(v))
        })
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar',
            body: form,
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: {
                const body = response.body as Record<string, any> | undefined
                // Metadados tem prioridade: a resposta pode vir com precisa_selecionar_bandeira junto
                if (FaturaMetadadosError.isMetadadosBody(body)) {
                    throw new FaturaMetadadosError(body)
                }
                if (FaturaSelecaoError.isSelecaoBody(body)) {
                    throw new FaturaSelecaoError(body)
                }
                if (body?.precisa_senha_pdf || body?.codigo === 'pdf_senha_incorreta' || body?.codigo === 'pdf_senha_necessaria') {
                    throw new PdfSenhaError(body)
                }
                throw new ValidationError(response.body)
            }
            default: throw new UnexpectedError(response.message)
        }
    }

    async editFaturas(params: FaturasModel) {
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

    async deleteFaturas(id: number) {
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

    async deleteAllFaturas(): Promise<ExcluirTodasFaturasResponse> {
        const response = await this.httpClient.delete<ExcluirTodasFaturasResponse>({
            url: this.url + '/excluir-todas',
            body: { confirmar: true },
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }

    async uploadPdf(params: {
        id: number
        arquivo_pdf: File
        processar_automatico?: boolean
        senha_pdf?: string
        salvar_senha_pdf?: boolean
        senha_pdf_regra?: string | null
        cartao_bandeira_id?: number | string | null
        bandeira?: string | null
        cartao_numero_id?: number | string | null
        ultimos_digitos?: string | null
    }) {
        const form = new FormData()
        form.append('id', String(params.id))
        form.append('arquivo_pdf', params.arquivo_pdf)
        if (params.processar_automatico !== undefined) {
            form.append('processar_automatico', String(params.processar_automatico))
        }
        if (params.senha_pdf != null && params.senha_pdf !== '') {
            form.append('senha_pdf', params.senha_pdf)
        }
        if (params.salvar_senha_pdf !== undefined) {
            form.append('salvar_senha_pdf', params.salvar_senha_pdf ? '1' : '0')
        }
        if (params.senha_pdf_regra != null && params.senha_pdf_regra !== '') {
            form.append('senha_pdf_regra', params.senha_pdf_regra)
        }
        if (params.cartao_bandeira_id != null && params.cartao_bandeira_id !== '') {
            form.append('cartao_bandeira_id', String(params.cartao_bandeira_id))
        }
        if (params.bandeira != null && params.bandeira !== '') {
            form.append('bandeira', String(params.bandeira))
        }
        if (params.cartao_numero_id != null && params.cartao_numero_id !== '') {
            form.append('cartao_numero_id', String(params.cartao_numero_id))
        }
        if (params.ultimos_digitos != null && params.ultimos_digitos !== '') {
            form.append('ultimos_digitos', String(params.ultimos_digitos))
        }
        const response = await this.httpClient.post({
            url: this.url + '/upload-pdf',
            body: form,
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: {
                const body = response.body as Record<string, any> | undefined
                if (FaturaSelecaoError.isSelecaoBody(body)) {
                    throw new FaturaSelecaoError(body)
                }
                if (body?.precisa_senha_pdf || body?.codigo === 'pdf_senha_incorreta' || body?.codigo === 'pdf_senha_necessaria') {
                    throw new PdfSenhaError(body)
                }
                throw new ValidationError(response.body)
            }
            default: throw new UnexpectedError(response.message)
        }
    }

    async processarPdf(id: number, params?: ProcessarPdfParams) {
        const body: ProcessarPdfParams = {}
        if (params?.senha_pdf != null && params.senha_pdf !== '') {
            body.senha_pdf = params.senha_pdf
        }
        if (params?.salvar_senha_pdf !== undefined) {
            body.salvar_senha_pdf = params.salvar_senha_pdf
        }
        if (params?.senha_pdf_regra != null && params.senha_pdf_regra !== '') {
            body.senha_pdf_regra = params.senha_pdf_regra
        }
        const response = await this.httpClient.post({
            url: `${this.url}/processar/${id}`,
            body: Object.keys(body).length ? body : undefined,
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: {
                const respBody = response.body as Record<string, any> | undefined
                if (
                    respBody?.precisa_senha_pdf
                    || respBody?.codigo === 'pdf_senha_incorreta'
                    || respBody?.codigo === 'pdf_senha_necessaria'
                ) {
                    throw new PdfSenhaError(respBody)
                }
                throw new ValidationError(response.body)
            }
            default: throw new UnexpectedError(response.message)
        }
    }
}
