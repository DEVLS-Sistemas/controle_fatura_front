import {
    nomeAnexoFaturaExibicao,
    resolveFaturaAnexoNomeOriginal,
    rotulosFaturaAnexoNomes,
} from './fatura_anexo_nome_helpers'

describe('resolveFaturaAnexoNomeOriginal', () => {
    it('prioriza o campo específico do tipo', () => {
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'generico.pdf',
            nome_original_pdf: 'fatura-nubank-agosto.pdf',
            nome_original_csv: 'extrato.csv',
            tem_pdf: true,
            tem_csv: true,
        }, 'pdf')).toBe('fatura-nubank-agosto.pdf')
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'generico.pdf',
            nome_original_pdf: 'fatura-nubank-agosto.pdf',
            nome_original_csv: 'extrato.csv',
            tem_pdf: true,
            tem_csv: true,
        }, 'csv')).toBe('extrato.csv')
    })

    it('usa nome_original quando só existe um tipo', () => {
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'fatura-nubank-agosto.pdf',
            tem_pdf: true,
            tem_csv: false,
        }, 'pdf')).toBe('fatura-nubank-agosto.pdf')
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'fatura-nubank-agosto.pdf',
            tem_pdf: true,
            tem_csv: false,
        }, 'csv')).toBeNull()
    })

    it('com os dois tipos, o genérico vale só para tipo_arquivo', () => {
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'fatura-nubank-agosto.pdf',
            tem_pdf: true,
            tem_csv: true,
            tipo_arquivo: 'pdf',
        }, 'pdf')).toBe('fatura-nubank-agosto.pdf')
        expect(resolveFaturaAnexoNomeOriginal({
            nome_original: 'fatura-nubank-agosto.pdf',
            tem_pdf: true,
            tem_csv: true,
            tipo_arquivo: 'pdf',
        }, 'csv')).toBeNull()
    })
})

describe('nomeAnexoFaturaExibicao', () => {
    it('usa o nome do slot e ignora path e nome legado', () => {
        const fatura = {
            anexo_pdf_nome: 'Fatura Nubank setembro.pdf',
            anexo_csv_nome: 'nubank-09-2026.csv',
            arquivo_pdf: 'faturas/1/abc.pdf',
            arquivo_csv: 'faturas/1/abc.csv',
            nome_original: 'outro.pdf',
        }
        expect(nomeAnexoFaturaExibicao(fatura, 'pdf')).toBe('Fatura Nubank setembro.pdf')
        expect(nomeAnexoFaturaExibicao(fatura, 'csv')).toBe('nubank-09-2026.csv')
    })

    it('não inventa nome quando o campo vem null ou vazio', () => {
        const fatura = {
            anexo_pdf_nome: null,
            anexo_csv_nome: '  ',
            arquivo_pdf: 'faturas/1/abc.pdf',
            nome_original: 'fatura.pdf',
        }
        expect(nomeAnexoFaturaExibicao(fatura, 'pdf')).toBeNull()
        expect(nomeAnexoFaturaExibicao(fatura, 'csv')).toBeNull()
        expect(nomeAnexoFaturaExibicao(null, 'pdf')).toBeNull()
    })
})

describe('rotulosFaturaAnexoNomes', () => {
    it('lista nomes únicos para exibir na tela', () => {
        expect(rotulosFaturaAnexoNomes({
            nome_original_pdf: 'fatura-nubank-agosto.pdf',
            nome_original_csv: 'extrato.csv',
            tem_pdf: true,
            tem_csv: true,
        })).toEqual(['fatura-nubank-agosto.pdf', 'extrato.csv'])
        expect(rotulosFaturaAnexoNomes({
            nome_original: 'fatura-nubank-agosto.pdf',
            tem_pdf: true,
            tem_csv: false,
        })).toEqual(['fatura-nubank-agosto.pdf'])
        expect(rotulosFaturaAnexoNomes({})).toEqual([])
    })
})
