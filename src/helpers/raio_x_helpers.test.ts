import {
  RAIO_X_ANO_STORAGE_KEY,
  RAIO_X_MES_STORAGE_KEY,
} from 'interfaces/RaioX/RaioXInterface'
import {
  atalhoToPath,
  buildRaioXMock,
  formatRendaPayload,
  isMesFuturo,
  labelCompetenciaExtenso,
  nivelUi,
  parseRendaMensal,
  persistRaioXCompetencia,
  resolveRaioXEmpty,
  resolveRaioXSearch,
} from './raio_x_helpers'

describe('resolveRaioXSearch', () => {
  const now = new Date(2026, 7, 24)

  beforeEach(() => {
    localStorage.clear()
  })

  it('usa mes/ano da query no deep-link', () => {
    persistRaioXCompetencia(3, 2025)
    const search = resolveRaioXSearch(new URLSearchParams('mes=8&ano=2026'), now)
    expect(search).toEqual({ mes: 8, ano: 2026, responsavel_id: null })
  })

  it('usa o storage quando não há query', () => {
    persistRaioXCompetencia(1, 2025)
    const search = resolveRaioXSearch(new URLSearchParams(), now)
    expect(search.mes).toBe(1)
    expect(search.ano).toBe(2025)
  })

  it('cai no mês corrente sem query e sem storage', () => {
    const search = resolveRaioXSearch(new URLSearchParams(), now)
    expect(search.mes).toBe(8)
    expect(search.ano).toBe(2026)
  })

  it('lê responsavel_id da query', () => {
    const search = resolveRaioXSearch(new URLSearchParams('mes=8&ano=2026&responsavel_id=12'), now)
    expect(search.responsavel_id).toBe(12)
  })
})

describe('atalhoToPath', () => {
  it('mapeia rotas conhecidas', () => {
    expect(atalhoToPath({ rota: 'faturas', query: { mes: 8, ano: 2026 } })).toBe('/faturas?mes=8&ano=2026')
    expect(atalhoToPath({ rota: 'parceladas', query: { mes: 8, ano: 2026 } })).toBe(
      '/parceladas?mes=8&ano=2026'
    )
    expect(atalhoToPath({ rota: 'projecao', query: { mes: 8, ano: 2026 } })).toBe(
      '/projecao-faturas?mes=8&ano=2026'
    )
    expect(atalhoToPath({ rota: 'simulador' })).toBe('/simulador')
    expect(atalhoToPath({ rota: 'gastos-criticos' })).toBe('/gastos-criticos')
    expect(atalhoToPath({ rota: 'assinaturas' })).toBe('/assinaturas')
    expect(atalhoToPath({ rota: 'perfil' })).toBe('/pages-profile-settings')
  })

  it('ignora rota desconhecida', () => {
    expect(atalhoToPath({ rota: 'desconhecida' })).toBeNull()
  })
})

describe('nivelUi', () => {
  it('mantém a paleta verde / âmbar / vermelho / cinza', () => {
    expect(nivelUi('positivo').emoji).toBe('🟢')
    expect(nivelUi('atencao').emoji).toBe('🟡')
    expect(nivelUi('alerta').emoji).toBe('🔴')
    expect(nivelUi('incompleto').emoji).toBe('⚪')
  })
})

describe('formatRendaPayload / parseRendaMensal', () => {
  it('formata BRL e rejeita zero', () => {
    expect(formatRendaPayload('11400,00')).toBe('11.400,00')
    expect(formatRendaPayload('11.400,00')).toBe('11.400,00')
    expect(formatRendaPayload('0,00')).toBeNull()
    expect(formatRendaPayload('')).toBeNull()
  })

  it('parseia número e string BR', () => {
    expect(parseRendaMensal(11400)).toBe(11400)
    expect(parseRendaMensal('11.400,00')).toBe(11400)
    expect(parseRendaMensal(0)).toBeNull()
  })
})

describe('buildRaioXMock', () => {
  const now = new Date(2026, 7, 24)

  it('entrega as frases da referência sem recalcular', () => {
    const data = buildRaioXMock({ mes: 8, ano: 2026, rendaInformada: true, now })
    expect(data.referencia.label_curto).toBe('Seu mês')
    expect(data.referencia.label).toBe('Agosto 2026')
    expect(data.sinais.map((s) => s.frase)).toEqual([
      'Pagamentos em dia',
      'Faturas cresceram 18%',
      '74% da sua renda já está comprometida',
    ])
    expect(data.diagnostico?.titulo).toBe('Principal problema: compras parceladas.')
    expect(data.diagnostico?.frase).toBe(
      'Você possui R$ 8.420 em parcelas futuras, distribuídas em 23 compras.'
    )
    expect(data.diagnostico?.projecao).toBe(
      'Se não realizar novas compras parceladas, seu comprometimento deve cair para 51% em janeiro.'
    )
  })

  it('sem renda: 3º sinal incompleto e sem projeção em %', () => {
    const data = buildRaioXMock({ mes: 8, ano: 2026, rendaInformada: false, now })
    expect(data.renda.informada).toBe(false)
    expect(data.sinais[2].nivel).toBe('incompleto')
    expect(data.sinais[2].frase).toBe('Informe sua renda para ver o comprometimento')
    expect(data.diagnostico?.frase).toContain('R$ 8.420')
    expect(data.diagnostico?.projecao).toBeNull()
  })

  it('mês futuro não inventa diagnóstico', () => {
    const data = buildRaioXMock({ mes: 10, ano: 2026, now })
    expect(isMesFuturo(10, 2026, now)).toBe(true)
    expect(data.diagnostico).toBeNull()
    expect(resolveRaioXEmpty(data, 10, 2026, now)).toBe('mes_futuro')
  })
})

describe('labelCompetenciaExtenso', () => {
  it('usa o mês por extenso', () => {
    expect(labelCompetenciaExtenso(8, 2026)).toBe('Agosto 2026')
  })
})

describe('storage keys', () => {
  it('grava raio_x_mes / raio_x_ano', () => {
    persistRaioXCompetencia(8, 2026)
    expect(localStorage.getItem(RAIO_X_MES_STORAGE_KEY)).toBe('8')
    expect(localStorage.getItem(RAIO_X_ANO_STORAGE_KEY)).toBe('2026')
  })
})
