import { resolveFaturaAnexo } from './fatura_anexo_flags'

describe('resolveFaturaAnexo', () => {
    it('mostra PDF só quando tem_pdf desta competência é true', () => {
        expect(resolveFaturaAnexo({
            tem_pdf: true,
            tem_csv: false,
            arquivo_pdf: 'faturas/5/agosto.pdf',
            tipo_arquivo: 'pdf',
        })).toMatchObject({ temPdf: true, temCsv: false, tipo: 'pdf' })
    })

    it('não marca anexo no stub de julho só porque agosto tem PDF (pago / tipo_arquivo)', () => {
        expect(resolveFaturaAnexo({
            tem_pdf: false,
            tem_csv: false,
            tipo_arquivo: 'pdf',
            arquivo_pdf: null,
            arquivo_csv: null,
        })).toEqual({ temPdf: false, temCsv: false, tipo: null })
    })

    it('ignora arquivo_pdf residual quando tem_pdf veio false', () => {
        expect(resolveFaturaAnexo({
            tem_pdf: false,
            tem_csv: false,
            arquivo_pdf: 'faturas/5/algo.pdf',
        })).toEqual({ temPdf: false, temCsv: false, tipo: null })
    })

    it('no legado sem flag, deriva pelo arquivo', () => {
        expect(resolveFaturaAnexo({
            arquivo_pdf: 'faturas/5/fatura.pdf',
        })).toMatchObject({ temPdf: true, tipo: 'pdf' })
        expect(resolveFaturaAnexo({
            arquivo_pdf: 'faturas/5/fatura.csv',
        })).toMatchObject({ temPdf: false, temCsv: true, tipo: 'csv' })
    })
})
