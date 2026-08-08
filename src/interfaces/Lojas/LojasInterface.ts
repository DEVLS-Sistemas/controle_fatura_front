export interface LojasSearch {
    id?: string | null
    loja_id?: string | null
    nome?: string | null
    ativo?: string | boolean | null
    palavra_chave?: string | null | unknown
}

export interface LojaEstabelecimentoVinculo {
    id?: number
    nome?: string
    ativo?: boolean
}

export interface LojasList {
    id?: number
    nome?: string
    ativo?: boolean
    estabelecimentos_count?: number
}

export interface LojasView extends LojasList {
    estabelecimentos?: LojaEstabelecimentoVinculo[]
}

export interface LojasModel {
    id?: number | null
    loja_id?: number | null
    nome: string | null
    ativo?: boolean
}

export interface LojaLookup {
    id?: number
    nome?: string
}

export interface LojaRapidoPayload {
    nome: string
    estabelecimento_id?: number | null
}

export interface LojaRapidoData {
    id: number
    nome: string
    ativo?: boolean
    estabelecimentos_count?: number
    estabelecimentos?: LojaEstabelecimentoVinculo[]
}

export interface LojaRapidoResult {
    data: LojaRapidoData
    status: boolean
    criado: boolean
    message: string
}

export interface LojasInterface {
    getViewLojas(params: { id: number | string }): Promise<LojasView | undefined>
    listLojasPaginate(params: LojasSearch): Promise<any>
    AsyncListLojas(params: LojasSearch): Promise<LojaLookup[] | undefined>
    createLojas(params: LojasModel): Promise<any>
    createLojasRapido(params: LojaRapidoPayload): Promise<LojaRapidoResult>
    editLojas(params: LojasModel): Promise<any>
    deleteLojas(id: number): Promise<any>
}

export const LojasDefaultValues: LojasModel = {
    id: null,
    loja_id: null,
    nome: null,
    ativo: true,
}
