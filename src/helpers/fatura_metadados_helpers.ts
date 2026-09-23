import {
    FaturaMetadadosModo,
    FaturaMetadadosSugestao,
    FaturaNoPeriodo,
} from 'libs/api/exceptions/FaturaMetadadosError'
import { AcaoSugeridaFatura } from 'libs/api/exceptions/FaturaJaAnexadaError'
import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'

export type { FaturaMetadadosModo }

const PARSER_NOME: Record<string, string> = {
    c6: 'C6',
    sofisa: 'Sofisa',
    nubank: 'Nubank',
    inter: 'Inter',
    itau: 'Itaú',
    bradesco: 'Bradesco',
    santander: 'Santander',
    xp: 'XP',
    picpay: 'PicPay',
}

export const nomeDoParserFatura = (parser?: string | null): string => {
    if (!parser) return ''
    const key = String(parser).toLowerCase().trim()
    if (!key) return ''
    return PARSER_NOME[key] || parser.charAt(0).toUpperCase() + parser.slice(1)
}

/** Depois do 422, o nome vem do payload (PDF). Não usar o cartão da rota. */
export const nomeCartaoDoPayload = (
    sugestao?: FaturaMetadadosSugestao | null,
    modo?: FaturaMetadadosModo | null
): string => {
    const sugerido = String(sugestao?.cartao_nome_sugerido ?? '').trim()
    if (sugerido) return sugerido
    const doParser = nomeDoParserFatura(sugestao?.parser)
    if (doParser) return doParser
    if (modo === 'cadastrar_cartao') return ''
    return String(sugestao?.cartao_nome ?? '').trim()
}

export const resolveModoMetadados = (input: {
    modo?: string | null
    pode_cadastrar_cartao?: boolean | null
    sugestao?: Pick<FaturaMetadadosSugestao, 'cartao_id' | 'confianca'> | null
}): FaturaMetadadosModo => {
    if (input.modo === 'cadastrar_cartao' || input.pode_cadastrar_cartao === true) {
        return 'cadastrar_cartao'
    }
    if (input.modo === 'confirmar_cartao') {
        return 'confirmar_cartao'
    }
    const id = input.sugestao?.cartao_id
    if (id == null || id === '' || input.sugestao?.confianca === 'baixa') {
        return 'cadastrar_cartao'
    }
    return 'confirmar_cartao'
}

/**
 * Cadastro de cartão novo: lista completa do 422 (ou lookup).
 * Não filtrar pelas bandeiras do cartão da tela (ex.: só Mastercard do PicPay).
 */
export const bandeirasDoModal = (input: {
    modo: FaturaMetadadosModo
    payload?: FaturaSelecaoBandeiraOption[] | null
    lookup?: FaturaSelecaoBandeiraOption[] | null
}): FaturaSelecaoBandeiraOption[] => {
    const payload = (input.payload ?? []).filter((b) => String(b.label ?? '').trim())
    const lookup = (input.lookup ?? []).filter((b) => String(b.label ?? '').trim())
    if (input.modo !== 'cadastrar_cartao') {
        return payload.length > 0 ? payload : lookup
    }
    const criaveis = payload.filter((b) => b.criar)
    if (criaveis.length >= 2) return payload
    if (lookup.length > payload.length) return lookup
    return payload.length > 0 ? payload : lookup
}

/**
 * Competência que já tem fatura: o select de bandeira fica visível
 * mesmo quando o cartão só tem uma bandeira cadastrada.
 */
export const competenciaExigeSelectBandeira = (input: {
    precisaSelecionarBandeira?: boolean | null
    faturasPeriodo?: FaturaNoPeriodo[] | null
}): boolean => (
    Boolean(input.precisaSelecionarBandeira) || (input.faturasPeriodo?.length ?? 0) > 0
)

/**
 * Lista editável: as do cartão e as que ainda não existem (`criar: true`).
 * Uma bandeira só não esconde as outras — Visa e Mastercard no mesmo mês são faturas diferentes.
 */
export const bandeirasDaCompetencia = (input: {
    payload?: FaturaSelecaoBandeiraOption[] | null
    lookup?: FaturaSelecaoBandeiraOption[] | null
}): FaturaSelecaoBandeiraOption[] => {
    const payload = (input.payload ?? []).filter((b) => String(b.label ?? '').trim())
    const lookup = (input.lookup ?? []).filter((b) => String(b.label ?? '').trim())
    const temCriar = payload.some((b) => b.criar)
    if (temCriar || (payload.length >= 2 && lookup.length === 0)) return payload
    if (lookup.length === 0) return payload
    const labels = new Set(payload.map((b) => b.label.trim().toLowerCase()))
    const extras = lookup.filter((b) => !labels.has(b.label.trim().toLowerCase()))
    return extras.length > 0 ? [...payload, ...extras] : payload
}

const normalizarBandeira = (valor?: string | null): string => (
    String(valor ?? '').trim().toLowerCase()
)

/** Fatura do mês cuja bandeira é a que está no select. */
export const faturaDoPeriodoPelaBandeira = (
    periodo: FaturaNoPeriodo[] | null | undefined,
    escolha: BandeiraEscolhidaModal,
): FaturaNoPeriodo | null => {
    if (escolha.criar) return null
    const lista = periodo ?? []
    if (escolha.cartao_bandeira_id != null && escolha.cartao_bandeira_id !== '') {
        const porId = lista.find((item) => (
            item.cartao_bandeira_id != null
            && Number(item.cartao_bandeira_id) === Number(escolha.cartao_bandeira_id)
        ))
        if (porId) return porId
    }
    const nome = normalizarBandeira(escolha.bandeira)
    if (!nome) return null
    return lista.find((item) => normalizarBandeira(item.bandeira) === nome) ?? null
}

export type BandeiraEscolhidaModal = {
    cartao_bandeira_id?: number | string | null
    bandeira?: string | null
    criar?: boolean
}

/** A bandeira do select ainda é a de `fatura_existente` (a sugerida), não outra do mês. */
export const bandeiraConfereComFaturaExistente = (
    escolha: BandeiraEscolhidaModal,
    fatura?: { id?: number | null, bandeira?: string | null, cartao_bandeira_id?: number | null } | null,
    periodo?: FaturaNoPeriodo[] | null,
): boolean => {
    if (escolha.criar) return false
    if (fatura?.id == null) return true
    const doPeriodo = (periodo ?? []).find((item) => Number(item.id) === Number(fatura.id))
    const idAlvo = doPeriodo?.cartao_bandeira_id ?? fatura.cartao_bandeira_id ?? null
    if (
        escolha.cartao_bandeira_id != null
        && escolha.cartao_bandeira_id !== ''
        && idAlvo != null
    ) {
        return Number(escolha.cartao_bandeira_id) === Number(idAlvo)
    }
    const escolhida = normalizarBandeira(escolha.bandeira)
    const daFatura = normalizarBandeira(doPeriodo?.bandeira ?? fatura.bandeira)
    if (escolhida && daFatura) return escolhida === daFatura
    return true
}

export type RetryMetadadosPelaBandeira = {
    acao: AcaoSugeridaFatura
    fatura_existente_id?: number
    confirmar_substituir_fatura?: true
}

/**
 * A bandeira selecionada decide o botão.
 * Se essa bandeira já tem fatura com anexo no mês → Substituir essa fatura.
 * Se não tem → Cadastrar, sem o id de outra bandeira.
 */
export const retryMetadadosPelaBandeira = (input: {
    exigeBandeira: boolean
    escolha?: BandeiraEscolhidaModal | null
    periodo?: FaturaNoPeriodo[] | null
    confereComExistente: boolean
    faturaTemAnexo: boolean
    faturaId?: number | null
}): RetryMetadadosPelaBandeira => {
    const escolha = input.escolha ?? {}
    const doPeriodo = input.exigeBandeira
        ? faturaDoPeriodoPelaBandeira(input.periodo, escolha)
        : null
    if (doPeriodo) {
        if (doPeriodo.tem_anexo) {
            return {
                acao: 'substituir',
                fatura_existente_id: doPeriodo.id,
                confirmar_substituir_fatura: true,
            }
        }
        return { acao: 'cadastrar', fatura_existente_id: doPeriodo.id }
    }
    if (input.exigeBandeira && !input.confereComExistente) return { acao: 'cadastrar' }
    if (input.faturaTemAnexo && input.faturaId != null) {
        return {
            acao: 'substituir',
            fatura_existente_id: input.faturaId,
            confirmar_substituir_fatura: true,
        }
    }
    if (input.faturaId != null) {
        return { acao: 'cadastrar', fatura_existente_id: input.faturaId }
    }
    return { acao: 'cadastrar' }
}

export type CartaoBandeiraCadastro = {
    cartao_id: number | string | null
    cartao_bandeira_id: number | string | null
}

/**
 * Primeiro POST pode mandar `cartao_id` da tela como hint.
 * Retry de cadastrar cartão: sem o id da rota. Com PDF, não reenviar a bandeira auto do cartão da tela.
 */
export const cartaoEBandeiraDoCadastro = (input: {
    cadastrarCartao: boolean
    cartaoNome?: string | null
    cartaoIdRetry?: number | string | null
    bandeiraIdRetry?: number | string | null
    cartaoIdFormulario?: number | string | null
    bandeiraIdFormulario?: number | string | null
    temArquivo: boolean
    bandeiraDoFormularioExplicita?: boolean
    /** Nome enviado quando a opção é `criar: true`. Não reaproveita a bandeira auto do form. */
    bandeiraNomeRetry?: string | null
}): CartaoBandeiraCadastro => {
    const novo = input.cadastrarCartao || Boolean(String(input.cartaoNome ?? '').trim())
    if (novo) {
        return {
            cartao_id: null,
            cartao_bandeira_id: input.bandeiraIdRetry ?? null,
        }
    }
    const nomeNovaBandeira = String(input.bandeiraNomeRetry ?? '').trim()
    const idRetryVazio = input.bandeiraIdRetry == null || input.bandeiraIdRetry === ''
    if (nomeNovaBandeira && idRetryVazio) {
        return {
            cartao_id: input.cartaoIdRetry ?? input.cartaoIdFormulario ?? null,
            cartao_bandeira_id: null,
        }
    }
    const bandeiraId =
        input.bandeiraIdRetry
        ?? (input.temArquivo && !input.bandeiraDoFormularioExplicita
            ? null
            : (input.bandeiraIdFormulario ?? null))
        ?? null
    return {
        cartao_id: input.cartaoIdRetry ?? input.cartaoIdFormulario ?? null,
        cartao_bandeira_id: bandeiraId,
    }
}
