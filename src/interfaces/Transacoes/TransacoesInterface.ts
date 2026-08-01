export interface TransacoesSearch {
    id?: string | null
    transacao_id?: string | null
    data_inicio?: string | null
    data_fim?: string | null
    cartao_id?: string | number | null
    categoria_id?: string | number | null
    subcategoria_id?: string | number | null
    estabelecimento_id?: string | number | null
    responsavel_id?: string | number | null
    fatura_id?: string | number | null
    tipo?: string | null
    mes?: string | number | null
    ano?: string | number | null
    palavra_chave?: string | null | unknown
}

export interface TransacoesList {
    id?: number
    fatura_id?: number
    data?: string
    estabelecimento?: string
    estabelecimento_id?: number | null
    estabelecimento_nome?: string
    valor?: number
    valor_compra?: number | string | null
    parcelas_total?: number
    parcela_atual?: number
    compra_grupo_id?: string | number | null
    tipo?: string
    categoria_id?: number | null
    categoria_nome?: string
    categoria_cor?: string
    subcategoria_id?: number | null
    subcategoria_nome?: string
    responsavel_id?: number | null
    responsavel_nome?: string
    responsavel_tipo?: string
    cartao_id?: number
    cartao_nome?: string
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
    fatura_mes?: number
    fatura_ano?: number
    observacoes?: string
}

export interface TransacoesView extends TransacoesList {}

export interface ParcelaValor {
    parcela: number
    valor: string
}

export interface TransacoesModel {
    id?: number | null
    transacao_id?: number | null
    cartao_id: number | string | null
    fatura_id?: number | string | null
    data?: string | null
    estabelecimento_id?: number | string | null
    /** @deprecated use estabelecimento_id — ainda aceito no create (find-or-create) */
    estabelecimento?: string | null
    /** Valor da linha (edit / listagem). No create use valor_compra. */
    valor?: number | string | null
    /** Total da venda — enviado no create (formato BR: "150,90") */
    valor_compra?: number | string | null
    parcelas_total?: number | string | null
    /** Somente leitura / edit — não enviar no create */
    parcela_atual?: number | string | null
    valor_parcela?: number | string | null
    /** Valores por parcela quando parcelas_total > 1 */
    parcelas?: ParcelaValor[]
    compra_grupo_id?: string | number | null
    /** No edit, propaga campos compartilhados para o grupo */
    propagar_grupo?: boolean
    tipo?: string | null
    categoria_id?: number | string | null
    subcategoria_id?: number | string | null
    responsavel_id?: number | string | null
    observacoes?: string | null
}

export interface CategoriaLookup {
    id?: number
    nome?: string
    cor?: string
}

export interface SubcategoriaLookup {
    id?: number
    nome?: string
    categoria_id?: number | null
}

export interface EstabelecimentoLookup {
    id?: number
    nome?: string
    categoria_padrao_id?: number | null
    subcategoria_padrao_id?: number | null
}

export interface ResponsavelLookup {
    id?: number
    nome?: string
    tipo?: string
}

export interface CartaoLookup {
    id?: number
    nome?: string
    cor_fundo?: string | null
    cor_texto?: string | null
}

export interface FaturaLookup {
    id?: number
    mes?: number
    ano?: number
    cartao_nome?: string
}

export interface TipoLookup {
    value?: string
    label?: string
}

export interface LookupsTransacoes {
    tipos?: TipoLookup[]
    categorias?: CategoriaLookup[]
    subcategorias?: SubcategoriaLookup[]
    responsaveis?: ResponsavelLookup[]
    faturas?: FaturaLookup[]
    cartoes?: CartaoLookup[]
    default_responsavel_id?: number | null
}

export interface TransacoesInterface {
    getViewTransacoes(params: { id: number | string }): Promise<TransacoesView | undefined>
    listTransacoesPaginate(params: TransacoesSearch): Promise<any>
    AsyncListTransacoes(params: TransacoesSearch): Promise<TransacoesModel[] | undefined>
    createTransacoes(params: TransacoesModel): Promise<any>
    editTransacoes(params: TransacoesModel): Promise<any>
    deleteTransacoes(id: number, options?: { excluir_grupo?: boolean }): Promise<any>
    getLookupsTransacoes(): Promise<LookupsTransacoes | undefined>
    exportCsv(params: TransacoesSearch): Promise<Blob>
}

export const TransacoesDefaultValues: TransacoesModel = {
    id: null,
    transacao_id: null,
    cartao_id: null,
    fatura_id: null,
    data: null,
    estabelecimento_id: null,
    estabelecimento: null,
    valor: null,
    valor_compra: null,
    parcelas_total: 1,
    parcela_atual: null,
    parcelas: undefined,
    compra_grupo_id: null,
    propagar_grupo: false,
    tipo: 'purchase',
    categoria_id: null,
    subcategoria_id: null,
    responsavel_id: null,
    observacoes: null,
}
