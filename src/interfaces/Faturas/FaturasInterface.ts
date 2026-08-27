import { ParserHomologado, SenhaPdfRegraLookup } from 'interfaces/Cartoes/CartoesInterface'

export interface FaturasSearch {
    id?: string | null
    fatura_id?: string | null
    cartao_id?: string | number | null
    cartao_bandeira_id?: string | number | null
    mes?: string | number | null
    ano?: string | number | null
    status?: string | null
    pessoa_id?: string | number | null
    palavra_chave?: string | null | unknown
    page?: number
    perPage?: number
}

/** Metadados de senha do PDF quando a fatura precisa de desbloqueio */
export interface SenhaPdfMeta {
    necessaria?: boolean
    motivo?: 'ausente' | 'incorreta' | string | null
    regra?: string | null
    orientacao?: string | null
    label_regra?: string | null
    tem_senha_cadastrada?: boolean
    cartao_id?: number | null
}

export const PDF_SENHA_ERRO_CODIGOS = ['pdf_senha_necessaria', 'pdf_senha_incorreta'] as const

/** Resumo de uma fatura (sem array de transações) */
export interface FaturaResumo {
    id?: number
    cartao_bandeira_id?: number | null
    bandeira?: string | null
    bandeira_cor_principal?: string | null
    bandeira_cor_secundaria?: string | null
    mes?: number
    ano?: number
    competencia?: string
    periodo_inicio?: string
    periodo_fim?: string
    data_vencimento?: string
    valor_total?: number | string
    /** Valor descrito no PDF / lançamentos (sem compras manuais abertas) */
    valor_extrato?: number | string | null
    /** Soma das compras manuais ainda nao_conciliada / pendente */
    valor_nao_conciliado?: number | string | null
    /** valor_extrato + valor_nao_conciliado — número grande do detalhe */
    valor_total_com_pendencias?: number | string | null
    tem_compras_nao_conciliadas?: boolean | null
    compras_nao_conciliadas_label?: string | null
    /** Quitação: true quando valor_restante é 0 (não confundir com status do PDF) */
    pago?: boolean
    valor_pago?: number | string
    valor_restante?: number | string
    arquivo_pdf?: string | null
    arquivo_csv?: string | null
    /** Tipo do anexo atual: pdf | csv | null */
    tipo_arquivo?: 'pdf' | 'csv' | null
    /** true somente se o anexo for PDF */
    tem_pdf?: boolean
    /** true somente se o anexo for CSV */
    tem_csv?: boolean
    /** URL autenticada para abrir/baixar o PDF */
    pdf_url?: string | null
    /** URL autenticada para abrir/baixar o CSV */
    csv_url?: string | null
    /** true se tem PDF ou CSV e status !== processando */
    pode_remover_anexo?: boolean
    status?: string
    erro_codigo?: string | null
    erro_mensagem?: string | null
    precisa_senha_pdf?: boolean
    senha_pdf?: SenhaPdfMeta | null
    processado_em?: string | null
    total_transacoes?: number
    transacoes_com_categoria?: number
    pessoa_id?: number | null
    pessoa_nome?: string | null
    responsavel_id?: number | null
    responsavel_nome?: string | null
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
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    ativo?: boolean
    pessoa_id?: number | null
    pessoa_nome?: string | null
    total_faturas?: number
    valor_total?: number | string
    faturas?: FaturaResumo[]
}

/** @deprecated Use FaturasCartaoGroup — mantido só para compatibilidade de imports */
export type FaturasList = FaturasCartaoGroup

export type FaturaGrupoChave = 'cartao' | 'pagamentos_financiamentos'

/** Grupo de transações por final do cartão — `GET /faturas/listar/{id}` */
export interface FaturaGrupoPorCartao {
    cartao_numero_id?: number | null
    ultimos_digitos?: string | null
    tipo?: string | null
    apelido?: string | null
    nome_no_cartao?: string | null
    /** `"cartao"` ou `"pagamentos_financiamentos"` — chave estável (não comparar o label) */
    grupo_chave?: FaturaGrupoChave | string | null
    label?: string
    total_transacoes?: number
    valor_total?: number | string
}

export interface FaturasView extends FaturaResumo {
    cartao_id?: number
    cartao_nome?: string
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    cartao_bandeira?: string
    cartao_bandeira_id?: number | null
    cartao_dia_limite_fatura?: number | null
    cartao_dia_vencimento_fatura?: number | null
    /** Soma dos pagamentos lançados nesta fatura (extrato) */
    pagamentos_total?: number | string
    /** Parte dos pagamentos que quitou a fatura anterior */
    pagamentos_abatido_anterior?: number | string
    /** Parte dos pagamentos que antecipou este ciclo */
    pagamentos_antecipado?: number | string
    /** Competência imediatamente anterior (mesma bandeira), ou null */
    fatura_anterior_id?: number | null
    fatura_proxima_id?: number | null
    fatura_anterior_competencia?: string | null
    fatura_proxima_competencia?: string | null
    pessoa_id?: number | null
    pessoa_nome?: string | null
    responsavel_id?: number | null
    responsavel_nome?: string | null
    grupos_por_cartao?: FaturaGrupoPorCartao[]
}

export interface FaturasModel {
    id?: number | null
    fatura_id?: number | null
    cartao_id: number | string | null
    cartao_bandeira_id?: number | string | null
    /** Retry modal metadados: cria cartão no mesmo POST quando não há cartao_id */
    cartao_nome?: string | null
    cadastrar_cartao?: boolean
    /** Guard do front: confirma substituição no mesmo cartão+mês */
    substituir_fatura?: boolean
    /** Retry modal: nome da bandeira (lookup) quando `criar: true` */
    bandeira?: string | null
    /** Retry modal CSV: final existente */
    cartao_numero_id?: number | string | null
    /** Retry modal CSV: cria final com 4 dígitos */
    ultimos_digitos?: string | null
    mes: number | string | null
    ano: number | string | null
    valor_total?: number | string | null
    arquivo_pdf?: File | null
    processar_automatico?: boolean
    status?: string | null
    senha_pdf?: string | null
    salvar_senha_pdf?: boolean
    /** Regra selecionada no modal de senha — grava no cartão no cadastro inline */
    senha_pdf_regra?: string | null
    pessoa_id?: number | string | null
    cadastrar_pessoa?: boolean
    pessoa_nome?: string | null
    pessoa_sobrenome?: string | null
    confirmar_titular?: boolean
}

export interface ProcessarPdfParams {
    senha_pdf?: string
    salvar_senha_pdf?: boolean
    /** Atualiza a regra no cartão quando salvar_senha_pdf (ou junto ao desbloqueio) */
    senha_pdf_regra?: string | null
}

export interface CartaoLookup {
    id?: number
    nome?: string
    banco?: string | null
    cor_fundo?: string | null
    cor_texto?: string | null
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    qtd_bandeiras?: number
    qtd_numeros?: number
    /** false → cadastro com PDF/CSV abre modal de bandeira/final */
    tem_numeros?: boolean
    tem_senha_pdf?: boolean
    senha_pdf_regra?: string | null
    senha_pdf_orientacao?: string | null
}

export interface LookupsFaturas {
    cartoes?: CartaoLookup[]
    senhas_pdf_regras?: SenhaPdfRegraLookup[]
    parsers_homologados?: ParserHomologado[]
}

/** Resposta de `DELETE /faturas/excluir-todas` */
export interface ExcluirTodasFaturasData {
    faturas_excluidas: number
    transacoes_excluidas: number
}

export interface ExcluirTodasFaturasResponse {
    fatura?: {
        data?: ExcluirTodasFaturasData
        status?: boolean
        message?: string
    }
}

export type TipoRemoverAnexo = 'pdf' | 'csv' | 'ambos'

export type MotivoRemoverAnexo = 'remover' | 'trocar_pdf'

export type OrigemRestauracaoAnexo = 'desvinculo' | 'match_exato' | 'sugestao'

export interface ImpactoRemoverAnexoMotivo {
    value: MotivoRemoverAnexo | string
    label: string
}

export interface ImpactoRemoverAnexoTotais {
    quantidade: number
    valor_total: number | string
}

export interface ImpactoRemoverAnexoFaturaAfetada {
    id: number
    competencia: string
    quantidade: number
    valor_total: number | string
    ficara_vazia: boolean
}

export interface ImpactoRemoverAnexoParcelasOutras {
    quantidade: number
    valor_total: number | string
    faturas_afetadas: ImpactoRemoverAnexoFaturaAfetada[]
}

export interface ImpactoRemoverAnexoCompra {
    id: number
    texto_compra: string
    valor: number | string
    data: string
    parcela_atual?: number | null
    parcelas_total?: number | null
    fatura_id?: number | null
    competencia?: string | null
    status_conciliacao_atual?: string | null
    status_conciliacao_depois?: string | null
    origem_restauracao?: OrigemRestauracaoAnexo | string | null
    precisa_conciliar_label?: string | null
}

export interface ImpactoRemoverAnexoStub {
    id: number
    competencia: string
}

/** `GET /faturas/impacto-remover-anexo/{id}` */
export interface ImpactoRemoverAnexo {
    fatura_id: number
    competencia?: string | null
    cartao_nome?: string | null
    bandeira?: string | null
    tem_pdf?: boolean
    tem_csv?: boolean
    pdf_url?: string | null
    pode_remover?: boolean
    motivos?: ImpactoRemoverAnexoMotivo[]
    lancamentos_deste_anexo?: ImpactoRemoverAnexoTotais | null
    parcelas_geradas_outras_faturas?: ImpactoRemoverAnexoParcelasOutras | null
    compras_que_voltam_a_conciliar?: ImpactoRemoverAnexoCompra[]
    faturas_stub_que_serao_excluidas?: ImpactoRemoverAnexoStub[]
    avisos?: string[]
}

export interface RemoverAnexoParams {
    id: number
    motivo: MotivoRemoverAnexo
    tipo?: TipoRemoverAnexo
    arquivo_pdf?: File
    processar_automatico?: boolean
    senha_pdf?: string
    salvar_senha_pdf?: boolean
    senha_pdf_regra?: string | null
}

/** `POST /faturas/remover-anexo` — etapas 2 (`remover`) e 3 (`trocar_pdf`) */
export interface RemoverAnexoResult {
    fatura_id: number
    motivo?: MotivoRemoverAnexo | string
    anexo_removido?: boolean
    tem_pdf?: boolean
    tem_csv?: boolean
    pdf_url?: string | null
    status?: string | null
    aguardando_processamento?: boolean
    lancamentos_apagados?: number
    parcelas_apagadas_outras_faturas?: number
    faturas_stub_excluidas?: Array<number | ImpactoRemoverAnexoStub>
    compras_que_voltaram_a_conciliar?: ImpactoRemoverAnexoCompra[]
    avisos?: string[]
    message?: string
}

export interface FaturasInterface {
    getViewFaturas(params: any): Promise<FaturasView | undefined>
    listFaturasPaginate(params: FaturasSearch): Promise<any>
    AsyncListFaturas(params: FaturasSearch): Promise<FaturasModel[] | undefined>
    createFaturas(params: FaturasModel): Promise<any>
    editFaturas(params: FaturasModel): Promise<any>
    deleteFaturas(id: number): Promise<any>
    deleteAllFaturas(): Promise<ExcluirTodasFaturasResponse>
    getLookupsFaturas(): Promise<LookupsFaturas | undefined>
    uploadPdf(params: {
        id: number
        arquivo_pdf: File
        processar_automatico?: boolean
        senha_pdf?: string
        salvar_senha_pdf?: boolean
        cartao_bandeira_id?: number | string | null
        bandeira?: string | null
        cartao_numero_id?: number | string | null
        ultimos_digitos?: string | null
        pessoa_id?: number | string | null
        cadastrar_pessoa?: boolean
        pessoa_nome?: string | null
        pessoa_sobrenome?: string | null
        confirmar_titular?: boolean
    }): Promise<any>
    processarPdf(id: number, params?: ProcessarPdfParams): Promise<any>
    getImpactoRemoverAnexo(id: number | string): Promise<ImpactoRemoverAnexo>
    removerAnexo(params: RemoverAnexoParams): Promise<RemoverAnexoResult>
}

/** Extrai `data` de `GET /impacto-remover-anexo/{id}` */
export const extractImpactoRemoverAnexo = (result: unknown): ImpactoRemoverAnexo | null => {
    if (!result || typeof result !== 'object') return null
    const body = result as Record<string, unknown>
    const nested = body.data
    const candidate = (nested && typeof nested === 'object' && !Array.isArray(nested))
        ? nested as Record<string, unknown>
        : body
    if (candidate.fatura_id == null && candidate.lancamentos_deste_anexo == null) return null
    return candidate as unknown as ImpactoRemoverAnexo
}

/** Extrai `data` + `message` de `POST /remover-anexo` */
export const extractRemoverAnexoResult = (result: unknown): RemoverAnexoResult | null => {
    if (!result || typeof result !== 'object') return null
    const body = result as Record<string, unknown>
    const nested = body.data
    const candidate = (nested && typeof nested === 'object' && !Array.isArray(nested))
        ? nested as Record<string, unknown>
        : body
    if (
        candidate.fatura_id == null
        && candidate.anexo_removido == null
        && candidate.compras_que_voltaram_a_conciliar == null
        && candidate.aguardando_processamento == null
    ) {
        return null
    }
    const message = typeof body.message === 'string' ? body.message : undefined
    return { ...(candidate as unknown as RemoverAnexoResult), message }
}

/** Extrai payload de fatura aninhado em respostas `result.fatura` / `fatura.data` */
export const extractFaturaPayload = (result: unknown): Record<string, any> | null => {
    const body = result as Record<string, any> | null | undefined
    if (!body) return null
    return body?.fatura?.data ?? body?.data ?? body?.fatura ?? body
}

export const extractFaturaId = (result: unknown): number | string | null => {
    const data = extractFaturaPayload(result)
    return data?.id ?? (result as any)?.id ?? null
}

/** Detecta se a fatura/resposta exige senha do PDF */
export const faturaPrecisaSenhaPdf = (
    source?: {
        precisa_senha_pdf?: boolean
        erro_codigo?: string | null
        senha_pdf?: SenhaPdfMeta | null
        status?: string | null
    } | null,
    envelope?: Record<string, any> | null
): boolean => {
    if (envelope?.precisa_senha_pdf === true) return true
    if (source?.precisa_senha_pdf === true) return true
    if (source?.senha_pdf?.necessaria === true) return true
    const codigo = source?.erro_codigo ?? envelope?.codigo ?? envelope?.erro_codigo
    if (codigo && (PDF_SENHA_ERRO_CODIGOS as readonly string[]).includes(codigo)) return true
    return false
}

export const resolveSenhaPdfMeta = (
    source?: {
        senha_pdf?: SenhaPdfMeta | null
        erro_codigo?: string | null
        erro_mensagem?: string | null
        precisa_senha_pdf?: boolean
    } | null,
    envelope?: Record<string, any> | null
): SenhaPdfMeta | null => {
    const meta = source?.senha_pdf ?? envelope?.senha_pdf ?? null
    if (meta) return meta
    if (!faturaPrecisaSenhaPdf(source, envelope)) return null
    const codigo = source?.erro_codigo ?? envelope?.codigo ?? envelope?.erro_codigo
    return {
        necessaria: true,
        motivo: codigo === 'pdf_senha_incorreta' ? 'incorreta' : 'ausente',
        orientacao: null,
        tem_senha_cadastrada: false,
    }
}

export const FaturasDefaultValues: FaturasModel = {
    id: null,
    fatura_id: null,
    cartao_id: null,
    cartao_bandeira_id: null,
    mes: null,
    // Sem default: evita enviar ano no fluxo só-com-anexo e pular o modal de metadados
    ano: null,
    valor_total: null,
    arquivo_pdf: null,
    processar_automatico: true,
    pessoa_id: null,
}
