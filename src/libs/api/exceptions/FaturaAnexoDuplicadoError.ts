export const FATURA_ANEXO_DUPLICADO_CODIGO = 'anexo_duplicado' as const

export type ConfirmarAnexoDuplicado = 'substituir' | 'manter'

export type FaturaExistenteAnexoDuplicado = {
    id: number
    cartao_id?: number | null
    cartao_nome?: string | null
    bandeira?: string | null
    pessoa_id?: number | null
    pessoa_nome?: string | null
    mes?: number | null
    ano?: number | null
    competencia?: string | null
    periodo_inicio?: string | null
    periodo_fim?: string | null
    data_vencimento?: string | null
    valor_total?: number | string | null
    status?: string | null
    total_transacoes?: number | null
    tem_pdf?: boolean
    tem_csv?: boolean
    pdf_url?: string | null
    csv_url?: string | null
    nome_original?: string | null
    nome_original_pdf?: string | null
    nome_original_csv?: string | null
    processado_em?: string | null
    created_at?: string | null
}

export type FaturaAnexoDuplicadoRetryPayload = {
    confirmar_anexo_duplicado: ConfirmarAnexoDuplicado
    fatura_duplicada_id: number
}

const parseFaturaExistente = (raw: unknown): FaturaExistenteAnexoDuplicado | null => {
    if (!raw || typeof raw !== 'object') return null
    const rec = raw as Record<string, unknown>
    const id = Number(rec.id)
    if (!Number.isFinite(id) || id <= 0) return null
    return rec as unknown as FaturaExistenteAnexoDuplicado
}

/** 422 — o conteúdo do arquivo já está anexado em outra fatura da conta */
export class FaturaAnexoDuplicadoError extends Error {
    codigo?: string
    anexo_duplicado: boolean
    orientacao?: string | null
    fatura_existente: FaturaExistenteAnexoDuplicado | null
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.orientacao
            || 'Este arquivo já foi anexado em outra fatura. Deseja substituir o anexo ou manter o que já está salvo?'
        super(message)
        this.name = 'FaturaAnexoDuplicadoError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.anexo_duplicado = Boolean(
            body?.anexo_duplicado
            || this.codigo === FATURA_ANEXO_DUPLICADO_CODIGO
        )
        this.orientacao = body?.orientacao ?? null
        this.fatura_existente = parseFaturaExistente(body?.fatura_existente)
        this.body = body ?? undefined
    }

    static isAnexoDuplicadoBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        if (
            body.precisa_cartao_do_titular === true
            || codigo === 'precisa_cartao_do_titular'
        ) {
            return false
        }
        return (
            body.anexo_duplicado === true
            || codigo === FATURA_ANEXO_DUPLICADO_CODIGO
        )
    }
}
