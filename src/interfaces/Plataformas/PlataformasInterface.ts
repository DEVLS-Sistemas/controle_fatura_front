import { CategoriaTemaLookup } from 'interfaces/Categorias/CategoriasInterface'

export interface PlataformasSearch {
    id?: string | null
    plataforma_id?: string | null
    nome?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
}

export interface PlataformasList {
    id?: number
    nome?: string
    cor?: string
    ativo?: boolean
}

export interface PlataformasView extends PlataformasList {}

export interface PlataformasModel {
    id?: number | null
    plataforma_id?: number | null
    nome: string | null
    cor?: string | null
    ativo?: boolean
}

export interface LookupsPlataformas {
    cores?: string[]
    cor_padrao?: string
    temas?: CategoriaTemaLookup[]
}

export interface PlataformaRapidoPayload {
    nome: string
    cor?: string | null
}

export interface PlataformaRapidoData {
    id: number
    nome: string
    cor?: string | null
    ativo?: boolean
}

export interface PlataformaRapidoResult {
    data: PlataformaRapidoData
    status: boolean
    criado: boolean
    message: string
}

export interface PlataformaLookup {
    id?: number
    nome?: string
    cor?: string | null
}

export interface PlataformasInterface {
    getViewPlataformas(params: { id: number | string }): Promise<PlataformasView | undefined>
    listPlataformasPaginate(params: PlataformasSearch): Promise<any>
    AsyncListPlataformas(params: PlataformasSearch): Promise<PlataformasModel[] | undefined>
    createPlataformas(params: PlataformasModel): Promise<any>
    createPlataformasRapido(params: PlataformaRapidoPayload): Promise<PlataformaRapidoResult>
    editPlataformas(params: PlataformasModel): Promise<any>
    deletePlataformas(id: number): Promise<any>
    getLookupsPlataformas(): Promise<LookupsPlataformas | undefined>
}

export const PlataformasDefaultValues: PlataformasModel = {
    id: null,
    plataforma_id: null,
    nome: null,
    cor: '#000000',
    ativo: true,
}
