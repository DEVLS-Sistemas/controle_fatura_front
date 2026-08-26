export interface CartoesSearch {
    id?: string | null
    cartao_id?: string | null
    nome?: string | null
    bandeira?: string | null
    banco?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
    pessoa_id?: number | string | null
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
    cor_principal?: string | null
    cor_secundaria?: string | null
    bandeira_chave?: string | null
    bandeira_padrao?: boolean
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

/** Parser de fatura (PDF/CSV) testado com arquivo real */
export interface ParserHomologado {
    chave: string
    label: string
    nota?: string | null
}

export interface CartoesList {
    id?: number
    nome?: string
    banco?: string
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    /** true = leitura de PDF/CSV testada para este banco */
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    ativo?: boolean
    /** Indica se há senha de PDF salva (API nunca devolve a senha em claro) */
    tem_senha_pdf?: boolean
    senha_pdf_regra?: string | null
    senha_pdf_orientacao?: string | null
    senha_pdf_regra_label?: string | null
    qtd_bandeiras?: number
    qtd_numeros?: number
    pessoa_id?: number | null
    pessoa_nome?: string | null
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
    pessoa_id?: number | string | null
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
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
}

export interface PresetCorLookup {
    chave: string
    label: string
    aliases?: string[]
    cor_fundo: string
    cor_texto: string
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
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
    cor_principal?: string | null
    cor_secundaria?: string | null
    bandeira_chave?: string | null
    bandeira_padrao?: boolean
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

export interface ParCorBandeiraLookup {
    chave?: string
    label?: string
    cor_principal: string
    cor_secundaria: string
    padrao?: boolean
}

export interface PresetBandeiraLookup {
    chave: string
    label: string
    aliases?: string[]
    cor_principal: string
    cor_secundaria: string
}

export interface LookupsCartoes {
    bandeiras?: string[]
    tipos_numero?: TipoNumeroLookup[]
    cores_fundo?: string[]
    cores_texto?: string[]
    pares_cores?: ParCorLookup[]
    presets_cores?: PresetCorLookup[]
    cor_padrao?: ParCorLookup
    presets_bandeiras?: PresetBandeiraLookup[]
    pares_cores_bandeiras?: ParCorBandeiraLookup[]
    cor_padrao_bandeira?: ParCorBandeiraLookup
    dias?: DiaLookup[]
    senhas_pdf_regras?: SenhaPdfRegraLookup[]
    parsers_homologados?: ParserHomologado[]
}

export interface CartaoRapidoPayload {
    nome?: string
    bandeira: string
    ultimos_digitos: string
    dia_limite_fatura?: number
    dia_vencimento_fatura?: number
    cartao_id?: number
    tipo?: TipoNumeroCartao | string
    apelido?: string
    nome_no_cartao?: string
}

export interface CartaoRapidoNumero {
    id: number
    ultimos_digitos?: string | null
    tipo?: string | null
}

export interface CartaoRapidoBandeira {
    id?: number
    bandeira?: string | null
    numeros?: CartaoRapidoNumero[]
}

export interface CartaoRapidoData {
    id: number
    cartao_id?: number
    cartao_numero_id?: number | null
    nome: string
    banco?: string | null
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    pessoa_id?: number | null
    pessoa_nome?: string | null
    bandeiras?: CartaoRapidoBandeira[]
}

export interface CartaoRapidoResult {
    data: CartaoRapidoData
    status: boolean
    criado: boolean
    message: string
}

export interface CartoesInterface {
    getViewCartoes(params: { id: number | string }): Promise<CartoesView | undefined>
    listCartoesPaginate(params: CartoesSearch): Promise<any>
    AsyncListCartoes(params: CartoesSearch): Promise<CartoesModel[] | undefined>
    AsyncListBandeiras(params: { cartao_id: number | string }): Promise<BandeiraListItem[] | undefined>
    AsyncListNumeros(params: NumerosListParams): Promise<NumeroListItem[] | undefined>
    createCartoes(params: CartoesModel): Promise<any>
    createCartoesRapido(params: CartaoRapidoPayload): Promise<CartaoRapidoResult>
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
    pessoa_id: null,
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

export const PARSERS_HOMOLOGADOS_PADRAO: ParserHomologado[] = [
    { chave: 'nubank', label: 'Nubank', nota: null },
    { chave: 'inter', label: 'Inter', nota: null },
    { chave: 'c6', label: 'C6 Bank', nota: null },
    { chave: 'sofisa', label: 'Sofisa', nota: null },
    { chave: 'picpay', label: 'PicPay', nota: null },
    { chave: 'itau', label: 'Itaú', nota: 'Homologado com fatura Itaú Click' },
]

const parserHomologadoPadrao = (chave: string): ParserHomologado | null =>
    PARSERS_HOMOLOGADOS_PADRAO.find((p) => p.chave === chave) ?? null

export const CARTAO_PRESETS_CORES_PADRAO: PresetCorLookup[] = [
    { chave: 'nubank', label: 'Nubank', aliases: ['nubank', 'nu bank', 'nu pagamentos', 'roxinho'], cor_fundo: '#820ad1', cor_texto: '#ffffff', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('nubank') },
    { chave: 'inter', label: 'Inter', aliases: ['inter', 'banco inter', 'inter medium'], cor_fundo: '#ff7a00', cor_texto: '#ffffff', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('inter') },
    { chave: 'c6', label: 'C6 Bank', aliases: ['c6 bank', 'c6bank', 'c6'], cor_fundo: '#111111', cor_texto: '#ffffff', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('c6') },
    { chave: 'sofisa', label: 'Sofisa', aliases: ['sofisa', 'banco sofisa'], cor_fundo: '#008f5a', cor_texto: '#ffffff', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('sofisa') },
    { chave: 'itau', label: 'Itaú', aliases: ['itau', 'banco itau', 'itau unibanco'], cor_fundo: '#003b70', cor_texto: '#ffffff', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('itau') },
    { chave: 'santander', label: 'Santander', aliases: ['santander'], cor_fundo: '#ec0000', cor_texto: '#ffffff' },
    { chave: 'bradesco', label: 'Bradesco', aliases: ['bradesco'], cor_fundo: '#cc092f', cor_texto: '#ffffff' },
    { chave: 'bb', label: 'Banco do Brasil', aliases: ['banco do brasil', 'banco brasil', 'bb'], cor_fundo: '#f8d117', cor_texto: '#003da5' },
    { chave: 'caixa', label: 'Caixa', aliases: ['caixa economica', 'caixa'], cor_fundo: '#005ca9', cor_texto: '#ffffff' },
    { chave: 'picpay', label: 'PicPay', aliases: ['picpay', 'pic pay'], cor_fundo: '#21c25e', cor_texto: '#000000', importacao_pdf_homologada: true, parser_homologado: parserHomologadoPadrao('picpay') },
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
        importacao_pdf_homologada: preset.importacao_pdf_homologada === true,
        parser_homologado: preset.parser_homologado ?? null,
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
        importacao_pdf_homologada: matchedPreset.importacao_pdf_homologada === true,
        parser_homologado: matchedPreset.parser_homologado ?? null,
    }
}

export const BANDEIRA_COR_PADRAO: ParCorBandeiraLookup = {
    chave: 'outra',
    label: 'Outra',
    cor_principal: '#e5e7eb',
    cor_secundaria: '#9ca3af',
    padrao: true,
}

export const BANDEIRAS_SELECT_PADRAO = [
    'Visa',
    'Mastercard',
    'Elo',
    'American Express',
    'Hipercard',
    'Diners Club',
    'Discover',
    'JCB',
    'UnionPay',
    'Maestro',
    'Banricompras',
    'Aura',
    'Cabal',
    'Sorocred',
    'Outra',
]

export const BANDEIRA_PRESETS_CORES_PADRAO: PresetBandeiraLookup[] = [
    { chave: 'visa', label: 'Visa', aliases: ['visa'], cor_principal: '#1a1f71', cor_secundaria: '#f7b600' },
    { chave: 'mastercard', label: 'Mastercard', aliases: ['mastercard', 'master card', 'master'], cor_principal: '#eb001b', cor_secundaria: '#ff5f00' },
    { chave: 'elo', label: 'Elo', aliases: ['elo'], cor_principal: '#000000', cor_secundaria: '#ffcb05' },
    { chave: 'amex', label: 'American Express', aliases: ['american express', 'amex'], cor_principal: '#006fcf', cor_secundaria: '#ffffff' },
    { chave: 'hipercard', label: 'Hipercard', aliases: ['hipercard', 'hiper card', 'hiper'], cor_principal: '#e31837', cor_secundaria: '#ffffff' },
    { chave: 'diners', label: 'Diners Club', aliases: ['diners club', 'diners'], cor_principal: '#0079be', cor_secundaria: '#ffffff' },
    { chave: 'discover', label: 'Discover', aliases: ['discover'], cor_principal: '#ff6000', cor_secundaria: '#000000' },
    { chave: 'jcb', label: 'JCB', aliases: ['jcb'], cor_principal: '#00a94f', cor_secundaria: '#e31837' },
    { chave: 'unionpay', label: 'UnionPay', aliases: ['unionpay', 'union pay'], cor_principal: '#d50000', cor_secundaria: '#004a99' },
    { chave: 'maestro', label: 'Maestro', aliases: ['maestro'], cor_principal: '#ed1c24', cor_secundaria: '#0099df' },
    { chave: 'banricompras', label: 'Banricompras', aliases: ['banricompras', 'banri compras'], cor_principal: '#0054a6', cor_secundaria: '#e31b23' },
    { chave: 'aura', label: 'Aura', aliases: ['aura'], cor_principal: '#0066b3', cor_secundaria: '#ffffff' },
    { chave: 'cabal', label: 'Cabal', aliases: ['cabal'], cor_principal: '#0066a1', cor_secundaria: '#e21e2b' },
    { chave: 'sorocred', label: 'Sorocred', aliases: ['sorocred'], cor_principal: '#0057a8', cor_secundaria: '#e30613' },
    { chave: 'outra', label: 'Outra', aliases: ['outra', 'other'], cor_principal: '#e5e7eb', cor_secundaria: '#9ca3af' },
]

export const BANDEIRA_PARES_CORES_PADRAO: ParCorBandeiraLookup[] = [
    ...BANDEIRA_PRESETS_CORES_PADRAO.filter((preset) => preset.chave !== 'outra').map((preset) => ({
        chave: preset.chave,
        label: preset.label,
        cor_principal: preset.cor_principal,
        cor_secundaria: preset.cor_secundaria,
        padrao: false,
    })),
    BANDEIRA_COR_PADRAO,
]

export const isAmexLegadoLabel = (label?: string | null): boolean =>
    /^amex$/i.test(String(label ?? '').trim())

export const bandeirasSelectLabels = (labels?: string[] | null): string[] => {
    const source = labels?.length ? labels : BANDEIRAS_SELECT_PADRAO
    return source.filter((label) => !isAmexLegadoLabel(label))
}

export const matchPresetCorBandeira = (
    nome?: string | null,
    presets: PresetBandeiraLookup[] = BANDEIRA_PRESETS_CORES_PADRAO,
    fallback: ParCorBandeiraLookup = BANDEIRA_COR_PADRAO
): ParCorBandeiraLookup => {
    const haystack = normalizeCorBusca(nome)
    if (!haystack) return fallback

    const words = haystack.split(/[^a-z0-9]+/).filter(Boolean)
    let best: PresetBandeiraLookup | null = null
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
        cor_principal: matchedPreset.cor_principal,
        cor_secundaria: matchedPreset.cor_secundaria,
        padrao: matchedPreset.chave === 'outra',
    }
}

export const buildDiasOptions = (): DiaLookup[] =>
    Array.from({ length: 31 }, (_, i) => {
        const value = i + 1
        return { value, label: String(value).padStart(2, '0') }
    })
