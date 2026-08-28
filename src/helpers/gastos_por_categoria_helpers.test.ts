import { GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import { GastosPorCategoriaSelecaoVazia } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import {
  aplicarCliqueCategoria,
  aplicarCliqueSubcategoria,
  atalhoSemCategoria,
  atalhoToPath,
  barraPercentual,
  barrasCategoria,
  barrasSubcategoria,
  comFatiaOutros,
  coresFatiasCategoria,
  coresFatiasSubcategoria,
  fatiasCategoria,
  fatiasSubcategoria,
  percentualFatia,
  buildGastosPorCategoriaSearchParams,
  buildPageSearchParams,
  centroValorOrigem,
  cleanGastosPorCategoriaParams,
  coresFatiasOrigem,
  deveAvisarSemCategoria,
  fatiasOrigem,
  isOrigemValida,
  origemCor,
  persistGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSelecao,
  resolveKpis,
  resolvePorOrigemSelecao,
  resolverMesAnoCalendario,
  rotuloAnoCalendario,
  rotuloJanelaMeses,
  rotuloPeriodoFiltro,
  tituloOrigem,
} from './gastos_por_categoria_helpers'

describe('resolveGastosPorCategoriaSearch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('usa meses da query', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('meses=6'))
    expect(search.meses).toBe(6)
    expect(search.mes).toBeNull()
    expect(search.ano).toBeNull()
  })

  it('usa mes/ano da query e não envia meses', () => {
    persistGastosPorCategoriaSearch({ meses: 6 })
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('mes=8&ano=2026'))
    expect(search).toMatchObject({
      meses: null,
      mes: 8,
      ano: 2026,
      mes_inicio: 8,
      mes_fim: 8,
    })
  })

  it('lê ano calendário jan–dez', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('ano=2026&mes_inicio=all'))
    expect(search).toMatchObject({
      meses: null,
      ano: 2026,
      mes_inicio: 'all',
    })
  })

  it('usa o storage quando não há query', () => {
    persistGastosPorCategoriaSearch({ meses: 1 })
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams())
    expect(search.meses).toBe(1)
  })

  it('converte meses=12 antigo para o ano calendário', () => {
    persistGastosPorCategoriaSearch({ meses: 12 })
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams())
    expect(search.meses).toBeNull()
    expect(search.mes_inicio).toBe('all')
    expect(search.ano).toBe(new Date().getFullYear())
  })

  it('cai em 3 meses sem query e sem storage', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams())
    expect(search.meses).toBe(3)
  })

  it('lê filtros da query sem mandar categoria_id para a API', () => {
    const search = resolveGastosPorCategoriaSearch(
      new URLSearchParams('meses=3&cartao_id=4&responsavel_id=9&categoria_id=2&origem_compra=COMPRAS_ONLINE')
    )
    expect(search.cartao_id).toBe(4)
    expect(search.responsavel_id).toBe(9)
    expect(search.categoria_id).toBeNull()
    expect(search.origem_compra).toBe('COMPRAS_ONLINE')
  })

  it('ignora origem_compra inválida', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('origem_compra=PIX'))
    expect(search.origem_compra).toBeNull()
  })
})

describe('resolverMesAnoCalendario', () => {
  const now = new Date(2026, 7, 27)

  it('completa o ano corrente quando só o mês veio', () => {
    expect(resolverMesAnoCalendario(3, '', now)).toEqual({ mes: 3, ano: 2026 })
    expect(resolverMesAnoCalendario(3, null, now)).toEqual({ mes: 3, ano: 2026 })
  })

  it('mantém mes e ano quando os dois vieram', () => {
    expect(resolverMesAnoCalendario(8, 2025, now)).toEqual({ mes: 8, ano: 2025 })
  })

  it('não monta calendário sem mês', () => {
    expect(resolverMesAnoCalendario('', 2026, now)).toBeNull()
    expect(resolverMesAnoCalendario(null, null, now)).toBeNull()
  })
})

describe('rótulos de período', () => {
  const now = new Date(2026, 7, 27)

  it('mostra a janela dos últimos meses a partir do mês atual', () => {
    expect(rotuloJanelaMeses(1, now)).toBe('Ago 2026')
    expect(rotuloJanelaMeses(3, now)).toBe('Jun–Ago 2026')
    expect(rotuloJanelaMeses(6, now)).toBe('Mar–Ago 2026')
  })

  it('cruza o ano quando a janela começa no ano anterior', () => {
    expect(rotuloJanelaMeses(3, new Date(2026, 0, 15))).toBe('Nov 2025–Jan 2026')
  })

  it('explica o ano calendário e o intervalo De–Até', () => {
    expect(rotuloAnoCalendario(2026)).toBe('Jan–Dez 2026')
    expect(rotuloPeriodoFiltro({ ano: 2026, mes_inicio: 'all' })).toEqual({
      titulo: 'Ano 2026',
      detalhe: 'Janeiro a dezembro de 2026 (ano calendário, não os últimos 12 meses)',
    })
    expect(rotuloPeriodoFiltro({ ano: 2026, mes_inicio: 8, mes_fim: 8 })).toEqual({
      titulo: 'Agosto de 2026',
      detalhe: 'Somente Agosto de 2026',
    })
    expect(rotuloPeriodoFiltro({ meses: 3 }, now)).toEqual({
      titulo: 'Jun–Ago 2026',
      detalhe: 'Últimos 3 meses a partir do mês atual para trás',
    })
  })
})

describe('buildGastosPorCategoriaSearchParams / cleanGastosPorCategoriaParams', () => {
  it('não mistura meses com mes+ano', () => {
    const params = buildGastosPorCategoriaSearchParams({
      meses: 3,
      mes: 8,
      ano: 2026,
    })
    expect(params.get('ano')).toBe('2026')
    expect(params.get('mes_inicio')).toBe('8')
    expect(params.get('mes_fim')).toBe('8')
    expect(params.get('meses')).toBeNull()

    expect(
      cleanGastosPorCategoriaParams({
        meses: 3,
        mes: 8,
        ano: 2026,
      })
    ).toEqual({ mes: 8, ano: 2026 })
  })

  it('envia o ano calendário jan–dez como intervalo de datas', () => {
    expect(
      cleanGastosPorCategoriaParams({
        ano: 2026,
        mes_inicio: 'all',
      })
    ).toEqual({
      data_inicio: '2026-01-01',
      data_fim: '2026-12-31',
    })
    const params = buildGastosPorCategoriaSearchParams({
      ano: 2026,
      mes_inicio: 'all',
    })
    expect(params.get('ano')).toBe('2026')
    expect(params.get('mes_inicio')).toBe('all')
    expect(params.get('meses')).toBeNull()
  })

  it('envia intervalo De–Até no mesmo ano', () => {
    expect(
      cleanGastosPorCategoriaParams({
        ano: 2026,
        mes_inicio: 3,
        mes_fim: 8,
      })
    ).toEqual({
      data_inicio: '2026-03-01',
      data_fim: '2026-08-31',
    })
  })

  it('envia meses quando não há calendário', () => {
    expect(cleanGastosPorCategoriaParams({ meses: 6 })).toEqual({ meses: 6 })
    expect(buildGastosPorCategoriaSearchParams({ meses: 6 }).get('meses')).toBe('6')
  })

  it('não envia categoria_id no GET mesmo se vier no estado', () => {
    expect(
      cleanGastosPorCategoriaParams({
        meses: 3,
        categoria_id: 2,
        origem_compra: 'COMPRAS_PRESENCIAL',
      })
    ).toEqual({
      meses: 3,
      origem_compra: 'COMPRAS_PRESENCIAL',
    })
  })
})

describe('atalhoToPath', () => {
  it('monta listagem de compras', () => {
    expect(
      atalhoToPath({
        rota: 'transacoes',
        query: { categoria_id: '2', data_inicio: '2026-05-24', data_fim: '2026-08-24' },
      })
    ).toBe('/transacoes?categoria_id=2&data_inicio=2026-05-24&data_fim=2026-08-24')
  })

  it('ignora rota desconhecida', () => {
    expect(atalhoToPath({ rota: 'categorias' })).toBeNull()
  })
})

describe('avisos e origem', () => {
  it('avisa sem categoria só acima de 20%', () => {
    expect(deveAvisarSemCategoria(20)).toBe(false)
    expect(deveAvisarSemCategoria(20.1)).toBe(true)
    expect(deveAvisarSemCategoria(null)).toBe(false)
  })

  it('reconhece origens da API', () => {
    expect(isOrigemValida('COMPRAS_ONLINE')).toBe(true)
    expect(isOrigemValida(null)).toBe(false)
    expect(origemCor(null)).toBe('#9ca3af')
    expect(origemCor('COMPRAS_ONLINE')).toBe('#3b82f6')
    expect(origemCor('COMPRAS_PRESENCIAL')).toBe('#22c55e')
    expect(origemCor('PAGAMENTO_SERVICOS')).toBe('#f59e0b')
    expect(origemCor('PAGAMENTO_FATURA')).toBe('#8b5cf6')
    expect(origemCor(null, 'sem-origem')).toBe('#9ca3af')
    expect(barraPercentual(156)).toBe(100)
    expect(barraPercentual(-4)).toBe(0)
  })

  it('monta atalho de compras sem categoria pelas datas do período', () => {
    expect(
      atalhoToPath(
        atalhoSemCategoria({
          periodo: { inicio: '2026-05-24', fim: '2026-08-24' },
        })
      )
    ).toBe('/transacoes?data_inicio=2026-05-24&data_fim=2026-08-24')
  })
})

describe('persistência', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('grava meses no localStorage', () => {
    persistGastosPorCategoriaSearch({ meses: 12 })
    expect(localStorage.getItem(GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY)).toBe('12')
  })
})

describe('seleção Power BI', () => {
  const data = {
    dashboards: { limite: 10 },
    totais: { valor_total: 10000, compras: 50, ticket_medio: 200 },
    categorias: [
      {
        chave: 'categoria-2',
        categoria_id: 2,
        nome: 'Alimentação',
        cor: '#f59e0b',
        valor_total: 3200,
        compras: 42,
        ticket_medio: 76.19,
        por_origem: [{ origem_compra: 'COMPRAS_ONLINE', label: 'Compras online', valor_total: 2100 }],
        top_subcategorias: [
          { subcategoria_id: 10, nome: 'Delivery', valor_total: 1800, compras: 20, percentual_da_categoria: 56.3 },
          { subcategoria_id: 11, nome: 'Supermercado', valor_total: 1000, compras: 12, percentual_da_categoria: 31.3 },
        ],
      },
      {
        chave: 'categoria-3',
        categoria_id: 3,
        nome: 'Transporte',
        valor_total: 1500,
        compras: 8,
      },
    ],
    subcategorias: [
      { chave: 'subcategoria-10', subcategoria_id: 10, nome: 'Delivery', categoria_id: 2, valor_total: 1800, compras: 20 },
      { chave: 'subcategoria-11', subcategoria_id: 11, nome: 'Supermercado', categoria_id: 2, valor_total: 1000, compras: 12 },
      { chave: 'subcategoria-20', subcategoria_id: 20, nome: 'Uber', categoria_id: 3, valor_total: 900, compras: 5 },
    ],
    por_origem: [{ origem_compra: 'COMPRAS_PRESENCIAL', label: 'Compras presencial', valor_total: 7000 }],
  }

  it('lê selecao da query e trata categoria_id legado como seleção, não filtro da API', () => {
    expect(resolveGastosPorCategoriaSelecao(new URLSearchParams('selecao_categoria=2&selecao_subcategoria=10'))).toEqual({
      categoria_id: 2,
      categoria_chave: 'categoria-2',
      subcategoria_id: 10,
    })
    expect(resolveGastosPorCategoriaSelecao(new URLSearchParams('categoria_id=2'))).toEqual({
      categoria_id: 2,
      categoria_chave: 'categoria-2',
      subcategoria_id: null,
    })
    expect(resolveGastosPorCategoriaSelecao(new URLSearchParams('selecao_categoria=0')).categoria_chave).toBe(
      'categoria-0'
    )
  })

  it('toggle da categoria limpa tudo; clique em outra troca e zera a sub', () => {
    const alimentacao = data.categorias[0]
    const selecionada = aplicarCliqueCategoria(GastosPorCategoriaSelecaoVazia, alimentacao)
    expect(selecionada).toEqual({
      categoria_id: 2,
      categoria_chave: 'categoria-2',
      subcategoria_id: null,
    })
    expect(aplicarCliqueCategoria(selecionada, alimentacao)).toEqual(GastosPorCategoriaSelecaoVazia)
  })

  it('clique na sub seleciona a pai e toggle só a sub', () => {
    const delivery = data.subcategorias[0]
    const comSub = aplicarCliqueSubcategoria(GastosPorCategoriaSelecaoVazia, delivery)
    expect(comSub).toEqual({
      categoria_id: 2,
      categoria_chave: 'categoria-2',
      subcategoria_id: 10,
    })
    expect(aplicarCliqueSubcategoria(comSub, delivery)).toEqual({
      categoria_id: 2,
      categoria_chave: 'categoria-2',
      subcategoria_id: null,
    })
  })

  it('pizza escrava recorta as subs da categoria clicada sem mudar a pizza mestre', () => {
    const selecao = { categoria_id: 2, categoria_chave: 'categoria-2', subcategoria_id: null }
    expect(fatiasCategoria(data).map((item) => item.categoria_id)).toEqual([2, 3])
    expect(fatiasSubcategoria(data, selecao).map((item) => item.subcategoria_id)).toEqual([10, 11])
    expect(fatiasSubcategoria(data, GastosPorCategoriaSelecaoVazia).map((item) => item.subcategoria_id)).toEqual([
      10, 11, 20,
    ])
    expect(barrasCategoria(data).map((item) => item.categoria_id)).toEqual([2, 3])
    expect(barrasSubcategoria(data, selecao).map((item) => item.subcategoria_id)).toEqual([10, 11])
  })

  it('fecha a pizza com fatia Outros quando passa do limite', () => {
    const itens = Array.from({ length: 12 }, (_, i) => ({
      categoria_id: i + 1,
      nome: `Cat ${i + 1}`,
      valor_total: 100,
      percentual_gasto: 1,
    }))
    const fatias = comFatiaOutros(itens, 10)
    expect(fatias).toHaveLength(11)
    expect(fatias[10].nome).toBe('Outros')
    expect(fatias[10].chave).toBe('outros')
    expect(fatias[10].valor_total).toBe(200)
    expect(fatias[10].cor).toBe('#d1d5db')
  })

  it('pinta categoria com a cor salva, preto no legado, cinza sem categoria e Outros em #d1d5db', () => {
    expect(
      coresFatiasCategoria([
        { categoria_id: 2, cor: '#3b82f6', nome: 'Alimentação' },
        { categoria_id: 3, cor: null, nome: 'Transporte' },
        { categoria_id: null, cor: null, nome: 'Sem categoria' },
        { chave: 'outros', nome: 'Outros' },
      ])
    ).toEqual(['#3b82f6', '#000000', '#9ca3af', '#d1d5db'])
  })

  it('pinta subcategoria com a cor da sub, não clareia de novo a pai', () => {
    expect(
      coresFatiasSubcategoria([
        {
          subcategoria_id: 10,
          nome: 'Delivery',
          cor: '#93c5fd',
          categoria_cor: '#3b82f6',
          categoria_id: 2,
        },
        {
          subcategoria_id: 11,
          nome: 'Supermercado',
          cor: '#60a5fa',
          categoria_cor: '#3b82f6',
          categoria_id: 2,
        },
        { chave: 'outros', nome: 'Outros' },
      ])
    ).toEqual(['#93c5fd', '#60a5fa', '#d1d5db'])
  })

  it('cai na cor da categoria se a sub ainda não tem cor', () => {
    expect(
      coresFatiasSubcategoria([
        { subcategoria_id: 10, cor: null, categoria_cor: '#3b82f6', categoria_id: 2 },
      ])
    ).toEqual(['#3b82f6'])
  })

  it('depois do filtro da categoria a pizza escrava usa o percentual da categoria', () => {
    const sub = {
      percentual_gasto: 14.4,
      percentual_da_categoria: 56.3,
    }
    expect(percentualFatia(sub, false)).toBe(14.4)
    expect(percentualFatia(sub, true)).toBe(56.3)
  })

  it('KPIs e tipos acompanham a seleção', () => {
    const cat = { categoria_id: 2, categoria_chave: 'categoria-2', subcategoria_id: null }
    const sub = { categoria_id: 2, categoria_chave: 'categoria-2', subcategoria_id: 10 }
    expect(resolveKpis(data, GastosPorCategoriaSelecaoVazia)).toMatchObject({
      valor_total: 10000,
      label: 'No período',
    })
    expect(resolveKpis(data, cat)).toMatchObject({ valor_total: 3200, label: 'Em Alimentação' })
    expect(resolveKpis(data, sub)).toMatchObject({ valor_total: 1800, label: 'Em Delivery' })
    expect(resolvePorOrigemSelecao(data, cat)[0].origem_compra).toBe('COMPRAS_ONLINE')
    expect(resolvePorOrigemSelecao(data, sub)[0].origem_compra).toBe('COMPRAS_ONLINE')
    expect(resolvePorOrigemSelecao(data, GastosPorCategoriaSelecaoVazia)[0].origem_compra).toBe('COMPRAS_PRESENCIAL')
    expect(tituloOrigem(null)).toBe('Origem')
    expect(tituloOrigem('Alimentação')).toBe('Origem em Alimentação')
    expect(centroValorOrigem(data, GastosPorCategoriaSelecaoVazia)).toEqual({
      valor: 10000,
      label: 'Total',
    })
    expect(centroValorOrigem(data, sub)).toEqual({
      valor: 3200,
      label: 'Em Alimentação',
    })
    expect(
      fatiasOrigem([
        { origem_compra: 'COMPRAS_ONLINE', valor_total: 10 },
        { origem_compra: 'COMPRAS_PRESENCIAL', valor_total: 0 },
      ])
    ).toEqual([{ origem_compra: 'COMPRAS_ONLINE', valor_total: 10 }])
    expect(coresFatiasOrigem([{ origem_compra: 'COMPRAS_ONLINE', valor_total: 10 }], null)[0]).toBe('#3b82f6')
  })

  it('não coloca categoria_id no GET ao persistir a seleção na URL', () => {
    const params = buildPageSearchParams(
      { meses: 3 },
      { categoria_id: 2, categoria_chave: 'categoria-2', subcategoria_id: 10 }
    )
    expect(params.get('meses')).toBe('3')
    expect(params.get('selecao_categoria')).toBe('2')
    expect(params.get('selecao_subcategoria')).toBe('10')
    expect(params.get('categoria_id')).toBeNull()
  })
})
