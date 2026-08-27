import {
  contaNoTotalLinha,
  dataCaiForaDaFaturaAberta,
  faturaAbertaDoSource,
  faturaIdDaCompra,
  identificadorAposCadastro,
  isCompraManual,
  mensagemAposCadastro,
  origemLancamentoCompra,
  pathVisualizacaoCompra,
  pathVisualizacaoDaLinha,
  precisaConciliarCompra,
  temSugestaoConciliacao,
  tituloLinhaFatura,
  tituloListagemCompra,
  valorContaNoTotal,
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
  it('usa observacoes como título e estabelecimento em traço', () => {
    expect(tituloListagemCompra({
      observacoes: 'Mouse Logitech',
      descricao: 'Mouse Logitech',
    })).toEqual({
      titulo: 'Mouse Logitech',
      subtitulo: 'Estabelecimento —',
    })
  })

  it('mostra o estabelecimento só depois da conciliação', () => {
    expect(tituloListagemCompra({
      texto_compra: 'Mouse Logitech',
      observacoes: 'Mouse Logitech',
      estabelecimento_nome: 'PAG*LOJA XYZ',
    })).toEqual({
      titulo: 'Mouse Logitech',
      subtitulo: 'Estabelecimento PAG*LOJA XYZ',
    })
  })

  it('cai no estabelecimento quando não há texto da compra', () => {
    expect(tituloListagemCompra({
      estabelecimento_nome: 'Magazine',
      loja_nome: 'Magazine Luiza',
    })).toEqual({
      titulo: 'Magazine',
      subtitulo: 'Magazine Luiza',
    })
  })
})

describe('tituloLinhaFatura', () => {
  it('na compra manual usa o texto da compra', () => {
    expect(tituloLinhaFatura({
      compra_manual: true,
      precisa_conciliar: true,
      observacoes: 'Mouse Logitech',
    })).toEqual({
      titulo: 'Mouse Logitech',
      subtitulo: 'Estabelecimento —',
    })
  })

  it('no lançamento do PDF usa o estabelecimento e a compra manual no subtítulo', () => {
    expect(tituloLinhaFatura({
      estabelecimento_nome: 'PAG*LOJA XYZ',
      compra_manual_vinculada: { texto_compra: 'Mouse Logitech' },
    })).toEqual({
      titulo: 'PAG*LOJA XYZ',
      subtitulo: 'Mouse Logitech',
    })
  })

  it('parcela automática na fatura vizinha não usa o layout de compra manual', () => {
    expect(tituloLinhaFatura({
      compra_manual: false,
      precisa_conciliar: false,
      estabelecimento_nome: 'PAG*LOJA XYZ',
      observacoes: 'PAG*LOJA XYZ',
    })).toEqual({
      titulo: 'PAG*LOJA XYZ',
      subtitulo: null,
    })
  })
})

describe('contaNoTotalLinha / temSugestaoConciliacao', () => {
  it('não conta no total quando a API marca conta_no_total false', () => {
    expect(contaNoTotalLinha({ conta_no_total: false })).toBe(false)
    expect(valorContaNoTotal({ conta_no_total: false, valor: 249.9 })).toBe(0)
    expect(valorContaNoTotal({ valor: 249.9 })).toBe(249.9)
  })

  it('reconhece sugestão no lançamento do PDF, não na compra manual', () => {
    expect(temSugestaoConciliacao({
      tem_sugestao_conciliacao: true,
      sugestao_conciliacao_label: 'Pode ser a compra manual «Mouse Logitech»',
    })).toBe(true)
    expect(temSugestaoConciliacao({
      compra_manual: true,
      precisa_conciliar: true,
      tem_sugestao_conciliacao: true,
    })).toBe(false)
  })
})

describe('compra_manual / precisaConciliarCompra', () => {
  it('compra cadastrada pelo usuário (Nova compra ou Posso comprar) pede conciliação', () => {
    expect(isCompraManual({ compra_manual: true })).toBe(true)
    expect(precisaConciliarCompra({
      compra_manual: true,
      precisa_conciliar: true,
      status_conciliacao: 'nao_conciliada',
    })).toBe(true)
    expect(precisaConciliarCompra({
      compra_manual: true,
      status_conciliacao: 'nao_conciliada',
    })).toBe(true)
  })

  it('parcela automática em fatura vizinha (sem PDF) não pede conciliar', () => {
    const parcelaAutomatica = {
      compra_manual: false,
      importada_pdf: false,
      precisa_conciliar: false,
      status_conciliacao: 'nao_conciliada',
    }
    expect(isCompraManual(parcelaAutomatica)).toBe(false)
    expect(precisaConciliarCompra(parcelaAutomatica)).toBe(false)
    expect(origemLancamentoCompra(parcelaAutomatica)).toEqual({
      tipo: 'automatica',
      label: 'Gerada automaticamente',
      icon: 'ri-repeat-line',
      tone: 'secondary',
    })
  })

  it('não infere cadastro manual só porque importada_pdf é false', () => {
    expect(precisaConciliarCompra({
      importada_pdf: false,
      status_conciliacao: 'nao_conciliada',
    })).toBe(false)
    expect(origemLancamentoCompra({ importada_pdf: false })).toBeNull()
  })

  it('mesmo com precisa_conciliar true, parcela automática não fica em evidência', () => {
    expect(precisaConciliarCompra({
      compra_manual: false,
      precisa_conciliar: true,
      status_conciliacao: 'nao_conciliada',
    })).toBe(false)
  })

  it('linha importada do PDF não pede conciliar e mostra origem da fatura', () => {
    expect(precisaConciliarCompra({
      compra_manual: false,
      importada_pdf: true,
    })).toBe(false)
    expect(origemLancamentoCompra({
      compra_manual: false,
      importada_pdf: true,
    })?.tipo).toBe('pdf')
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
