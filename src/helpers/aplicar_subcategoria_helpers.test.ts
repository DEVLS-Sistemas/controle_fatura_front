import {
    AplicarSubcategoriaPergunta,
    ehAssinaturaDaResposta,
    parcelaDoGrupoRecebeClassificacao,
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
    it('abre a pergunta quando perguntar é true, mesmo sem outra linha nesta fatura', () => {
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
        })).toEqual({ ...pergunta, linhas_nesta_fatura: 0 })
        expect(parseAplicarSubcategoria({
            transacao: { aplicar_subcategoria: { ...pergunta, somente_categoria: true } },
        })?.somente_categoria).toBe(true)
    })

    it('mostra as duas contagens e omite a frase que não tem compra', () => {
        expect(textoAplicarSubcategoria(pergunta)).toBe(
            'Aplicar a mesma subcategoria nas outras 2 compras de Shopee nesta fatura? As 3 compras deste estabelecimento nas outras faturas, inclusive à vista, também recebem essa categoria e subcategoria.',
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
            linhas_nesta_fatura: 0,
        })).toBe(
            'As 3 compras de Shopee nas outras faturas, inclusive à vista, também recebem essa categoria e subcategoria.',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            somente_categoria: true,
        })).toBe(
            'Aplicar a mesma categoria nas outras 2 compras de Shopee nesta fatura? As 3 compras deste estabelecimento nas outras faturas, inclusive à vista, também recebem essa categoria.',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            somente_categoria: true,
            parcelas_outras_faturas: 0,
        })).toBe(
            'Aplicar a mesma categoria nas outras 2 compras de Shopee nesta fatura?',
        )
        expect(textoAplicarSubcategoria({
            ...pergunta,
            somente_categoria: true,
            linhas_nesta_fatura: 0,
            parcelas_outras_faturas: 1,
        })).toBe(
            'A compra de Shopee na outra fatura, inclusive à vista, também recebe essa categoria.',
        )
    })

    it('marca a assinatura com o valor devolvido na à vista', () => {
        expect(ehAssinaturaDaResposta({
            transacao: { data: { eh_assinatura: true } },
        })).toBe(true)
        expect(ehAssinaturaDaResposta({
            transacao: { data: { eh_assinatura: 1 } },
        })).toBe(true)
        expect(ehAssinaturaDaResposta({
            transacao: { data: { eh_assinatura: false } },
        })).toBe(false)
        expect(ehAssinaturaDaResposta({ transacao: { status: true } })).toBeNull()
    })

    it('copia a classificação só para parcela da mesma compra ainda sem ela', () => {
        const editada = { id: 10, compra_grupo_id: 'grupo-1' }
        expect(parcelaDoGrupoRecebeClassificacao(
            { id: 11, compra_grupo_id: 'grupo-1', subcategoria_id: null },
            editada,
            { categoria_id: 4, subcategoria_id: 9 },
        )).toBe(true)
        expect(parcelaDoGrupoRecebeClassificacao(
            { id: 11, compra_grupo_id: 'grupo-1', subcategoria_id: 3 },
            editada,
            { categoria_id: 4, subcategoria_id: 9 },
        )).toBe(false)
        expect(parcelaDoGrupoRecebeClassificacao(
            { id: 11, compra_grupo_id: 'grupo-1', categoria_id: null },
            editada,
            { categoria_id: 4, subcategoria_id: null },
        )).toBe(true)
        expect(parcelaDoGrupoRecebeClassificacao(
            { id: 11, compra_grupo_id: 'grupo-1', categoria_id: 2 },
            editada,
            { categoria_id: 4, subcategoria_id: null },
        )).toBe(false)
        expect(parcelaDoGrupoRecebeClassificacao(
            { id: 12, compra_grupo_id: 'outro' },
            editada,
            { categoria_id: 4, subcategoria_id: 9 },
        )).toBe(false)
    })
})
