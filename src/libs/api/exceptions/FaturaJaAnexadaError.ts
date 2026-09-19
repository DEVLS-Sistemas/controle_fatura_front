import { FaturaExistenteAnexoDuplicado } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { FaturaProcessandoError } from 'libs/api/exceptions/FaturaProcessandoError'

export const FATURA_JA_ANEXADA_CODIGO = 'fatura_ja_anexada' as const

export type AcaoSugeridaFatura = 'cadastrar' | 'substituir'

export type FaturaJaAnexadaRetryPayload = {
    confirmar_substituir_fatura: true
    fatura_existente_id: number
}

const parseFaturaExistente = (raw: unknown): FaturaExistenteAnexoDuplicado | null => {
    if (!raw || typeof raw !== 'object') return null
    const rec = raw as Record<string, unknown>
    const id = Number(rec.id)
    if (!Number.isFinite(id) || id <= 0) return null
    return rec as unknown as FaturaExistenteAnexoDuplicado
}

const parseAcao = (raw: unknown): AcaoSugeridaFatura | null => {
    if (raw === 'cadastrar' || raw === 'substituir') return raw
    return null
}

const parseId = (raw: unknown): number | null => {
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
}

/** 422 — a competência já tem fatura com anexo; o arquivo é outro (hash diferente) */
export class FaturaJaAnexadaError extends Error {
    codigo?: string
    fatura_ja_anexada: boolean
    acao_sugerida: AcaoSugeridaFatura
    orientacao?: string | null
    fatura_existente: FaturaExistenteAnexoDuplicado | null
    fatura_existente_id: number | null
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.orientacao
            || 'Já existe uma fatura com anexo nesta competência. Confirme para substituir a fatura.'
        super(message)
        this.name = 'FaturaJaAnexadaError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.fatura_ja_anexada = Boolean(
            body?.fatura_ja_anexada
            || this.codigo === FATURA_JA_ANEXADA_CODIGO
        )
        this.acao_sugerida = parseAcao(body?.acao_sugerida) ?? 'substituir'
        this.orientacao = body?.orientacao ?? null
        this.fatura_existente = parseFaturaExistente(body?.fatura_existente)
        this.fatura_existente_id =
            parseId(body?.fatura_existente_id)
            ?? this.fatura_existente?.id
            ?? null
        this.body = body ?? undefined
    }

    static isFaturaJaAnexadaBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        if (
            body.anexo_duplicado === true
            || codigo === 'anexo_duplicado'
            || body.precisa_cartao_do_titular === true
            || codigo === 'precisa_cartao_do_titular'
            || FaturaProcessandoError.isFaturaProcessandoBody(body)
        ) {
            return false
        }
        return (
            body.fatura_ja_anexada === true
            || codigo === FATURA_JA_ANEXADA_CODIGO
        )
    }
}
