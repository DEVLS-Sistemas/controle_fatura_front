export interface ResponsaveisSearch {
    id?: string | null
    responsavel_id?: string | null
    nome?: string | null
    tipo?: 'pessoal' | 'empresa' | string | null
    ativo?: boolean | null
    palavra_chave?: string | null | unknown
}

export interface ResponsaveisList {
    id?: number
    responsavel_id?: number
    nome?: string
    tipo?: string
    ativo?: boolean
}

export interface ResponsaveisView extends ResponsaveisList {}

export interface ResponsaveisModel {
    id?: number | null
    responsavel_id?: number | null
    nome: string | null
    tipo: 'pessoal' | 'empresa' | string | null
    ativo?: boolean
}

export interface LookupsResponsaveis {}

export interface ResponsaveisInterface {
    getViewResponsaveis(params: any): Promise<ResponsaveisView | undefined>
    listResponsaveisPaginate(params: ResponsaveisSearch): Promise<any>
    AsyncListResponsaveis(params: ResponsaveisSearch): Promise<ResponsaveisModel[] | undefined>
    createResponsaveis(params: ResponsaveisModel): Promise<any>
    editResponsaveis(params: ResponsaveisModel): Promise<any>
    deleteResponsaveis(id: number): Promise<any>
}

export const ResponsaveisDefaultValues: ResponsaveisModel = {
    id: null,
    responsavel_id: null,
    nome: null,
    tipo: 'pessoal',
    ativo: true,
}
