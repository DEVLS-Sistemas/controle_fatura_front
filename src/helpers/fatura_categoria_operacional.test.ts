import { linhaFaturaSemCategoria } from './fatura_categoria_operacional_helpers'

describe('linha operacional sem categoria na fatura', () => {
    it.each(['payment', 'refund', 'advance', 'fee', 'carryover'])(
        'esconde categoria quando operacional é %s',
        (tipo) => {
            expect(linhaFaturaSemCategoria({ operacional: true, tipo })).toBe(true)
        },
    )

    it('mantém categoria na compra, inclusive sem cartão', () => {
        expect(linhaFaturaSemCategoria({ operacional: false, tipo: 'purchase' })).toBe(false)
        expect(linhaFaturaSemCategoria({ operacional: true, tipo: 'purchase' })).toBe(false)
        expect(linhaFaturaSemCategoria({ tipo: 'purchase' })).toBe(false)
    })

    it('mantém categoria quando a linha não é operacional', () => {
        expect(linhaFaturaSemCategoria({ operacional: false, tipo: 'payment' })).toBe(false)
        expect(linhaFaturaSemCategoria({ tipo: 'payment' })).toBe(false)
    })
})
