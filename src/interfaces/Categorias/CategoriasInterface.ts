export interface CategoriasSearch {
    id?: string | null
    categoria_id?: string | null
    nome?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
}

export interface CategoriasList {
    id?: number
    nome?: string
    cor?: string
    ativo?: boolean
}

export interface CategoriasView extends CategoriasList {}

export interface CategoriasModel {
    id?: number | null
    categoria_id?: number | null
    nome: string | null
    cor?: string | null
    ativo?: boolean
}

export interface CategoriaTemaLookup {
    chave?: string
    label?: string
    hex: string
    padrao?: boolean
    variacoes?: string[]
}

export interface LookupsCategorias {
    cores?: string[]
    cor_padrao?: string
    temas?: CategoriaTemaLookup[]
}

export interface CategoriaRapidoPayload {
    nome: string
    cor?: string | null
}

export interface CategoriaRapidoData {
    id: number
    nome: string
    cor?: string | null
    ativo?: boolean
}

export interface CategoriaRapidoResult {
    data: CategoriaRapidoData
    status: boolean
    criado: boolean
    message: string
}

export interface CategoriasInterface {
    getViewCategorias(params: { id: number | string }): Promise<CategoriasView | undefined>
    listCategoriasPaginate(params: CategoriasSearch): Promise<any>
    AsyncListCategorias(params: CategoriasSearch): Promise<CategoriasModel[] | undefined>
    createCategorias(params: CategoriasModel): Promise<any>
    createCategoriasRapido(params: CategoriaRapidoPayload): Promise<CategoriaRapidoResult>
    editCategorias(params: CategoriasModel): Promise<any>
    deleteCategorias(id: number): Promise<any>
    getLookupsCategorias(): Promise<LookupsCategorias | undefined>
}

export const CategoriasDefaultValues: CategoriasModel = {
    id: null,
    categoria_id: null,
    nome: null,
    cor: '#000000',
    ativo: true,
}
