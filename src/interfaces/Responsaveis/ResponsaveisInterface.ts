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

export interface ResponsavelVisualizarSearch {
    mes?: number | null
    ano?: number | null
}

export interface ResponsavelVisualizarReferencia {
    mes: number
    ano: number
    label: string
}

export interface ResponsavelVisualizarPessoa {
    id: number
    nome?: string | null
    sobrenome?: string | null
    nome_completo?: string | null
    responsavel_id?: number | null
    eh_principal?: boolean | null
    ativo?: boolean | null
}

export interface ResponsavelVisualizarTotais {
    compras: number
    ocorrencias?: number
    avista?: number
    parceladas?: number
    valor_total: number
    ticket_medio?: number | null
    primeira_compra?: string | null
    ultima_compra?: string | null
}

export interface ResponsavelVisualizarEmAberto {
    compras: number
    parcelas_restantes?: number
    valor_total?: number
    valor_pago?: number
    valor_aberto: number
    percentual_pago?: number | null
}

export interface ResponsavelVisualizarRepasse {
    valor_total_compras?: number
    valor_pago?: number
    valor_aberto: number
    compras_abertas: number
    compras_pagas?: number
    parcelas_pendentes_na_referencia?: number
    valor_aberto_na_referencia?: number
}

export interface ResponsavelVisualizarCompetencia {
    mes: number
    ano: number
    label: string
    compras: number
    ocorrencias?: number
    valor_total: number
}

export interface ResponsavelVisualizarFaturaBandeira {
    id: number
    cartao_bandeira_id?: number | null
    bandeira?: string | null
    valor_total?: number
    ocorrencias?: number
}

export interface ResponsavelVisualizarPorCartao {
    cartao_id: number
    cartao_nome: string
    cor_fundo?: string | null
    cor_texto?: string | null
    compras: number
    ocorrencias?: number
    valor_total: number
    fatura_id?: number | null
    faturas?: ResponsavelVisualizarFaturaBandeira[]
}

export interface ResponsavelVisualizarPorCategoria {
    categoria_id?: number | null
    nome?: string | null
    cor?: string | null
    compras: number
    valor_total: number
}

export interface ResponsavelVisualizarFaturaPadrao {
    id: number
    mes?: number | null
    ano?: number | null
    competencia?: string | null
    label?: string | null
    valor_total?: number
    status?: string | null
    cartao_id?: number | null
    cartao_nome?: string | null
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
    pessoa_id?: number | null
    pessoa_nome?: string | null
}

export interface ResponsavelVisualizarCompraRecente {
    identificador: string
    compra_grupo_id?: string | null
    transacao_id?: number | null
    titulo?: string | null
    data?: string | null
    valor?: number | null
    valor_total?: number | null
    parcelas_total?: number | null
    avista?: boolean
    estabelecimento?: string | null
    cartao_nome?: string | null
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
    fatura_id?: number | null
    fatura_mes?: number | null
    fatura_ano?: number | null
}

export interface ResponsavelVisualizarParceladaAberta {
    identificador?: string | null
    compra_grupo_id?: string | null
    titulo?: string | null
    parcela_atual?: number | null
    parcelas_total?: number | null
    percentual_pago?: number | null
    valor_aberto?: number | null
    estimativa_termino?: string | null
    cartao_id?: number | null
    cartao_nome?: string | null
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
}

export interface ResponsavelVisualizarAtalhoRef {
    responsavel_id: number
    mes?: number
    ano?: number
}

export interface ResponsavelVisualizarAtalhos {
    fatura_responsavel?: ResponsavelVisualizarAtalhoRef | null
    repasses?: ResponsavelVisualizarAtalhoRef | null
    ranking_parceladas?: (ResponsavelVisualizarAtalhoRef & { apenas_abertas?: number | boolean }) | null
    compras?: (Pick<ResponsavelVisualizarAtalhoRef, 'responsavel_id'> & {
        tipo?: string | null
        categoria_id?: number | null
    }) | null
}

export interface ResponsavelVisualizarView {
    id: number
    nome: string
    tipo?: string | null
    tipo_label?: string | null
    ativo?: boolean
    eh_eu?: boolean
    referencia?: ResponsavelVisualizarReferencia
    pessoa?: ResponsavelVisualizarPessoa | null
    totais: ResponsavelVisualizarTotais
    em_aberto: ResponsavelVisualizarEmAberto
    repasse: ResponsavelVisualizarRepasse
    competencia: ResponsavelVisualizarCompetencia
    por_cartao?: ResponsavelVisualizarPorCartao[]
    por_categoria?: ResponsavelVisualizarPorCategoria[]
    faturas_padrao?: ResponsavelVisualizarFaturaPadrao[]
    compras_recentes?: ResponsavelVisualizarCompraRecente[]
    parceladas_abertas?: ResponsavelVisualizarParceladaAberta[]
    atalhos?: ResponsavelVisualizarAtalhos | null
}

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
    getVisualizarResponsavel(
        id: number | string,
        params?: ResponsavelVisualizarSearch
    ): Promise<ResponsavelVisualizarView | undefined>
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
