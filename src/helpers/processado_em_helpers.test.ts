jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: () => ({
            interceptors: {
                request: { use: () => undefined },
                response: { use: () => undefined },
            },
        }),
    },
}))

import { formatProcessadoEm } from 'helpers/fatura_helpers'

describe('formatProcessadoEm', () => {
    it('mostra dia, mês, ano e hora em UTC, sem segundos', () => {
        expect(formatProcessadoEm('2026-09-22T22:32:28.000000Z')).toBe('22/09/2026 22:32')
    })

    it('não fatia o ISO no hífen', () => {
        expect(formatProcessadoEm('2026-09-22T22:32:28.000000Z')).not.toContain('T')
        expect(formatProcessadoEm('2026-09-22T22:32:28.000000Z')).not.toContain('Z')
    })

    it('fatura ainda não processada não gera data', () => {
        expect(formatProcessadoEm(null)).toBe('')
        expect(formatProcessadoEm(undefined)).toBe('')
        expect(formatProcessadoEm('')).toBe('')
    })
})
