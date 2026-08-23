import {
    EstatisticasCompra,
    EstatisticasFrequencia,
    PeriodoFiltro,
} from 'interfaces/Estatisticas/EstatisticasCompraInterface'

export interface LojasSearch extends PeriodoFiltro {
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
    compras?: number
    ocorrencias?: number
    valor_total?: number
    ticket_medio?: number | null
    frequencia?: EstatisticasFrequencia
    estatisticas?: EstatisticasCompra
}

export interface LojasList {
    id?: number
    nome?: string
    ativo?: boolean
    estabelecimentos_count?: number
    estatisticas?: EstatisticasCompra
    compras?: number
    valor_total?: number
    frequencia?: EstatisticasFrequencia
}

export interface LojasView extends LojasList {
    estabelecimentos?: LojaEstabelecimentoVinculo[]
    ocorrencias?: number
    ticket_medio?: number | null
    primeira_compra?: string | null
    ultima_compra?: string | null
    dias_desde_ultima?: number | null
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

export interface VincularEstabelecimentosPayload {
    loja_id?: number | null
    nome?: string
    estabelecimento_ids: number[]
}

export interface VincularEstabelecimentosResult {
    data?: LojaRapidoData
    status: boolean
    criado?: boolean
    vinculados?: number
    message: string
}

export interface LojasInterface {
    getViewLojas(params: { id: number | string } & PeriodoFiltro): Promise<LojasView | undefined>
    getEstatisticasLoja(id: number | string, periodo?: PeriodoFiltro): Promise<LojasView>
    listLojasPaginate(params: LojasSearch): Promise<any>
    AsyncListLojas(params: LojasSearch): Promise<LojaLookup[] | undefined>
    createLojas(params: LojasModel): Promise<any>
    createLojasRapido(params: LojaRapidoPayload): Promise<LojaRapidoResult>
    vincularEstabelecimentos(params: VincularEstabelecimentosPayload): Promise<VincularEstabelecimentosResult>
    editLojas(params: LojasModel): Promise<any>
    deleteLojas(id: number): Promise<any>
}

export const LojasDefaultValues: LojasModel = {
    id: null,
    loja_id: null,
    nome: null,
    ativo: true,
}
