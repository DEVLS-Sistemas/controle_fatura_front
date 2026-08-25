import {
  DASHBOARD_ANO_TODO,
  buildDashboardResumoParams,
  persistDashboardFiltro,
  resolveDashboardFiltro,
} from './dashboard_resumo_helpers'

describe('resolveDashboardFiltro', () => {
  const now = new Date(2026, 7, 24)

  beforeEach(() => {
    localStorage.clear()
  })

  it('usa intervalo da query', () => {
    persistDashboardFiltro({ ano: 2025, mes_inicio: 1, mes_fim: 1 })
    const filtro = resolveDashboardFiltro(
      new URLSearchParams('ano=2026&mes_inicio=3&mes_fim=6'),
      now
    )
    expect(filtro).toEqual({ ano: 2026, mes_inicio: 3, mes_fim: 6 })
  })

  it('usa mês específico da query', () => {
    const filtro = resolveDashboardFiltro(new URLSearchParams('ano=2026&mes=7'), now)
    expect(filtro).toEqual({ ano: 2026, mes_inicio: 7, mes_fim: 7 })
  })

  it('query só com ano é ano todo', () => {
    const filtro = resolveDashboardFiltro(new URLSearchParams('ano=2026'), now)
    expect(filtro).toEqual({ ano: 2026, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null })
  })

  it('usa o storage quando não há query', () => {
    persistDashboardFiltro({ ano: 2025, mes_inicio: 2, mes_fim: 4 })
    const filtro = resolveDashboardFiltro(new URLSearchParams(), now)
    expect(filtro).toEqual({ ano: 2025, mes_inicio: 2, mes_fim: 4 })
  })

  it('cai no mês corrente sem query e sem storage', () => {
    const filtro = resolveDashboardFiltro(new URLSearchParams(), now)
    expect(filtro).toEqual({ ano: 2026, mes_inicio: 8, mes_fim: 8 })
  })
})

describe('buildDashboardResumoParams', () => {
  it('ano todo omite mes', () => {
    expect(buildDashboardResumoParams({ ano: 2026, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null })).toEqual({
      ano: 2026,
    })
  })

  it('mês específico envia mes', () => {
    expect(buildDashboardResumoParams({ ano: 2026, mes_inicio: 7, mes_fim: 7 })).toEqual({
      ano: 2026,
      mes: 7,
    })
  })

  it('intervalo envia mes_inicio e mes_fim', () => {
    expect(buildDashboardResumoParams({ ano: 2026, mes_inicio: 3, mes_fim: 6 })).toEqual({
      ano: 2026,
      mes_inicio: 3,
      mes_fim: 6,
    })
  })

  it('janeiro a dezembro vira só ano', () => {
    expect(buildDashboardResumoParams({ ano: 2026, mes_inicio: 1, mes_fim: 12 })).toEqual({
      ano: 2026,
    })
  })
})
