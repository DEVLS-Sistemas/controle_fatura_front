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
    ativo?: boolean
}

export interface LookupsCartoes {}

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
    ativo: true,
}
