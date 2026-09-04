import {
  RAIO_X_ANO_STORAGE_KEY,
  RAIO_X_MES_STORAGE_KEY,
} from 'interfaces/RaioX/RaioXInterface'
import {
  applyRaioXViewGuards,
  atalhoToPath,
  buildRaioXMock,
  formatRendaPayload,
  isMesFuturo,
  isSinalPagamentosAguardando,
  labelCompetenciaExtenso,
  nivelUi,
  parseRendaMensal,
  persistRaioXCompetencia,
  resolveRaioXDiagnostico,
  resolveRaioXEmpty,
  resolveRaioXSearch,
} from './raio_x_helpers'
import { RaioXView } from 'interfaces/RaioX/RaioXInterface'

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

describe('applyRaioXViewGuards', () => {
  const aguardandoSinal = {
    id: 'pagamentos' as const,
    nivel: 'alerta' as const,
    titulo: 'Aguardando confirmação de pagamentos',
    frase: 'Aguardando confirmação de pagamentos',
    contexto:
      'As faturas de agosto ainda não têm definição de atraso. O pagamento se confirma com o anexo da fatura seguinte ou por operação manual.',
    metricas: {
      atrasadas: 0,
      a_vencer: 0,
      aguardando_confirmacao: 2,
      em_aberto: 2,
      valor_restante: 11078.07,
      valor_atrasado: 0,
      valor_aguardando: 11078.07,
    },
  }

  it('reconhece aguardando confirmação e não trata como atraso', () => {
    expect(isSinalPagamentosAguardando(aguardandoSinal)).toBe(true)
    expect(
      resolveRaioXDiagnostico(
        {
          tipo: 'atraso',
          titulo: 'Principal problema: faturas em atraso.',
          frase: 'Há fatura vencida ainda não quitada.',
        },
        [aguardandoSinal]
      )
    ).toBeNull()
  })

  it('força âmbar e esconde diagnóstico de atraso enquanto só aguarda confirmação', () => {
    const data = applyRaioXViewGuards({
      referencia: { mes: 8, ano: 2026, label: 'Agosto 2026', label_curto: 'Seu mês' },
      renda: { informada: true, valor: 11400, moeda: 'BRL' },
      sinais: [aguardandoSinal],
      diagnostico: {
        tipo: 'atraso',
        titulo: 'Principal problema: faturas em atraso.',
        frase: 'Há fatura vencida ainda não quitada.',
      },
      acoes: [],
    } as RaioXView)

    expect(data.sinais[0].nivel).toBe('atencao')
    expect(data.sinais[0].frase).toBe('Aguardando confirmação de pagamentos')
    expect(data.diagnostico).toBeNull()
  })

  it('mantém alerta quando o atraso está confirmado', () => {
    const confirmado = {
      ...aguardandoSinal,
      nivel: 'alerta' as const,
      titulo: 'Há fatura em atraso',
      frase: 'Há fatura em atraso',
      contexto: 'R$ 7.512 em aberto além do vencimento.',
      metricas: {
        atrasadas: 1,
        a_vencer: 0,
        aguardando_confirmacao: 0,
        em_aberto: 1,
        valor_restante: 7512,
        valor_atrasado: 7512,
        valor_aguardando: 0,
      },
    }
    const data = applyRaioXViewGuards({
      referencia: { mes: 10, ano: 2026, label: 'Outubro 2026', label_curto: 'Seu mês' },
      renda: { informada: true, valor: 11400, moeda: 'BRL' },
      sinais: [confirmado],
      diagnostico: {
        tipo: 'atraso',
        titulo: 'Principal problema: faturas em atraso.',
        frase: 'Há fatura vencida ainda não quitada.',
      },
      acoes: [],
    } as RaioXView)

    expect(isSinalPagamentosAguardando(confirmado)).toBe(false)
    expect(data.sinais[0].nivel).toBe('alerta')
    expect(data.diagnostico?.tipo).toBe('atraso')
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
