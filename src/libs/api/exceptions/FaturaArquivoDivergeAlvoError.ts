import { FaturaExistenteAnexoDuplicado } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'

export const FATURA_ARQUIVO_DIVERGE_ALVO_CODIGO = 'arquivo_diverge_alvo' as const

export type SugestaoArquivoDiverge = {
    mes?: number | null
    ano?: number | null
    parser?: string | null
    bandeira_sugerida?: string | null
    cartao_nome_sugerido?: string | null
    cartao_id?: number | null
}

const parseSugestao = (raw: unknown): SugestaoArquivoDiverge => {
    if (!raw || typeof raw !== 'object') return {}
    return raw as SugestaoArquivoDiverge
}

const parseId = (raw: unknown): number | null => {
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
}

/**
 * 422 — o substituir foi recusado: o arquivo não é do cartão, bandeira e competência do alvo.
 * A fatura alvo não foi alterada. O próximo passo é cadastrar, sem repetir a confirmação.
 */
export class FaturaArquivoDivergeAlvoError extends Error {
    codigo?: string
    arquivo_diverge_alvo: boolean
    acao_sugerida: 'cadastrar'
    orientacao?: string | null
    /** Alvo recusado. Não reenviar no cadastro seguinte. */
    fatura_existente_id: number | null
    fatura_existente: FaturaExistenteAnexoDuplicado | null
    sugestao: SugestaoArquivoDiverge
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.orientacao
            || 'Este arquivo não é do mesmo cartão, bandeira e competência. Confirme para cadastrar em vez de substituir.'
        super(message)
        this.name = 'FaturaArquivoDivergeAlvoError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.arquivo_diverge_alvo = Boolean(
            body?.arquivo_diverge_alvo
            || this.codigo === FATURA_ARQUIVO_DIVERGE_ALVO_CODIGO
        )
        this.acao_sugerida = 'cadastrar'
        this.orientacao = typeof body?.orientacao === 'string' ? body.orientacao : null
        this.sugestao = parseSugestao(body?.sugestao)
        const existente = body?.fatura_existente
        this.fatura_existente =
            existente && typeof existente === 'object' && parseId((existente as FaturaExistenteAnexoDuplicado).id) != null
                ? existente as FaturaExistenteAnexoDuplicado
                : null
        this.fatura_existente_id =
            parseId(this.fatura_existente?.id)
            ?? parseId(body?.fatura_existente_id)
        this.body = body ?? undefined
    }

    static isArquivoDivergeAlvoBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        return (
            body.arquivo_diverge_alvo === true
            || codigo === FATURA_ARQUIVO_DIVERGE_ALVO_CODIGO
        )
    }
}
