import { textoRodape } from './footerTexto'

describe('textoRodape', () => {
    it('mostra fantasia sem versão quando a API ainda não respondeu', () => {
        expect(textoRodape(2026)).toBe('2026 © Devls Sistemas')
        expect(textoRodape(2026, null)).toBe('2026 © Devls Sistemas')
    })

    it('acrescenta a versão da API', () => {
        expect(textoRodape(2026, '1.0.0')).toBe('2026 © Devls Sistemas · v1.0.0')
    })
})
