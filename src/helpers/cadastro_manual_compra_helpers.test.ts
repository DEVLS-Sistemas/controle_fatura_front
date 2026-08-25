import {
  dataCaiForaDaFaturaAberta,
  faturaAbertaDoSource,
  faturaIdDaCompra,
  identificadorAposCadastro,
  mensagemAposCadastro,
  pathVisualizacaoCompra,
  pathVisualizacaoDaLinha,
  tituloListagemCompra,
} from './cadastro_manual_compra_helpers'

describe('identificadorAposCadastro', () => {
  it('usa compra_grupo_id quando a compra é parcelada', () => {
    expect(identificadorAposCadastro({
      transacao: {
        data: {
          compra_grupo_id: 'uuid-grupo',
          transacoes: [{ id: 101 }],
        },
        status: true,
      },
    })).toBe('uuid-grupo')
  })

  it('usa o id da primeira transação quando é à vista', () => {
    expect(identificadorAposCadastro({
      transacao: {
        data: {
          compra_grupo_id: null,
          transacoes: [{ id: 55, parcela_atual: 1 }],
        },
      },
    })).toBe('55')
  })

  it('aceita envelope mais raso', () => {
    expect(identificadorAposCadastro({ data: { id: 9 } })).toBe('9')
    expect(identificadorAposCadastro({ id: 3 })).toBe('3')
  })

  it('ignora grupo vazio', () => {
    expect(identificadorAposCadastro({
      transacao: { data: { compra_grupo_id: '', transacoes: [{ id: 1 }] } },
    })).toBe('1')
  })
})

describe('mensagemAposCadastro', () => {
  it('lê message do envelope da API', () => {
    expect(mensagemAposCadastro({
      transacao: { message: 'Compra parcelada cadastrada com sucesso!' },
    }, 'fallback')).toBe('Compra parcelada cadastrada com sucesso!')
  })

  it('usa fallback quando não houver message', () => {
    expect(mensagemAposCadastro({}, 'Cadastrou')).toBe('Cadastrou')
  })
})

describe('pathVisualizacaoCompra', () => {
  it('monta a rota e a query de competência', () => {
    expect(pathVisualizacaoCompra('abc')).toBe('/compras/abc')
    expect(pathVisualizacaoCompra('abc', 8, 2026)).toBe('/compras/abc?mes=8&ano=2026')
  })

  it('prefere o grupo da linha', () => {
    expect(pathVisualizacaoDaLinha({ id: 10, compra_grupo_id: 'g1' })).toBe('/compras/g1')
    expect(pathVisualizacaoDaLinha({ id: 10 })).toBe('/compras/10')
  })
})

describe('tituloListagemCompra', () => {
  it('usa observações como título e estabelecimento como subtítulo', () => {
    expect(tituloListagemCompra({
      observacoes: 'Mouse Logitech',
      estabelecimento_nome: 'PAG*LOJA XYZ',
      loja_nome: 'Magazine',
    })).toEqual({
      titulo: 'Mouse Logitech',
      subtitulo: 'PAG*LOJA XYZ · Magazine',
    })
  })

  it('cai no estabelecimento quando não há descrição', () => {
    expect(tituloListagemCompra({
      estabelecimento_nome: 'Magazine',
      loja_nome: 'Magazine Luiza',
    })).toEqual({
      titulo: 'Magazine',
      subtitulo: 'Magazine Luiza',
    })
  })
})

describe('dataCaiForaDaFaturaAberta', () => {
  it('avisa quando a data cai em outra competência', () => {
    expect(dataCaiForaDaFaturaAberta(
      { mes: 9, ano: 2026 },
      { mes: 8, ano: 2026 },
    )).toBe(true)
    expect(dataCaiForaDaFaturaAberta(
      { mes: 8, ano: 2026 },
      { mes: 8, ano: 2026 },
    )).toBe(false)
  })
})

describe('faturaAbertaDoSource / faturaIdDaCompra', () => {
  it('lê mes/ano da fatura de origem', () => {
    expect(faturaAbertaDoSource({ fatura_mes: 8, fatura_ano: 2026 })).toEqual({ mes: 8, ano: 2026 })
  })

  it('escolhe a fatura da competência atual', () => {
    expect(faturaIdDaCompra({
      competencia_atual: { parcela_atual: 2, mes: 9, ano: 2026, valor: 200, fatura_id: 88 },
      primeira_parcela: { parcela_atual: 1, mes: 8, ano: 2026, valor: 200, fatura_id: 80 },
    })).toBe(88)
  })
})
