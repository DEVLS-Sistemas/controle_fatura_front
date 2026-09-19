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
