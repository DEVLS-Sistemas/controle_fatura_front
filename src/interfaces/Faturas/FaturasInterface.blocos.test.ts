import {
    extractFaturaConferencia,
    extractFaturaGrupos,
    extractFaturaQuitacao,
} from './FaturasInterface'

describe('blocos progressivos da fatura', () => {
    it('lê grupos, quitação e conferência no corpo ou em data', () => {
        expect(extractFaturaGrupos({
            grupos_por_cartao: [{ label: '•••• 1234', total_transacoes: 1 }],
        })?.grupos_por_cartao).toHaveLength(1)

        expect(extractFaturaQuitacao({
            pago: false,
            valor_pago: 0,
            valor_restante: 80,
        })?.valor_restante).toBe(80)

        expect(extractFaturaConferencia({
            data: {
                valor_extrato: 80,
                valor_total_com_pendencias: 80,
                tem_compras_nao_conciliadas: false,
                conferencia: { bate: true, valor_cabecalho: 80 },
            },
        })?.conferencia?.bate).toBe(true)
    })
})
