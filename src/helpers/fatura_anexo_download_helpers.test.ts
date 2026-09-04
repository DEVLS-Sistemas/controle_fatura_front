import {
    faturaAnexoDownloadMetaFrom,
    resolveFaturaAnexoDownloadFilename,
} from './fatura_anexo_nome_helpers'

describe('resolveFaturaAnexoDownloadFilename', () => {
    it('prioriza Content-Disposition, depois o nome original da API', () => {
        expect(resolveFaturaAnexoDownloadFilename(
            'pdf',
            { nomeOriginal: 'meta.pdf', cartaoNome: 'Nubank', competencia: '08/2026' },
            'attachment; filename="fatura-nubank-agosto.pdf"',
        )).toBe('fatura-nubank-agosto.pdf')
        expect(resolveFaturaAnexoDownloadFilename(
            'pdf',
            { nomeOriginalPdf: 'fatura-nubank-agosto.pdf', cartaoNome: 'Nubank', competencia: '08/2026' },
        )).toBe('fatura-nubank-agosto.pdf')
        expect(resolveFaturaAnexoDownloadFilename(
            'csv',
            { nomeOriginalCsv: 'extrato.csv' },
        )).toBe('extrato.csv')
        expect(resolveFaturaAnexoDownloadFilename(
            'pdf',
            { cartaoNome: 'Nubank', competencia: '08/2026' },
        )).toBe('fatura - Nubank - 08-2026.pdf')
    })
})

describe('faturaAnexoDownloadMetaFrom', () => {
    it('copia os nomes originais do payload da fatura', () => {
        expect(faturaAnexoDownloadMetaFrom({
            cartao_nome: 'Nubank',
            competencia: '08/2026',
            mes: 8,
            ano: 2026,
            nome_original: 'fatura-nubank-agosto.pdf',
            nome_original_pdf: 'fatura-nubank-agosto.pdf',
            nome_original_csv: 'extrato.csv',
        })).toEqual({
            cartaoNome: 'Nubank',
            competencia: '08/2026',
            mes: 8,
            ano: 2026,
            nomeOriginal: 'fatura-nubank-agosto.pdf',
            nomeOriginalPdf: 'fatura-nubank-agosto.pdf',
            nomeOriginalCsv: 'extrato.csv',
        })
    })
})
