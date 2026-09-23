import {
    faturaPrecisaSenhaPdf,
    SenhaPdfMeta,
} from 'interfaces/Faturas/FaturasInterface'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'

export const MSG_CADASTRO_PDF_NAO_ANEXADO =
    'O arquivo não foi anexado à fatura. Selecione o PDF de novo e conclua o cadastro nesta tela.'

export const MSG_UPLOAD_PDF_NAO_ANEXADO =
    'O arquivo não foi anexado. Tente enviar de novo nesta tela.'

type CartaoSenhaPdf = {
    tem_senha_pdf?: boolean | null
} | null | undefined

type LookupSenhaPdf = {
    tem_senha_pdf?: boolean | null
} | null | undefined

export const cartaoTemSenhaPdfSalva = (params: {
    senhaMeta?: SenhaPdfMeta | null
    cartao?: CartaoSenhaPdf
    lookup?: LookupSenhaPdf
}): boolean =>
    params.senhaMeta?.tem_senha_cadastrada === true
    || params.cartao?.tem_senha_pdf === true
    || params.lookup?.tem_senha_pdf === true

export const codigoErroSenhaPdf = (params: {
    codigo?: string | null
    erro_codigo?: string | null
    motivo?: string | null
}): string | null => {
    const codigo = params.codigo ?? params.erro_codigo ?? null
    if (codigo) return String(codigo)
    if (params.motivo === 'incorreta') return 'pdf_senha_incorreta'
    if (params.motivo === 'ausente') return 'pdf_senha_necessaria'
    return null
}

/**
 * Modal de senha: `pdf_senha_incorreta` sempre.
 * `pdf_senha_necessaria` só se o cartão **não** tem senha salva —
 * com senha no cartão o back usa ela; não pedir de novo.
 */
export const deveAbrirModalSenhaPdf = (params: {
    codigo?: string | null
    erro_codigo?: string | null
    motivo?: string | null
    precisa_senha_pdf?: boolean
    temSenhaPdfCartao?: boolean
}): boolean => {
    const codigo = codigoErroSenhaPdf(params)
    if (codigo === 'pdf_senha_incorreta' || params.motivo === 'incorreta') {
        return true
    }
    if (params.temSenhaPdfCartao) {
        return false
    }
    if (codigo === 'pdf_senha_necessaria' || params.precisa_senha_pdf === true) {
        return true
    }
    return false
}

export const deveAbrirModalSenhaPdfDeFatura = (
    fatura?: {
        precisa_senha_pdf?: boolean
        erro_codigo?: string | null
        senha_pdf?: SenhaPdfMeta | null
        cartao?: CartaoSenhaPdf
    } | null,
    lookup?: LookupSenhaPdf,
): boolean => deveAbrirModalSenhaPdf({
    codigo: fatura?.erro_codigo,
    motivo: fatura?.senha_pdf?.motivo,
    precisa_senha_pdf: faturaPrecisaSenhaPdf(fatura),
    temSenhaPdfCartao: cartaoTemSenhaPdfSalva({
        senhaMeta: fatura?.senha_pdf,
        cartao: fatura?.cartao,
        lookup,
    }),
})

export const deveAbrirModalSenhaPdfDeErro = (
    error: PdfSenhaError,
    temSenhaPdfCartao?: boolean,
): boolean => deveAbrirModalSenhaPdf({
    codigo: error.codigo,
    motivo: error.senha_pdf?.motivo,
    precisa_senha_pdf: error.precisa_senha_pdf,
    temSenhaPdfCartao:
        temSenhaPdfCartao
        || cartaoTemSenhaPdfSalva({ senhaMeta: error.senha_pdf }),
})

/** 200 depois de enviar PDF/CSV sem `tem_pdf`/`tem_csv` — fatura stub (ex.: 777). */
export const cadastroPdfNaoPersistiu = (params: {
    enviouArquivo: boolean
    temPdf?: boolean | null
    temCsv?: boolean | null
}): boolean => {
    if (!params.enviouArquivo) return false
    return params.temPdf !== true && params.temCsv !== true
}
