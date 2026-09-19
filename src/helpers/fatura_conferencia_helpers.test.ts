import {
    conferenciaFaturaDiverge,
    valoresConferenciaFatura,
} from './fatura_conferencia_helpers'

describe('conferenciaFaturaDiverge', () => {
    it('só avisa quando a API manda bate false', () => {
        expect(conferenciaFaturaDiverge(null)).toBe(false)
        expect(conferenciaFaturaDiverge(undefined)).toBe(false)
        expect(conferenciaFaturaDiverge({
            valor_cabecalho: 2288.25,
            soma_transacoes: 2288.25,
            bate: true,
            diferenca: 0,
        })).toBe(false)
        expect(conferenciaFaturaDiverge({
            valor_cabecalho: 2288.25,
            soma_transacoes: 2150.68,
            bate: false,
            diferenca: 137.57,
        })).toBe(true)
    })

    it('não inventa divergência quando conferencia não veio', () => {
        expect(conferenciaFaturaDiverge({})).toBe(false)
        expect(conferenciaFaturaDiverge({
            valor_cabecalho: 2288.25,
            soma_transacoes: 2150.68,
        })).toBe(false)
    })
})

describe('valoresConferenciaFatura', () => {
    it('expõe cabeçalho, soma e diferença do caso 738', () => {
        expect(valoresConferenciaFatura({
            valor_cabecalho: 2288.25,
            soma_transacoes: 2150.68,
            bate: false,
            diferenca: 137.57,
        })).toEqual({
            valorCabecalho: 2288.25,
            somaTransacoes: 2150.68,
            diferenca: 137.57,
        })
    })

    it('não devolve valores se bate não for false', () => {
        expect(valoresConferenciaFatura({
            valor_cabecalho: 2288.25,
            soma_transacoes: 2288.25,
            bate: true,
            diferenca: 0,
        })).toBeNull()
        expect(valoresConferenciaFatura(null)).toBeNull()
    })
})
