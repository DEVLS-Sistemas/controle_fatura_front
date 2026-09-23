import {
    AplicarSubcategoriaPergunta,
    parseAplicarSubcategoria,
    textoAplicarSubcategoria,
} from './aplicar_subcategoria_helpers'

const pergunta: AplicarSubcategoriaPergunta = {
    perguntar: true,
    estabelecimento_id: 104,
    estabelecimento_nome: 'Shopee',
    linhas_nesta_fatura: 2,
    parcelas_outras_faturas: 3,
    somente_categoria: false,
}

describe('aplicar subcategoria do estabelecimento', () => {
    it('abre a pergunta só quando perguntar é true e há outra linha nesta fatura', () => {
        expect(parseAplicarSubcategoria({
            transacao: {
                status: true,
                message: 'Transação alterada com sucesso!',
                aplicar_subcategoria: pergunta,
            },
        })).toEqual(pergunta)

        expect(parseAplicarSubcategoria({ status: true })).toBeNull()
        expect(parseAplicarSubcategoria({ aplicar_subcategoria: pergunta })).toBeNull()
        expect(parseAplicarSubcategoria({
            transacao: { aplicar_subcategoria: { ...pergunta, perguntar: false } },
        })).toBeNull()
        expect(parseAplicarSubcategoria({
            transacao: { aplicar_subcategoria: { ...pergunta, linhas_nesta_fatura: 0 } },
        })).toBeNull()
        expect(parseAplicarSubcategoria({
            transacao: { aplicar_subcategoria: { ...pergunta, somente_categoria: true } },
        })?.somente_categoria).toBe(true)
    })

    it('mostra as duas contagens e omite outras faturas quando não há parcela fora', () => {
        expect(textoAplicarSubcategoria(pergunta)).toBe(
            'Aplicar a mesma subcategoria nas outras 2 compras de Shopee nesta fatura? As 3 parcelas desta compra nas outras faturas também recebem essa categoria e subcategoria.',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            linhas_nesta_fatura: 1,
            parcelas_outras_faturas: 0,
        })).toBe(
            'Aplicar a mesma subcategoria na outra compra de Shopee nesta fatura?',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            somente_categoria: true,
        })).toBe(
            'Aplicar a mesma categoria nas outras 2 compras de Shopee nesta fatura? As 3 parcelas desta compra nas outras faturas também recebem essa categoria.',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            somente_categoria: true,
            parcelas_outras_faturas: 0,
        })).toBe(
            'Aplicar a mesma categoria nas outras 2 compras de Shopee nesta fatura?',
        )
    })
})
