export interface CartoesSearch {
    id?: string | null
    cartao_id?: string | null
    nome?: string | null
    bandeira?: string | null
    banco?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
}

export type TipoNumeroCartao = 'fisico' | 'virtual' | 'adicional'

export interface CartaoNumero {
    id?: number | null
    /** Chave local temporária (antes do save) */
    _key?: string
    ultimos_digitos: string
    tipo?: TipoNumeroCartao | string | null
    /** Rótulo interno do usuário */
    apelido?: string | null
    /** Nome impresso no plástico (aparece na fatura PDF) */
    nome_no_cartao?: string | null
    ativo?: boolean
}

export interface CartaoBandeira {
    id?: number | null
    /** Chave local temporária (antes do save) */
    _key?: string
    bandeira: string
    /** Dígitos-centavos no form; string BR ou number na API */
    limite_credito?: number | string | null
    ativo?: boolean
    numeros?: CartaoNumero[]
}

/** Regra de senha do PDF — item de `GET /cartoes/lookups` → `senhas_pdf_regras` */
export interface SenhaPdfRegraLookup {
    value: string
    label: string
    orientacao?: string | null
    /** Quantidade de dígitos esperados (máscara / maxLength do campo senha) */
    digitos?: number | null
    bancos_sugeridos?: string[]
}

/** Extrai a quantidade de dígitos a partir do código da regra (ex.: cpf_cnpj_6_digitos → 6) */
export const resolveSenhaPdfRegraDigitos = (
    regra?: SenhaPdfRegraLookup | string | null,
    regras?: SenhaPdfRegraLookup[] | null
): number | null => {
    if (regra && typeof regra === 'object' && regra.digitos != null && Number(regra.digitos) > 0) {
        return Number(regra.digitos)
    }
    const code = typeof regra === 'string'
        ? regra
        : (regra?.value ?? null)
    if (!code) return null
    const fromLookup = regras?.find((r) => String(r.value) === String(code))
    if (fromLookup?.digitos != null && Number(fromLookup.digitos) > 0) {
        return Number(fromLookup.digitos)
    }
    const match = String(code).match(/(\d+)_digitos$/)
    if (match) return Number(match[1])
    return null
}

export interface CartoesList {
    id?: number
    nome?: string
    banco?: string
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
    /** Indica se há senha de PDF salva (API nunca devolve a senha em claro) */
    tem_senha_pdf?: boolean
    senha_pdf_regra?: string | null
    senha_pdf_orientacao?: string | null
    senha_pdf_regra_label?: string | null
    qtd_bandeiras?: number
    qtd_numeros?: number
    bandeiras?: CartaoBandeira[]
}

export interface CartoesView extends CartoesList {}

export interface CartoesModel {
    id?: number | null
    cartao_id?: number | null
    nome: string | null
    banco?: string | null
    dia_limite_fatura?: number | string | null
    dia_vencimento_fatura?: number | string | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
    /** Write-only: só enviar se o usuário digitou um valor novo */
    senha_pdf?: string | null
    senha_pdf_regra?: string | null
    /** No edit: true remove a senha salva (não enviar senha_pdf junto) */
    limpar_senha_pdf?: boolean
    /** Somente leitura (resposta da API) */
    tem_senha_pdf?: boolean
    senha_pdf_orientacao?: string | null
    senha_pdf_regra_label?: string | null
    bandeiras?: CartaoBandeira[]
    bandeiras_remover?: number[]
    numeros_remover?: number[]
}

export interface DiaLookup {
    value: number
    label: string
}

export interface ParCorLookup {
    chave?: string
    label?: string
    cor_fundo: string
    cor_texto: string
    padrao?: boolean
}

export interface PresetCorLookup {
    chave: string
    label: string
    aliases?: string[]
    cor_fundo: string
    cor_texto: string
}

export interface TipoNumeroLookup {
    value: string
    label: string
}

/** Item de `GET /cartoes/bandeiras-list` (formato select) */
export interface BandeiraListItem {
    value: number
    label: string
    limite_credito?: number | string | null
    qtd_numeros?: number
}

/** Item de `GET /cartoes/numeros-list` (formato select) */
export interface NumeroListItem {
    value: number
    label: string
    tipo?: string | null
    apelido?: string | null
    nome_no_cartao?: string | null
    ultimos_digitos?: string | null
    bandeira?: string | null
    cartao_bandeira_id?: number | null
    ativo?: boolean
}

/** Filtros de `GET /cartoes/numeros-list` */
export interface NumerosListParams {
    cartao_bandeira_id?: number | string
    cartao_id?: number | string
    fatura_id?: number | string
}

export interface LookupsCartoes {
    bandeiras?: string[]
    tipos_numero?: TipoNumeroLookup[]
    cores_fundo?: string[]
    cores_texto?: string[]
    pares_cores?: ParCorLookup[]
    presets_cores?: PresetCorLookup[]
    cor_padrao?: ParCorLookup
    dias?: DiaLookup[]
    senhas_pdf_regras?: SenhaPdfRegraLookup[]
}

export interface CartoesInterface {
    getViewCartoes(params: { id: number | string }): Promise<CartoesView | undefined>
    listCartoesPaginate(params: CartoesSearch): Promise<any>
    AsyncListCartoes(params: CartoesSearch): Promise<CartoesModel[] | undefined>
    AsyncListBandeiras(params: { cartao_id: number | string }): Promise<BandeiraListItem[] | undefined>
    AsyncListNumeros(params: NumerosListParams): Promise<NumeroListItem[] | undefined>
    createCartoes(params: CartoesModel): Promise<any>
    editCartoes(params: CartoesModel): Promise<any>
    /** Persiste `senha_pdf_regra` no cartão sem alterar a senha */
    atualizarSenhaPdfRegra(cartaoId: number, senhaPdfRegra: string): Promise<any>
    deleteCartoes(id: number): Promise<any>
    getLookupsCartoes(): Promise<LookupsCartoes | undefined>
}

export const CartoesDefaultValues: CartoesModel = {
    id: null,
    cartao_id: null,
    nome: null,
    banco: null,
    dia_limite_fatura: null,
    dia_vencimento_fatura: null,
    cor_fundo: '#e5e7eb',
    cor_texto: '#111827',
    ativo: true,
    senha_pdf: null,
    senha_pdf_regra: null,
    limpar_senha_pdf: false,
    tem_senha_pdf: false,
    bandeiras: [],
    bandeiras_remover: [],
    numeros_remover: [],
}

/** Sugere regra de senha PDF a partir do nome do banco (ex.: C6 → cpf_cnpj_6_digitos) */
export const findSenhaPdfRegraByBanco = (
    banco: string | null | undefined,
    regras: SenhaPdfRegraLookup[] | undefined
): SenhaPdfRegraLookup | undefined => {
    if (!banco?.trim() || !regras?.length) return undefined
    const normalized = banco.trim().toLowerCase().replace(/\s+/g, '')
    return regras.find((r) =>
        (r.bancos_sugeridos ?? []).some((b) => {
            const sug = b.trim().toLowerCase().replace(/\s+/g, '')
            return normalized.includes(sug) || sug.includes(normalized)
        })
    )
}

export const TIPOS_NUMERO_PADRAO: TipoNumeroLookup[] = [
    { value: 'fisico', label: 'Físico' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'adicional', label: 'Adicional' },
]

export const CARTAO_COR_PADRAO: ParCorLookup = {
    chave: 'padrao',
    label: 'Padrão',
    cor_fundo: '#e5e7eb',
    cor_texto: '#111827',
    padrao: true,
}

export const CARTAO_PRESETS_CORES_PADRAO: PresetCorLookup[] = [
    { chave: 'nubank', label: 'Nubank', aliases: ['nubank', 'nu bank', 'nu pagamentos', 'roxinho'], cor_fundo: '#820ad1', cor_texto: '#ffffff' },
    { chave: 'inter', label: 'Inter', aliases: ['inter', 'banco inter', 'inter medium'], cor_fundo: '#ff7a00', cor_texto: '#ffffff' },
    { chave: 'c6', label: 'C6 Bank', aliases: ['c6 bank', 'c6bank', 'c6'], cor_fundo: '#111111', cor_texto: '#ffffff' },
    { chave: 'sofisa', label: 'Sofisa', aliases: ['sofisa', 'banco sofisa'], cor_fundo: '#008f5a', cor_texto: '#ffffff' },
    { chave: 'itau', label: 'Itaú', aliases: ['itau', 'banco itau', 'itau unibanco'], cor_fundo: '#003b70', cor_texto: '#ffffff' },
    { chave: 'santander', label: 'Santander', aliases: ['santander'], cor_fundo: '#ec0000', cor_texto: '#ffffff' },
    { chave: 'bradesco', label: 'Bradesco', aliases: ['bradesco'], cor_fundo: '#cc092f', cor_texto: '#ffffff' },
    { chave: 'bb', label: 'Banco do Brasil', aliases: ['banco do brasil', 'banco brasil', 'bb'], cor_fundo: '#f8d117', cor_texto: '#003da5' },
    { chave: 'caixa', label: 'Caixa', aliases: ['caixa economica', 'caixa'], cor_fundo: '#005ca9', cor_texto: '#ffffff' },
    { chave: 'picpay', label: 'PicPay', aliases: ['picpay', 'pic pay'], cor_fundo: '#21c25e', cor_texto: '#000000' },
    { chave: 'mercadopago', label: 'Mercado Pago', aliases: ['mercado pago', 'mercadopago', 'mercado livre'], cor_fundo: '#009ee3', cor_texto: '#ffffff' },
    { chave: 'neon', label: 'Neon', aliases: ['neon'], cor_fundo: '#00e676', cor_texto: '#000000' },
    { chave: 'btg', label: 'BTG Pactual', aliases: ['btg pactual', 'pactual', 'btg'], cor_fundo: '#001e62', cor_texto: '#ffffff' },
    { chave: 'xp', label: 'XP', aliases: ['xp investimentos', 'xp'], cor_fundo: '#111111', cor_texto: '#ffffff' },
    { chave: 'pagbank', label: 'PagBank', aliases: ['pagbank', 'pag bank', 'pagseguro'], cor_fundo: '#ffb800', cor_texto: '#000000' },
    { chave: 'pan', label: 'PAN', aliases: ['banco pan', 'pan'], cor_fundo: '#00aeef', cor_texto: '#ffffff' },
    { chave: 'will', label: 'Will Bank', aliases: ['will bank', 'willbank', 'will'], cor_fundo: '#6c2bd9', cor_texto: '#ffffff' },
    { chave: 'original', label: 'Original', aliases: ['banco original', 'original'], cor_fundo: '#00a859', cor_texto: '#ffffff' },
    { chave: 'next', label: 'Next', aliases: ['next bradesco', 'next'], cor_fundo: '#00a859', cor_texto: '#ffffff' },
    { chave: 'amazon', label: 'Amazon Card', aliases: ['amazon card', 'amazon'], cor_fundo: '#146eb4', cor_texto: '#ffffff' },
    { chave: 'samsclub', label: "Sam's Club", aliases: ['sams club', "sam's club", 'samsclub'], cor_fundo: '#0067a0', cor_texto: '#ffffff' },
    { chave: 'paodeacucar', label: 'Pão de Açúcar', aliases: ['pao de acucar', 'pao de açucar'], cor_fundo: '#00843d', cor_texto: '#ffffff' },
    { chave: 'carrefour', label: 'Carrefour', aliases: ['carrefour'], cor_fundo: '#004b93', cor_texto: '#ffffff' },
    { chave: 'magalu', label: 'Magalu', aliases: ['magazine luiza', 'magalu'], cor_fundo: '#0086ff', cor_texto: '#ffffff' },
    { chave: 'renner', label: 'Renner', aliases: ['cartao renner', 'renner', 'realize'], cor_fundo: '#d71920', cor_texto: '#ffffff' },
    { chave: 'riachuelo', label: 'Riachuelo', aliases: ['riachuelo', 'midway'], cor_fundo: '#e30613', cor_texto: '#ffffff' },
    { chave: 'americanas', label: 'Americanas', aliases: ['americanas'], cor_fundo: '#e60012', cor_texto: '#ffffff' },
    { chave: 'shopee', label: 'Shopee', aliases: ['shopee'], cor_fundo: '#ee4d2d', cor_texto: '#ffffff' },
]

export const CARTAO_PARES_CORES_PADRAO: ParCorLookup[] = [
    CARTAO_COR_PADRAO,
    ...CARTAO_PRESETS_CORES_PADRAO.map((preset) => ({
        chave: preset.chave,
        label: preset.label,
        cor_fundo: preset.cor_fundo,
        cor_texto: preset.cor_texto,
        padrao: false,
    })),
]

export const CARTAO_CORES_FUNDO_PADRAO = Array.from(
    new Set(CARTAO_PARES_CORES_PADRAO.map((par) => par.cor_fundo))
)

export const CARTAO_CORES_TEXTO_PADRAO = Array.from(
    new Set(CARTAO_PARES_CORES_PADRAO.map((par) => par.cor_texto))
)

const normalizeCorBusca = (value?: string | null): string =>
    String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

export const normalizeHexCor = (value?: string | null): string =>
    String(value ?? '').trim().toLowerCase()

/** Encontra o preset cujo alias/label casa com nome ou banco (alias mais longo vence). */
export const matchPresetCorCartao = (
    nome?: string | null,
    banco?: string | null,
    presets: PresetCorLookup[] = CARTAO_PRESETS_CORES_PADRAO,
    fallback: ParCorLookup = CARTAO_COR_PADRAO
): ParCorLookup => {
    const haystack = normalizeCorBusca(`${nome ?? ''} ${banco ?? ''}`)
    if (!haystack) return fallback

    const words = haystack.split(/[^a-z0-9]+/).filter(Boolean)
    let best: PresetCorLookup | null = null
    let bestLen = -1

    for (const preset of presets) {
        const aliases = [preset.label, preset.chave, ...(preset.aliases ?? [])]
        for (const alias of aliases) {
            const normalized = normalizeCorBusca(alias)
            if (!normalized) continue
            const compact = normalized.replace(/\s+/g, '')
            const isShort = compact.length <= 3
            const matched = isShort
                ? words.includes(compact) || words.includes(normalized)
                : haystack.includes(normalized)
            if (matched && compact.length > bestLen) {
                best = preset
                bestLen = compact.length
            }
        }
    }

    if (!best) return fallback
    const matchedPreset = best
    return {
        chave: matchedPreset.chave,
        label: matchedPreset.label,
        cor_fundo: matchedPreset.cor_fundo,
        cor_texto: matchedPreset.cor_texto,
        padrao: false,
    }
}

export const buildDiasOptions = (): DiaLookup[] =>
    Array.from({ length: 31 }, (_, i) => {
        const value = i + 1
        return { value, label: String(value).padStart(2, '0') }
    })
