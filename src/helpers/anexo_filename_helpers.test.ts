import {
    isFilenameFallbackPorId,
    parseContentDispositionFilename,
    primeiroNomeArquivoUtil,
} from './anexo_filename_helpers'

describe('parseContentDispositionFilename', () => {
    it('lê filename simples e filename* UTF-8', () => {
        expect(parseContentDispositionFilename(
            'attachment; filename="fatura-nubank-agosto.pdf"',
        )).toBe('fatura-nubank-agosto.pdf')
        expect(parseContentDispositionFilename(
            "attachment; filename*=UTF-8''fatura-nubank-agosto.pdf",
        )).toBe('fatura-nubank-agosto.pdf')
        expect(parseContentDispositionFilename(
            "inline; filename*=UTF-8''fatura%20nubank%20agosto.pdf",
        )).toBe('fatura nubank agosto.pdf')
        expect(parseContentDispositionFilename(null)).toBeNull()
        expect(parseContentDispositionFilename('inline')).toBeNull()
    })
})

describe('primeiroNomeArquivoUtil', () => {
    it('devolve o primeiro nome não vazio', () => {
        expect(primeiroNomeArquivoUtil(null, '  ', 'fatura.pdf')).toBe('fatura.pdf')
        expect(primeiroNomeArquivoUtil(undefined, null)).toBeNull()
    })
})

describe('isFilenameFallbackPorId', () => {
    it('reconhece o fallback anexo-{id}', () => {
        expect(isFilenameFallbackPorId('anexo-42')).toBe(true)
        expect(isFilenameFallbackPorId('fatura-nubank-agosto.pdf')).toBe(false)
    })
})
