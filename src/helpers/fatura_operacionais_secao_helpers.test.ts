import { transacaoFaturaSecaoOperacionais } from './fatura_operacionais_secao_helpers'

describe('seção única Operacionais na fatura', () => {
    it('manda estorno com final para Operacionais', () => {
        expect(transacaoFaturaSecaoOperacionais({
            tipo: 'refund',
            operacional: true,
        })).toBe(true)
    })

    it.each(['payment', 'fee', 'advance', 'carryover'] as const)(
        'manda %s para Operacionais mesmo com cartão',
        (tipo) => {
            expect(transacaoFaturaSecaoOperacionais({ tipo, operacional: true })).toBe(true)
        },
    )

    it('mantém compra no cartão', () => {
        expect(transacaoFaturaSecaoOperacionais({
            tipo: 'purchase',
            operacional: false,
        })).toBe(false)
        expect(transacaoFaturaSecaoOperacionais({
            tipo: 'purchase',
            operacional: true,
        })).toBe(false)
    })

    it('mantém no cartão quando operacional é false', () => {
        expect(transacaoFaturaSecaoOperacionais({
            tipo: 'refund',
            operacional: false,
        })).toBe(false)
    })
})
