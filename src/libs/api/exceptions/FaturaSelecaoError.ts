/** Opção de bandeira no modal 422 `precisa_selecionar_bandeira` */
export type FaturaSelecaoBandeiraOption = {
    value?: number | string | null
    label: string
    qtd_numeros?: number
    criar?: boolean
    cor_principal?: string | null
    cor_secundaria?: string | null
}

/** Opção de final no modal 422 `precisa_selecionar_final` */
export type FaturaSelecaoNumeroOption = {
    value: number | string
    label: string
    ultimos_digitos?: string | null
}

/** Campos reenviados no retry do multipart após o modal */
export type FaturaSelecaoRetryPayload = {
    cartao_bandeira_id?: number | string | null
    bandeira?: string | null
    cartao_numero_id?: number | string | null
    ultimos_digitos?: string | null
}

export const FATURA_SELECAO_CODIGOS = [
    'precisa_selecionar_bandeira',
    'precisa_selecionar_final',
] as const

export type FaturaSelecaoCodigo = (typeof FATURA_SELECAO_CODIGOS)[number]

/** Erro 422 — cartão sem finais exige bandeira e/ou final no upload PDF/CSV */
export class FaturaSelecaoError extends Error {
    codigo?: string
    precisa_selecionar_bandeira: boolean
    precisa_selecionar_final: boolean
    bandeiras: FaturaSelecaoBandeiraOption[]
    numeros: FaturaSelecaoNumeroOption[]
    cartao_bandeira_id?: number | null
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const codigo = body?.codigo ?? body?.erro_codigo
        const message =
            body?.message
            || (codigo === 'precisa_selecionar_final'
                ? 'Selecione o final do cartão'
                : 'Selecione a bandeira da fatura')
        super(message)
        this.name = 'FaturaSelecaoError'
        this.codigo = codigo
        this.precisa_selecionar_bandeira = Boolean(
            body?.precisa_selecionar_bandeira
            || codigo === 'precisa_selecionar_bandeira'
        )
        this.precisa_selecionar_final = Boolean(
            body?.precisa_selecionar_final
            || codigo === 'precisa_selecionar_final'
        )
        this.bandeiras = Array.isArray(body?.bandeiras) ? body.bandeiras : []
        this.numeros = Array.isArray(body?.numeros) ? body.numeros : []
        this.cartao_bandeira_id =
            body?.cartao_bandeira_id != null ? Number(body.cartao_bandeira_id) : null
        this.body = body ?? undefined
    }

    static isSelecaoBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        // Modal de metadados pode trazer precisa_selecionar_bandeira junto — não tratar aqui
        if (
            body.precisa_confirmar_metadados === true
            || codigo === 'precisa_confirmar_metadados'
            || body.precisa_confirmar_titular === true
            || codigo === 'precisa_confirmar_titular'
            || body.precisa_cartao_do_titular === true
            || codigo === 'precisa_cartao_do_titular'
        ) {
            return false
        }
        return (
            body.precisa_selecionar_bandeira === true
            || body.precisa_selecionar_final === true
            || (typeof codigo === 'string'
                && (FATURA_SELECAO_CODIGOS as readonly string[]).includes(codigo))
        )
    }
}
