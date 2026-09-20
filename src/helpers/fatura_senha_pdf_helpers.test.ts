import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'
import {
    cadastroPdfNaoPersistiu,
    cartaoTemSenhaPdfSalva,
    deveAbrirModalSenhaPdf,
    deveAbrirModalSenhaPdfDeErro,
    deveAbrirModalSenhaPdfDeFatura,
} from './fatura_senha_pdf_helpers'

describe('cartaoTemSenhaPdfSalva', () => {
    it('usa tem_senha_cadastrada do meta', () => {
        expect(cartaoTemSenhaPdfSalva({
            senhaMeta: { tem_senha_cadastrada: true },
        })).toBe(true)
    })

    it('usa tem_senha_pdf do cartão do detalhe ou do lookup', () => {
        expect(cartaoTemSenhaPdfSalva({ cartao: { tem_senha_pdf: true } })).toBe(true)
        expect(cartaoTemSenhaPdfSalva({ lookup: { tem_senha_pdf: true } })).toBe(true)
        expect(cartaoTemSenhaPdfSalva({})).toBe(false)
    })
})

describe('deveAbrirModalSenhaPdf', () => {
    it('abre em pdf_senha_incorreta mesmo com senha salva', () => {
        expect(deveAbrirModalSenhaPdf({
            codigo: 'pdf_senha_incorreta',
            temSenhaPdfCartao: true,
        })).toBe(true)
        expect(deveAbrirModalSenhaPdf({
            motivo: 'incorreta',
            temSenhaPdfCartao: true,
        })).toBe(true)
    })

    it('não pede senha de novo se o cartão já tem senha e o erro não é incorreta', () => {
        expect(deveAbrirModalSenhaPdf({
            codigo: 'pdf_senha_necessaria',
            precisa_senha_pdf: true,
            temSenhaPdfCartao: true,
        })).toBe(false)
    })

    it('abre em pdf_senha_necessaria quando o cartão não tem senha', () => {
        expect(deveAbrirModalSenhaPdf({
            codigo: 'pdf_senha_necessaria',
            precisa_senha_pdf: true,
            temSenhaPdfCartao: false,
        })).toBe(true)
    })
})

describe('deveAbrirModalSenhaPdfDeFatura', () => {
    it('não abre no stub 777 se o cartão já tem senha salva', () => {
        expect(deveAbrirModalSenhaPdfDeFatura({
            precisa_senha_pdf: true,
            erro_codigo: 'pdf_senha_necessaria',
            senha_pdf: { necessaria: true, motivo: 'ausente', tem_senha_cadastrada: true },
            cartao: { tem_senha_pdf: true },
        })).toBe(false)
    })

    it('abre quando o PDF precisa de senha e o cartão não tem', () => {
        expect(deveAbrirModalSenhaPdfDeFatura({
            precisa_senha_pdf: true,
            erro_codigo: 'pdf_senha_necessaria',
            senha_pdf: { necessaria: true, motivo: 'ausente', tem_senha_cadastrada: false },
        })).toBe(true)
    })
})

describe('deveAbrirModalSenhaPdfDeErro', () => {
    it('abre só pdf_senha_incorreta quando já há senha no cartão', () => {
        const necessarria = new PdfSenhaError({
            codigo: 'pdf_senha_necessaria',
            precisa_senha_pdf: true,
            senha_pdf: { tem_senha_cadastrada: true, motivo: 'ausente' },
        })
        const incorreta = new PdfSenhaError({
            codigo: 'pdf_senha_incorreta',
            precisa_senha_pdf: true,
            senha_pdf: { tem_senha_cadastrada: true, motivo: 'incorreta' },
        })
        expect(deveAbrirModalSenhaPdfDeErro(necessarria)).toBe(false)
        expect(deveAbrirModalSenhaPdfDeErro(incorreta)).toBe(true)
    })
})

describe('cadastroPdfNaoPersistiu', () => {
    it('é o caso da fatura 777: enviou PDF e veio sem anexo', () => {
        expect(cadastroPdfNaoPersistiu({
            enviouArquivo: true,
            temPdf: false,
            temCsv: false,
        })).toBe(true)
    })

    it('não acusa sucesso vazio quando o PDF persistiu', () => {
        expect(cadastroPdfNaoPersistiu({
            enviouArquivo: true,
            temPdf: true,
            temCsv: false,
        })).toBe(false)
    })

    it('ignora cadastro sem arquivo', () => {
        expect(cadastroPdfNaoPersistiu({
            enviouArquivo: false,
            temPdf: false,
        })).toBe(false)
    })
})
