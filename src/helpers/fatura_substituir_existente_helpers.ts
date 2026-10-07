import { FaturaExistenteAnexoDuplicado } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import {
    AcaoSugeridaFatura,
    FaturaJaAnexadaRetryPayload,
} from 'libs/api/exceptions/FaturaJaAnexadaError'

export const TITULO_MODAL_FATURA_JA_ANEXADA = 'Já existe fatura nesta competência'

export const LABEL_CADASTRAR_FATURA = 'Cadastrar fatura'

export const LABEL_CADASTRAR_CARTAO_E_FATURA = 'Cadastrar cartão e fatura'

export const LABEL_SUBSTITUIR_FATURA = 'Substituir fatura'

export const COPY_CANCELAR_MANTEM_ANEXO =
    'Cancelar mantém o anexo atual. O arquivo continua na área de envio.'

export const COPY_SUBSTITUIR_FATURA =
    'Substituir fatura usa este arquivo na mesma linha e não cria outra fatura.'

export const COPY_AGUARDE_PROCESSANDO_SUBSTITUIR =
    'Aguarde o processamento terminar para substituir a fatura.'

type FaturaExistenteCta = Pick<
    FaturaExistenteAnexoDuplicado,
    'tem_anexo' | 'tem_pdf' | 'tem_csv' | 'status'
> | null | undefined

export const faturaExistenteTemAnexo = (fatura?: FaturaExistenteCta): boolean => (
    Boolean(fatura?.tem_anexo || fatura?.tem_pdf || fatura?.tem_csv)
)

export const parseAcaoSugeridaFatura = (raw: unknown): AcaoSugeridaFatura | null => {
    if (raw === 'cadastrar' || raw === 'substituir') return raw
    return null
}

export const resolveAcaoSugeridaFatura = (params: {
    acao_sugerida?: unknown
    fatura_existente?: FaturaExistenteCta
}): AcaoSugeridaFatura => {
    const explicita = parseAcaoSugeridaFatura(params.acao_sugerida)
    if (explicita) return explicita
    return faturaExistenteTemAnexo(params.fatura_existente) ? 'substituir' : 'cadastrar'
}

export const labelCtaFaturaExistente = (
    acao: AcaoSugeridaFatura,
    opts?: { cadastrarCartao?: boolean },
): string => {
    if (acao === 'substituir') return LABEL_SUBSTITUIR_FATURA
    if (opts?.cadastrarCartao) return LABEL_CADASTRAR_CARTAO_E_FATURA
    return LABEL_CADASTRAR_FATURA
}

export const podeSubstituirFaturaExistente = (fatura?: FaturaExistenteCta): boolean => (
    String(fatura?.status ?? '').toLowerCase() !== 'processando'
)

export const substituirFaturaRetryFields = (
    faturaId: number,
): FaturaJaAnexadaRetryPayload => ({
    confirmar_substituir_fatura: true,
    fatura_existente_id: faturaId,
})

export type CamposFormularioFatura = {
    cartao_id?: number | string | null
    cartao_bandeira_id?: number | string | null
    mes?: number | string | null
    ano?: number | string | null
}

export type AlvoSubstituirFatura = CamposFormularioFatura & {
    id: number
}

const idPositivo = (raw: unknown): number | null => {
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
}

/** Id do retry: só `fatura_existente.id`. O id da fatura aberta na tela não entra. */
export const idFaturaEscolhida = (
    fatura?: { id?: number | null } | null,
): number | null => idPositivo(fatura?.id)

/**
 * Retry de Substituir: flag + id da fatura do form.
 * Cartão, bandeira, mês e ano são os da escolha (os de `fatura_existente` quando a API os manda).
 */
export type RetrySubstituirFaturaEscolhida = FaturaJaAnexadaRetryPayload & {
    cartao_id?: number | string
    cartao_bandeira_id?: number | string
    mes?: number | string
    ano?: number | string
}

export const retrySubstituirFaturaEscolhida = (
    fatura: AlvoSubstituirFatura,
    form: CamposFormularioFatura,
): RetrySubstituirFaturaEscolhida => {
    const preenchido = (raw: unknown): number | string | undefined => (
        raw == null || raw === '' ? undefined : raw as number | string
    )
    return {
        confirmar_substituir_fatura: true,
        fatura_existente_id: fatura.id,
        cartao_id: preenchido(idPositivo(fatura.cartao_id) ?? form.cartao_id),
        cartao_bandeira_id: preenchido(idPositivo(fatura.cartao_bandeira_id) ?? form.cartao_bandeira_id),
        mes: preenchido(idPositivo(fatura.mes) ?? form.mes),
        ano: preenchido(idPositivo(fatura.ano) ?? form.ano),
    }
}

const CHAVES_FATURA_ABERTA = ['id', 'fatura_id', 'fatura_existente_id', 'confirmar_substituir_fatura'] as const

/** Primeiro POST de Adicionar fatura: não manda o id da fatura que estava aberta. */
export const payloadAdicionarFatura = <T extends Record<string, unknown>>(params: T): T => {
    const next = { ...params }
    for (const chave of CHAVES_FATURA_ABERTA) {
        delete next[chave]
    }
    return next
}

const parseFaturaId = (raw: unknown): number | string | null => {
    if (raw == null || raw === '') return null
    const id = Number(raw)
    if (Number.isFinite(id) && id > 0) return id
    return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

/** Retry de substituir: usa o id da existente, nunca abre outra fatura. */
export const idFaturaAposSubstituir = (
    faturaExistenteId?: number | string | null,
    idDaResposta?: number | string | null,
): number | string | null => (
    parseFaturaId(faturaExistenteId) ?? parseFaturaId(idDaResposta)
)

/**
 * Depois do job, a lista refetchada é a fonte. Não cai no total_transacoes
 * do card antigo quando o extrato novo veio vazio.
 */
export const totalLancamentosAposReprocesso = (params: {
    status?: string | null
    total_transacoes?: number | null
    transacoesCount: number
}): number => {
    const status = String(params.status ?? '').toLowerCase()
    if (status === 'processada' || status === 'erro') {
        return params.transacoesCount
    }
    return params.transacoesCount || Number(params.total_transacoes ?? 0)
}
