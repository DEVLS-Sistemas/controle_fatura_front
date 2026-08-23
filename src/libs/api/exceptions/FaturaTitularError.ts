export type FaturaTitularPessoaOption = {
    value?: number | string | null
    label?: string
    id?: number
    pessoa_id?: number
    nome?: string
    sobrenome?: string | null
    nome_completo?: string | null
    eh_principal?: boolean
}

export type FaturaTitularSugestao = {
    pessoa_id?: number | null
    pessoa_nome?: string | null
    pessoa_sobrenome?: string | null
    nome_no_cartao?: string | null
}

export type FaturaTitularRetryPayload = {
    pessoa_id?: number | string | null
    cadastrar_pessoa?: boolean
    pessoa_nome?: string | null
    pessoa_sobrenome?: string | null
    confirmar_titular?: boolean
}

export const FATURA_TITULAR_CODIGO = 'precisa_confirmar_titular' as const

const normalizeTitulares = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return []
    return raw
        .map((item) => {
            if (typeof item === 'string') return item.trim()
            if (item && typeof item === 'object') {
                const rec = item as Record<string, unknown>
                const nome = rec.nome ?? rec.label ?? rec.nome_no_cartao ?? rec.titular
                return typeof nome === 'string' ? nome.trim() : ''
            }
            return ''
        })
        .filter(Boolean)
}

/** Erro 422 — nome da fatura não bate com pessoas da conta */
export class FaturaTitularError extends Error {
    codigo?: string
    precisa_confirmar_titular: boolean
    orientacao?: string | null
    titulares: string[]
    nome_no_cartao?: string | null
    perfil_nome?: string | null
    pessoas: FaturaTitularPessoaOption[]
    sugestao: FaturaTitularSugestao
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.orientacao
            || 'O nome na fatura não corresponde a nenhuma pessoa cadastrada. Confirme o titular para continuar.'
        super(message)
        this.name = 'FaturaTitularError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.precisa_confirmar_titular = Boolean(
            body?.precisa_confirmar_titular
            || this.codigo === FATURA_TITULAR_CODIGO
        )
        this.orientacao = body?.orientacao ?? null
        this.titulares = normalizeTitulares(
            body?.titulares_detectados
            ?? body?.titulares_desconhecidos
            ?? body?.titulares
        )
        this.nome_no_cartao = body?.nome_no_cartao ?? body?.sugestao?.nome_no_cartao ?? null
        this.perfil_nome = body?.perfil_nome ?? null
        this.pessoas = Array.isArray(body?.pessoas) ? body.pessoas : []
        this.sugestao = (body?.sugestao && typeof body.sugestao === 'object')
            ? body.sugestao
            : {}
        if (body?.pessoa_sugerida_id != null && this.sugestao.pessoa_id == null) {
            this.sugestao.pessoa_id = Number(body.pessoa_sugerida_id)
        }
        this.body = body ?? undefined

        if (this.titulares.length === 0 && this.nome_no_cartao) {
            this.titulares = [this.nome_no_cartao]
        }
    }

    static isTitularBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        if (body.precisa_cartao_do_titular === true || codigo === 'precisa_cartao_do_titular') {
            return false
        }
        return (
            body.precisa_confirmar_titular === true
            || codigo === FATURA_TITULAR_CODIGO
        )
    }
}
