export const FATURA_PROCESSANDO_CODIGO = 'fatura_processando' as const

const parseId = (raw: unknown): number | null => {
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
}

/** 422 — tentou substituir o anexo com o job ainda rodando */
export class FaturaProcessandoError extends Error {
    codigo?: string
    fatura_processando: boolean
    fatura_existente_id: number | null
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || 'A fatura está sendo processada. Aguarde para substituir o anexo.'
        super(message)
        this.name = 'FaturaProcessandoError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.fatura_processando = Boolean(
            body?.fatura_processando
            || this.codigo === FATURA_PROCESSANDO_CODIGO
        )
        this.fatura_existente_id = parseId(body?.fatura_existente_id)
        this.body = body ?? undefined
    }

    static isFaturaProcessandoBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        return (
            body.fatura_processando === true
            || codigo === FATURA_PROCESSANDO_CODIGO
        )
    }
}
