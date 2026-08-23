import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'
import { FaturaTitularPessoaOption } from 'libs/api/exceptions/FaturaTitularError'

export const FATURA_CARTAO_TITULAR_CODIGO = 'precisa_cartao_do_titular' as const

export type FaturaCartaoTitularSugestao = {
    cartao_id?: number | null
    cartao_nome?: string | null
    cartao_nome_sugerido?: string | null
    mes?: number | null
    ano?: number | null
    pessoa_id?: number | null
    bandeira_sugerida?: string | null
}

export type FaturaCartaoTitularRetryPayload = {
    cadastrar_cartao?: boolean
    cartao_nome: string
    bandeira?: string | null
    cartao_bandeira_id?: number | string | null
    mes: number | string
    ano: number | string
    pessoa_id?: number | string | null
}

const normalizeNomes = (raw: unknown): string[] => {
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

/** 422 — já existe fatura do mês neste cartão; outra pessoa precisa de outro cartão */
export class FaturaCartaoTitularError extends Error {
    codigo?: string
    precisa_cartao_do_titular: boolean
    pode_cadastrar_cartao: boolean
    /** Só no guard do front: reenvio no mesmo cartão (mesma pessoa) */
    permitir_substituir: boolean
    fatura_existente_id?: number | null
    cartao_existente_id?: number | null
    pessoa_existente_nome?: string | null
    cartao_existente_nome?: string | null
    titulares_detectados: string[]
    orientacao?: string | null
    sugestao: FaturaCartaoTitularSugestao
    pessoas: FaturaTitularPessoaOption[]
    bandeiras: FaturaSelecaoBandeiraOption[]
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || body?.orientacao
            || 'Já existe fatura deste mês neste cartão. Faturas de pessoas diferentes precisam de cartões separados.'
        super(message)
        this.name = 'FaturaCartaoTitularError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.precisa_cartao_do_titular = Boolean(
            body?.precisa_cartao_do_titular
            || this.codigo === FATURA_CARTAO_TITULAR_CODIGO
        )
        this.pode_cadastrar_cartao = body?.pode_cadastrar_cartao !== false
        this.permitir_substituir = Boolean(body?.permitir_substituir)
        this.fatura_existente_id =
            body?.fatura_existente_id != null ? Number(body.fatura_existente_id) : null
        this.cartao_existente_id =
            body?.cartao_existente_id != null ? Number(body.cartao_existente_id) : null
        this.pessoa_existente_nome = body?.pessoa_existente_nome ?? null
        this.cartao_existente_nome = body?.cartao_existente_nome ?? body?.sugestao?.cartao_nome ?? null
        this.titulares_detectados = normalizeNomes(
            body?.titulares_detectados ?? body?.titulares
        )
        this.orientacao = body?.orientacao ?? null
        this.sugestao = (body?.sugestao && typeof body.sugestao === 'object')
            ? body.sugestao
            : {}
        this.pessoas = Array.isArray(body?.pessoas) ? body.pessoas : []
        this.bandeiras = Array.isArray(body?.bandeiras) ? body.bandeiras : []
        this.body = body ?? undefined
    }

    static isCartaoTitularBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        return (
            body.precisa_cartao_do_titular === true
            || codigo === FATURA_CARTAO_TITULAR_CODIGO
        )
    }
}
