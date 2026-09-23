import {
    FaturaMetadadosModo,
    FaturaMetadadosSugestao,
} from 'libs/api/exceptions/FaturaMetadadosError'
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
}): CartaoBandeiraCadastro => {
    const novo = input.cadastrarCartao || Boolean(String(input.cartaoNome ?? '').trim())
    if (novo) {
        return {
            cartao_id: null,
            cartao_bandeira_id: input.bandeiraIdRetry ?? null,
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
