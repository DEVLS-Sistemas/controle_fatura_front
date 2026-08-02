export interface CartoesSearch {
    id?: string | null
    cartao_id?: string | null
    nome?: string | null
    bandeira?: string | null
    banco?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
}

export interface CartoesList {
    id?: number
    nome?: string
    bandeira?: string
    banco?: string
    ultimos_digitos?: string
    limite_credito?: number | string | null
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
}

export interface CartoesView extends CartoesList {}

export interface CartoesModel {
    id?: number | null
    cartao_id?: number | null
    nome: string | null
    bandeira?: string | null
    banco?: string | null
    ultimos_digitos?: string | null
    /** Dígitos-centavos no form (máscara preco); string BR no payload da API */
    limite_credito?: number | string | null
    dia_limite_fatura?: number | string | null
    dia_vencimento_fatura?: number | string | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
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

export interface LookupsCartoes {
    bandeiras?: string[]
    cores_fundo?: string[]
    cores_texto?: string[]
    pares_cores?: ParCorLookup[]
    dias?: DiaLookup[]
}

export interface CartoesInterface {
    getViewCartoes(params: { id: number | string }): Promise<CartoesView | undefined>
    listCartoesPaginate(params: CartoesSearch): Promise<any>
    AsyncListCartoes(params: CartoesSearch): Promise<CartoesModel[] | undefined>
    createCartoes(params: CartoesModel): Promise<any>
    editCartoes(params: CartoesModel): Promise<any>
    deleteCartoes(id: number): Promise<any>
    getLookupsCartoes(): Promise<LookupsCartoes | undefined>
}

export const CartoesDefaultValues: CartoesModel = {
    id: null,
    cartao_id: null,
    nome: null,
    bandeira: null,
    banco: null,
    ultimos_digitos: null,
    limite_credito: null,
    dia_limite_fatura: null,
    dia_vencimento_fatura: null,
    cor_fundo: null,
    cor_texto: null,
    ativo: true,
}

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
