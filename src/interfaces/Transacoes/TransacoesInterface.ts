export interface TransacoesSearch {
    id?: string | null
    transacao_id?: string | null
    data_inicio?: string | null
    data_fim?: string | null
    cartao_id?: string | number | null
    categoria_id?: string | number | null
    subcategoria_id?: string | number | null
    estabelecimento_id?: string | number | null
    loja_id?: string | number | null
    responsavel_id?: string | number | null
    fatura_id?: string | number | null
    tipo?: string | null
    origem_compra?: string | null
    eh_assinatura?: boolean | number | string | null
    mes?: string | number | null
    ano?: string | number | null
    palavra_chave?: string | null | unknown
    /** Usado em `/transacoes/estabelecimentos-do-filtro` */
    apenas_sem_loja?: boolean | number | string | null
    status_conciliacao?: string | null
}

/** Item de `GET /transacoes/estabelecimentos-do-filtro` */
export interface EstabelecimentoDoFiltro {
    id: number
    nome: string
    loja_id?: number | null
    loja_nome?: string | null
    transacoes_count?: number
}

export interface TransacoesList {
    id?: number
    fatura_id?: number
    data?: string
    estabelecimento?: string
    estabelecimento_id?: number | null
    estabelecimento_nome?: string
    loja_id?: number | null
    loja_nome?: string | null
    valor?: number
    valor_compra?: number | string | null
    parcelas_total?: number
    parcela_atual?: number
    compra_grupo_id?: string | number | null
    tipo?: string
    tipo_label?: string | null
    /** true se não for compra (`purchase`) */
    operacional?: boolean | null
    grupo_chave?: 'cartao' | 'pagamentos_financiamentos' | 'operacionais' | string | null
    origem_compra?: string | null
    origem_compra_label?: string | null
    eh_assinatura?: boolean | number | string | null
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
    cartao_numero_id?: number | null
    cartao_numero?: {
        id?: number
        ultimos_digitos?: string
        tipo?: string | null
        apelido?: string | null
        nome_no_cartao?: string | null
    } | null
    ultimos_digitos?: string | null
    cartao_numero_tipo?: string | null
    cartao_numero_apelido?: string | null
    cartao_numero_nome_no_cartao?: string | null
    cartao_bandeira?: string | null
    fatura_mes?: number
    fatura_ano?: number
    descricao?: string | null
    descricao_fatura?: string | null
    status_conciliacao?: string | null
    status_conciliacao_label?: string | null
    observacoes?: string
    texto_compra?: string | null
    /** true só se o usuário cadastrou. false no PDF e nas parcelas materializadas em faturas sem anexo. */
    compra_manual?: boolean | null
    precisa_conciliar?: boolean | null
    precisa_conciliar_label?: string | null
    tem_sugestao_conciliacao?: boolean | null
    sugestao_conciliacao_label?: string | null
    compra_manual_vinculada?: CompraManualVinculada | null
    conciliada_com_manual?: boolean | null
    conciliada_com_manual_label?: string | null
    conta_no_total?: boolean | null
    importada_pdf?: boolean | null
    /** Repasse do responsável (não confundir com quitação da bandeira) */
    valor_pago_repasse?: number | null
    valor_aberto_repasse?: number | null
    status_repasse?: 'pendente' | 'parcial' | 'pago' | null
    data_ultimo_repasse?: string | null
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
    /** Número/final do cartão que realizou a compra */
    cartao_numero_id?: number | string | null
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
    /** Canal/origem da compra — obrigatório no create */
    origem_compra?: string | null
    /** Independente de origem_compra: marca a compra como assinatura */
    eh_assinatura?: boolean | null
    categoria_id?: number | string | null
    subcategoria_id?: number | string | null
    responsavel_id?: number | string | null
    /** Nome amigável da compra (obrigatório no cadastro manual) */
    descricao?: string | null
    observacoes?: string | null
    texto_compra?: string | null
    compra_manual?: boolean | null
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
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    pessoa_id?: number | null
    pessoa_nome?: string | null
    pessoa_eh_principal?: boolean
}

export interface FaturaLookup {
    id?: number
    mes?: number
    ano?: number
    cartao_id?: number | null
    cartao_nome?: string
}

export interface TipoLookup {
    value?: string
    label?: string
    operacional?: boolean
}

export interface OrigemCompraLookup {
    value?: string
    label?: string
}

export interface StatusConciliacaoLookup {
    value?: string
    label?: string
}

export interface LookupsTransacoes {
    tipos?: TipoLookup[]
    origens_compra?: OrigemCompraLookup[]
    status_conciliacao?: StatusConciliacaoLookup[]
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
    listEstabelecimentosDoFiltro(params: TransacoesSearch): Promise<EstabelecimentoDoFiltro[]>
    createTransacoes(params: TransacoesModel): Promise<any>
    editTransacoes(params: TransacoesModel): Promise<any>
    deleteTransacoes(id: number, options?: { excluir_grupo?: boolean }): Promise<any>
    getLookupsTransacoes(): Promise<LookupsTransacoes | undefined>
    exportCsv(params: TransacoesSearch): Promise<Blob>
    listCandidatosConciliacao(identificador: string | number): Promise<CandidatoConciliacao[]>
    conciliarTransacao(params: ConciliarTransacaoParams): Promise<any>
    desvincularConciliacao(params: DesvincularConciliacaoParams): Promise<any>
    rejeitarConciliacao(params: { compra_id: string | number }): Promise<any>
    listAnexosTransacao(params: { transacao_id?: number | string; identificador?: string | number }): Promise<CompraAnexo[]>
    uploadAnexosTransacao(params: {
        transacao_id?: number | string
        identificador?: string | number
        arquivos: File[]
        tipo?: string
    }): Promise<any>
    downloadAnexoTransacao(id: number): Promise<{ blob: Blob; filename: string }>
    deleteAnexoTransacao(id: number): Promise<any>
    getHistoricoTransacao(identificador: string | number): Promise<CompraHistoricoItem[]>
}

export type StatusConciliacao = 'nao_conciliada' | 'pendente' | 'conciliada' | 'rejeitada'

export interface CompraManualVinculada {
    id?: number | string | null
    texto_compra?: string | null
    observacoes?: string | null
    status_conciliacao?: string | null
    compra_grupo_id?: string | number | null
}

export interface ConciliarTransacaoParams {
    compra_id: string | number
    lancamento_id: string | number
}

export interface DesvincularConciliacaoParams {
    compra_id?: string | number
    lancamento_id?: string | number
    id?: string | number
}

export interface CandidatoConciliacao {
    id: number
    lancamento_id?: number | null
    compra_id?: number | string | null
    compra_grupo_id?: string | number | null
    descricao?: string | null
    descricao_fatura?: string | null
    texto_compra?: string | null
    observacoes?: string | null
    estabelecimento_nome?: string | null
    valor?: number | string | null
    data?: string | null
    score?: number | null
    sugestao?: boolean
}

export interface CompraAnexo {
    id: number
    nome?: string | null
    nome_original?: string | null
    tipo?: string | null
    mime?: string | null
    tamanho?: number | null
    created_at?: string | null
}

export interface CompraHistoricoItem {
    id?: number
    acao?: string | null
    descricao?: string | null
    created_at?: string | null
}

export const TransacoesDefaultValues: TransacoesModel = {
    id: null,
    transacao_id: null,
    cartao_id: null,
    cartao_numero_id: null,
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
    origem_compra: null,
    eh_assinatura: false,
    categoria_id: null,
    subcategoria_id: null,
    responsavel_id: null,
    descricao: null,
    observacoes: null,
}
