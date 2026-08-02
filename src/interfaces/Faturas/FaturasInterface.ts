export interface FaturasSearch {
    id?: string | null
    fatura_id?: string | null
    cartao_id?: string | number | null
    mes?: string | number | null
    ano?: string | number | null
    status?: string | null
    palavra_chave?: string | null | unknown
}

/** Resumo de uma fatura (sem array de transações) */
export interface FaturaResumo {
    id?: number
    cartao_bandeira_id?: number | null
    bandeira?: string | null
    mes?: number
    ano?: number
    competencia?: string
    periodo_inicio?: string
    periodo_fim?: string
    data_vencimento?: string
    valor_total?: number | string
    arquivo_pdf?: string | null
    tem_pdf?: boolean
    status?: string
    erro_mensagem?: string | null
    processado_em?: string | null
    total_transacoes?: number
    transacoes_com_categoria?: number
    created_at?: string
    updated_at?: string
}

/** Grupo de faturas por cartão — item de `GET /faturas/listar` */
export interface FaturasCartaoGroup {
    cartao_id?: number
    nome?: string
    banco?: string
    dia_limite_fatura?: number | null
    dia_vencimento_fatura?: number | null
    cor_fundo?: string | null
    cor_texto?: string | null
    ativo?: boolean
    total_faturas?: number
    valor_total?: number | string
    faturas?: FaturaResumo[]
}

/** @deprecated Use FaturasCartaoGroup — mantido só para compatibilidade de imports */
export type FaturasList = FaturasCartaoGroup

export interface FaturasView extends FaturaResumo {
    cartao_id?: number
    cartao_nome?: string
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
    cartao_bandeira?: string
    cartao_bandeira_id?: number | null
    pdf_url?: string
}

export interface FaturasModel {
    id?: number | null
    fatura_id?: number | null
    cartao_id: number | string | null
    cartao_bandeira_id?: number | string | null
    mes: number | string | null
    ano: number | string | null
    valor_total?: number | string | null
    arquivo_pdf?: File | null
    processar_automatico?: boolean
    status?: string | null
}

export interface CartaoLookup {
    id?: number
    nome?: string
    cor_fundo?: string | null
    cor_texto?: string | null
    qtd_bandeiras?: number
}

export interface LookupsFaturas {
    cartoes?: CartaoLookup[]
}

export interface FaturasInterface {
    getViewFaturas(params: any): Promise<FaturasView | undefined>
    listFaturasPaginate(params: FaturasSearch): Promise<any>
    AsyncListFaturas(params: FaturasSearch): Promise<FaturasModel[] | undefined>
    createFaturas(params: FaturasModel): Promise<any>
    editFaturas(params: FaturasModel): Promise<any>
    deleteFaturas(id: number): Promise<any>
    getLookupsFaturas(): Promise<LookupsFaturas | undefined>
    uploadPdf(params: { id: number; arquivo_pdf: File; processar_automatico?: boolean }): Promise<any>
    processarPdf(id: number): Promise<any>
}

export const FaturasDefaultValues: FaturasModel = {
    id: null,
    fatura_id: null,
    cartao_id: null,
    cartao_bandeira_id: null,
    mes: null,
    ano: new Date().getFullYear(),
    valor_total: null,
    arquivo_pdf: null,
    processar_automatico: true,
}
