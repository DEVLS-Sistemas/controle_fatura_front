export interface EstabelecimentosSearch {
    id?: string | null
    estabelecimento_id?: string | null
    nome?: string | null
    ativo?: string | boolean | null
    categoria_padrao_id?: string | number | null
    palavra_chave?: string | null | unknown
}

export interface EstabelecimentosList {
    id?: number
    nome?: string
    categoria_padrao_id?: number | null
    categoria_padrao_nome?: string | null
    subcategoria_padrao_id?: number | null
    subcategoria_padrao_nome?: string | null
    ativo?: boolean
}

export interface EstabelecimentosView extends EstabelecimentosList {}

export interface EstabelecimentosModel {
    id?: number | null
    estabelecimento_id?: number | null
    nome: string | null
    categoria_padrao_id?: number | string | null
    subcategoria_padrao_id?: number | string | null
    ativo?: boolean
}

export interface EstabelecimentoLookup {
    id?: number
    nome?: string
    categoria_padrao_id?: number | null
    subcategoria_padrao_id?: number | null
}

export interface LookupsEstabelecimentos {
    categorias?: { id?: number; nome?: string }[]
}

/** Resposta de `DELETE /estabelecimentos/excluir-todos` */
export interface ExcluirTodosEstabelecimentosData {
    estabelecimentos_excluidos: number
    categorias_excluidas: number
    subcategorias_excluidas: number
}

export interface ExcluirTodosEstabelecimentosResponse {
    estabelecimento?: {
        data?: ExcluirTodosEstabelecimentosData
        status?: boolean
        message?: string
    }
}

export interface EstabelecimentosInterface {
    getViewEstabelecimentos(params: { id: number | string }): Promise<EstabelecimentosView | undefined>
    listEstabelecimentosPaginate(params: EstabelecimentosSearch): Promise<any>
    AsyncListEstabelecimentos(params: EstabelecimentosSearch): Promise<EstabelecimentoLookup[] | undefined>
    createEstabelecimentos(params: EstabelecimentosModel): Promise<any>
    editEstabelecimentos(params: EstabelecimentosModel): Promise<any>
    deleteEstabelecimentos(id: number): Promise<any>
    deleteAllEstabelecimentos(): Promise<ExcluirTodosEstabelecimentosResponse>
    getLookupsEstabelecimentos(): Promise<LookupsEstabelecimentos | undefined>
}

export const EstabelecimentosDefaultValues: EstabelecimentosModel = {
    id: null,
    estabelecimento_id: null,
    nome: null,
    categoria_padrao_id: null,
    subcategoria_padrao_id: null,
    ativo: true,
}
