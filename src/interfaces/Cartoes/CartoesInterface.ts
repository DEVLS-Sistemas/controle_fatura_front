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
    apelido?: string | null
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

export interface CartoesList {
    id?: number
    nome?: string
    banco?: string
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
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
    bandeiras?: CartaoBandeira[]
    bandeiras_remover?: number[]
    numeros_remover?: number[]
}

export interface DiaLookup {
    value: number
    label: string
}

export interface ParCorLookup {
    cor_fundo: string
    cor_texto: string
    label?: string
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
    dias?: DiaLookup[]
}

export interface CartoesInterface {
    getViewCartoes(params: { id: number | string }): Promise<CartoesView | undefined>
    listCartoesPaginate(params: CartoesSearch): Promise<any>
    AsyncListCartoes(params: CartoesSearch): Promise<CartoesModel[] | undefined>
    AsyncListBandeiras(params: { cartao_id: number | string }): Promise<BandeiraListItem[] | undefined>
    AsyncListNumeros(params: NumerosListParams): Promise<NumeroListItem[] | undefined>
    createCartoes(params: CartoesModel): Promise<any>
    editCartoes(params: CartoesModel): Promise<any>
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
    cor_fundo: null,
    cor_texto: null,
    ativo: true,
    bandeiras: [],
    bandeiras_remover: [],
    numeros_remover: [],
}

export const TIPOS_NUMERO_PADRAO: TipoNumeroLookup[] = [
    { value: 'fisico', label: 'Físico' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'adicional', label: 'Adicional' },
]

export const CARTAO_CORES_FUNDO_PADRAO = [
    '#ef4444',
    '#f59e0b',
    '#22c55e',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#6b7280',
    '#14b8a6',
]

export const CARTAO_CORES_TEXTO_PADRAO = [
    '#ffffff',
    '#f8fafc',
    '#0f172a',
    '#111827',
]

export const CARTAO_PARES_CORES_PADRAO: ParCorLookup[] = [
    { cor_fundo: '#8b5cf6', cor_texto: '#ffffff', label: 'Roxo' },
    { cor_fundo: '#22c55e', cor_texto: '#052e16', label: 'Verde' },
    { cor_fundo: '#3b82f6', cor_texto: '#ffffff', label: 'Azul' },
    { cor_fundo: '#ef4444', cor_texto: '#ffffff', label: 'Vermelho' },
    { cor_fundo: '#f59e0b', cor_texto: '#111827', label: 'Âmbar' },
    { cor_fundo: '#ec4899', cor_texto: '#ffffff', label: 'Rosa' },
    { cor_fundo: '#6b7280', cor_texto: '#ffffff', label: 'Cinza' },
    { cor_fundo: '#14b8a6', cor_texto: '#042f2e', label: 'Teal' },
]

export const buildDiasOptions = (): DiaLookup[] =>
    Array.from({ length: 31 }, (_, i) => {
        const value = i + 1
        return { value, label: String(value).padStart(2, '0') }
    })
