export interface FaturasSearch {
    id?: string | null
    fatura_id?: string | null
    cartao_id?: string | number | null
    mes?: string | number | null
    ano?: string | number | null
    status?: string | null
    palavra_chave?: string | null | unknown
}

export interface FaturasList {
    id?: number
    cartao_id?: number
    cartao_nome?: string
    mes?: number
    ano?: number
    valor_total?: number
    status?: string
    arquivo_pdf?: string
    total_transacoes?: number
    erro_mensagem?: string
}

export interface FaturasView extends FaturasList {
    cartao_bandeira?: string
    cartao_ultimos_digitos?: string
    processado_em?: string
    tem_pdf?: boolean
    pdf_url?: string
}

export interface FaturasModel {
    id?: number | null
    fatura_id?: number | null
    cartao_id: number | string | null
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
    bandeira?: string
    ultimos_digitos?: string
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
    mes: null,
    ano: new Date().getFullYear(),
    valor_total: null,
    arquivo_pdf: null,
    processar_automatico: true,
}
