import { GASTOS_POR_CATEGORIA_MESES_STORAGE_KEY } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import {
  atalhoSemCategoria,
  atalhoToPath,
  barraPercentual,
  buildGastosPorCategoriaSearchParams,
  cleanGastosPorCategoriaParams,
  deveAvisarSemCategoria,
  isOrigemValida,
  origemCor,
  persistGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSearch,
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
    persistGastosPorCategoriaSearch({ meses: 12 })
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('mes=8&ano=2026'))
    expect(search).toMatchObject({
      meses: null,
      mes: 8,
      ano: 2026,
    })
  })

  it('usa o storage quando não há query', () => {
    persistGastosPorCategoriaSearch({ meses: 1 })
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams())
    expect(search.meses).toBe(1)
  })

  it('cai em 3 meses sem query e sem storage', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams())
    expect(search.meses).toBe(3)
  })

  it('lê filtros da query', () => {
    const search = resolveGastosPorCategoriaSearch(
      new URLSearchParams('meses=3&cartao_id=4&responsavel_id=9&categoria_id=2&origem_compra=COMPRAS_ONLINE')
    )
    expect(search.cartao_id).toBe(4)
    expect(search.responsavel_id).toBe(9)
    expect(search.categoria_id).toBe(2)
    expect(search.origem_compra).toBe('COMPRAS_ONLINE')
  })

  it('ignora origem_compra inválida', () => {
    const search = resolveGastosPorCategoriaSearch(new URLSearchParams('origem_compra=PIX'))
    expect(search.origem_compra).toBeNull()
  })
})

describe('buildGastosPorCategoriaSearchParams / cleanGastosPorCategoriaParams', () => {
  it('não mistura meses com mes+ano', () => {
    const params = buildGastosPorCategoriaSearchParams({
      meses: 3,
      mes: 8,
      ano: 2026,
    })
    expect(params.get('mes')).toBe('8')
    expect(params.get('ano')).toBe('2026')
    expect(params.get('meses')).toBeNull()

    expect(
      cleanGastosPorCategoriaParams({
        meses: 3,
        mes: 8,
        ano: 2026,
      })
    ).toEqual({ mes: 8, ano: 2026 })
  })

  it('envia meses quando não há calendário', () => {
    expect(cleanGastosPorCategoriaParams({ meses: 6 })).toEqual({ meses: 6 })
    expect(buildGastosPorCategoriaSearchParams({ meses: 6 }).get('meses')).toBe('6')
  })

  it('inclui origem e categoria no payload', () => {
    expect(
      cleanGastosPorCategoriaParams({
        meses: 3,
        categoria_id: 2,
        origem_compra: 'COMPRAS_PRESENCIAL',
      })
    ).toEqual({
      meses: 3,
      categoria_id: 2,
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
