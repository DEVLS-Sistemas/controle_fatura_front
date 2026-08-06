import { SenhaPdfMeta } from 'interfaces/Faturas/FaturasInterface'

/** Erro 422 / fluxo de PDF protegido por senha ao processar fatura */
export class PdfSenhaError extends Error {
    codigo?: string
    precisa_senha_pdf: boolean
    senha_pdf?: SenhaPdfMeta | null
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.erro_mensagem
            || 'Este PDF da fatura está protegido por senha. Informe a senha para continuar.'
        super(message)
        this.name = 'PdfSenhaError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.precisa_senha_pdf = Boolean(body?.precisa_senha_pdf ?? true)
        this.senha_pdf = body?.senha_pdf ?? null
        this.body = body ?? undefined
    }
}
