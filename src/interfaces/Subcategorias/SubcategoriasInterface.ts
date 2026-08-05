export interface SubcategoriasSearch {
    id?: string | null
    subcategoria_id?: string | null
    nome?: string | null
    ativo?: string | boolean | null
    categoria_id?: string | number | null
    palavra_chave?: string | null | unknown
}

export interface SubcategoriasList {
    id?: number
    nome?: string
    ativo?: boolean
    categorias?: { id?: number; nome?: string }[]
    categoria_ids?: number[]
    categorias_nomes?: string
}

export interface SubcategoriasView extends SubcategoriasList {}

export interface SubcategoriasModel {
    id?: number | null
    subcategoria_id?: number | null
    nome: string | null
    categoria_ids: (number | string)[] | null
    ativo?: boolean
}

export interface SubcategoriaLookup {
    id?: number
    nome?: string
    categoria_id?: number | null
}

export interface LookupsSubcategorias {
    categorias?: { id?: number; nome?: string }[]
}

export interface SubcategoriaRapidoPayload {
    nome: string
    categoria_id: number
    categoria_ids?: number[]
}

export interface SubcategoriaRapidoData {
    id: number
    nome: string
    ativo?: boolean
    categorias?: { id?: number; nome?: string; cor?: string }[]
    categoria_ids?: number[]
}

export interface SubcategoriaRapidoResult {
    data: SubcategoriaRapidoData
    status: boolean
    criado: boolean
    message: string
}

export interface SubcategoriasInterface {
    getViewSubcategorias(params: { id: number | string }): Promise<SubcategoriasView | undefined>
    listSubcategoriasPaginate(params: SubcategoriasSearch): Promise<any>
    AsyncListSubcategorias(params: SubcategoriasSearch): Promise<SubcategoriaLookup[] | undefined>
    createSubcategorias(params: SubcategoriasModel): Promise<any>
    createSubcategoriasRapido(params: SubcategoriaRapidoPayload): Promise<SubcategoriaRapidoResult>
    editSubcategorias(params: SubcategoriasModel): Promise<any>
    deleteSubcategorias(id: number): Promise<any>
    getLookupsSubcategorias(): Promise<LookupsSubcategorias | undefined>
}

export const SubcategoriasDefaultValues: SubcategoriasModel = {
    id: null,
    subcategoria_id: null,
    nome: null,
    categoria_ids: [],
    ativo: true,
}
