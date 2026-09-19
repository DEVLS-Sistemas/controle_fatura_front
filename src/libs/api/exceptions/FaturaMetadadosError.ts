import { ParserHomologado } from 'interfaces/Cartoes/CartoesInterface'
import { FaturaExistenteAnexoDuplicado } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { AcaoSugeridaFatura } from 'libs/api/exceptions/FaturaJaAnexadaError'
import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'

/** Cartão sugerido / disponível no modal `precisa_confirmar_metadados` */
export type FaturaMetadadosCartaoOption = {
    value: number | string
    label: string
    banco?: string | null
    sugerido?: boolean
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
}

export type FaturaMetadadosConferencia = {
    valor_cabecalho?: number | string | null
    soma_transacoes?: number | string | null
    bate?: boolean
    diferenca?: number | string | null
}

export type FaturaMetadadosConfianca =
    | 'alta'
    | 'media'
    | 'ambigua'
    | 'informado'
    | 'baixa'
    | string

export type FaturaMetadadosSugestao = {
    cartao_id?: number | null
    cartao_nome?: string | null
    mes?: number | null
    ano?: number | null
    parser?: string | null
    ultimos_digitos?: string[] | null
    bandeira_sugerida?: string | null
    cartao_bandeira_id?: number | null
    valor_fatura?: number | string | null
    confianca?: FaturaMetadadosConfianca | null
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    aviso_parser?: string | null
    conferencia?: FaturaMetadadosConferencia | null
    acao_sugerida?: AcaoSugeridaFatura | string | null
    fatura_existente_id?: number | null
    fatura_existente?: FaturaExistenteAnexoDuplicado | null
}

/** Campos reenviados no retry após confirmar metadados */
export type FaturaMetadadosRetryPayload = {
    /** Cartão já existente */
    cartao_id?: number | string | null
    /**
     * Cria o cartão no mesmo fluxo (quando não há `cartao_id`).
     * Back deve cadastrar o grupo + bandeira e vincular a fatura.
     */
    cartao_nome?: string | null
    cadastrar_cartao?: boolean
    mes: number | string
    ano: number | string
    cartao_bandeira_id?: number | string | null
    bandeira?: string | null
    confirmar_substituir_fatura?: boolean
    fatura_existente_id?: number | string | null
}

export const FATURA_METADADOS_CODIGO = 'precisa_confirmar_metadados' as const

/** Erro 422 — back leu cartão/mês/ano do arquivo e pede confirmação */
export class FaturaMetadadosError extends Error {
    codigo?: string
    precisa_confirmar_metadados: boolean
    precisa_selecionar_bandeira: boolean
    acao_sugerida: AcaoSugeridaFatura | null
    fatura_existente: FaturaExistenteAnexoDuplicado | null
    fatura_existente_id: number | null
    sugestao: FaturaMetadadosSugestao
    cartoes: FaturaMetadadosCartaoOption[]
    bandeiras: FaturaSelecaoBandeiraOption[]
    candidatos_cartao: Record<string, unknown>[]
    body?: Record<string, unknown>

    constructor(body?: Record<string, any> | null) {
        const message =
            body?.message
            || 'Confirme o cartão, mês e ano identificados na fatura'
        super(message)
        this.name = 'FaturaMetadadosError'
        this.codigo = body?.codigo ?? body?.erro_codigo
        this.precisa_confirmar_metadados = Boolean(
            body?.precisa_confirmar_metadados
            || this.codigo === FATURA_METADADOS_CODIGO
        )
        this.precisa_selecionar_bandeira = Boolean(body?.precisa_selecionar_bandeira)
        this.sugestao = (body?.sugestao && typeof body.sugestao === 'object')
            ? body.sugestao
            : {}
        const acaoRaw = body?.acao_sugerida ?? this.sugestao.acao_sugerida
        this.acao_sugerida =
            acaoRaw === 'cadastrar' || acaoRaw === 'substituir' ? acaoRaw : null
        const existenteRaw = body?.fatura_existente ?? this.sugestao.fatura_existente
        const existenteId = Number(
            body?.fatura_existente_id
            ?? this.sugestao.fatura_existente_id
            ?? (existenteRaw && typeof existenteRaw === 'object' ? (existenteRaw as FaturaExistenteAnexoDuplicado).id : null)
        )
        this.fatura_existente =
            existenteRaw && typeof existenteRaw === 'object' && Number((existenteRaw as FaturaExistenteAnexoDuplicado).id) > 0
                ? existenteRaw as FaturaExistenteAnexoDuplicado
                : null
        this.fatura_existente_id = Number.isFinite(existenteId) && existenteId > 0
            ? existenteId
            : (this.fatura_existente?.id ?? null)
        this.cartoes = Array.isArray(body?.cartoes) ? body.cartoes : []
        this.bandeiras = Array.isArray(body?.bandeiras) ? body.bandeiras : []
        this.candidatos_cartao = Array.isArray(body?.candidatos_cartao)
            ? body.candidatos_cartao
            : []
        this.body = body ?? undefined
    }

    static isMetadadosBody(body?: Record<string, any> | null): boolean {
        if (!body) return false
        const codigo = body.codigo ?? body.erro_codigo
        if (
            body.precisa_confirmar_titular === true
            || codigo === 'precisa_confirmar_titular'
            || body.precisa_cartao_do_titular === true
            || codigo === 'precisa_cartao_do_titular'
            || body.anexo_duplicado === true
            || codigo === 'anexo_duplicado'
            || body.fatura_ja_anexada === true
            || codigo === 'fatura_ja_anexada'
            || body.fatura_processando === true
            || codigo === 'fatura_processando'
        ) {
            return false
        }
        return (
            body.precisa_confirmar_metadados === true
            || codigo === FATURA_METADADOS_CODIGO
        )
    }
}

/** Detecta 422 pedindo preenchimento manual quando o parser falha */
export const isFalhaDeteccaoMetadados = (body?: Record<string, any> | null): boolean => {
    if (!body || typeof body !== 'object') return false
    if (FaturaMetadadosError.isMetadadosBody(body)) return false
    const message = String(body.message ?? body.erro_mensagem ?? '').toLowerCase()
    return (
        message.includes('não foi possível identificar')
        || message.includes('nao foi possivel identificar')
        || message.includes('informe esses campos manualmente')
    )
}
