import {
  RAIO_X_ANO_STORAGE_KEY,
  RAIO_X_MES_STORAGE_KEY,
  RaioXAtalho,
  RaioXDiagnosticoTipo,
  RaioXNivel,
  RaioXSearch,
  RaioXView,
} from 'interfaces/RaioX/RaioXInterface'

const toCentavos = (value: string | number | null | undefined): number => {
  if (value == null || value === '') return 0
  if (typeof value === 'number') return Math.round(value * 100)
  const str = String(value).trim()
  if (!str) return 0
  if (str.includes(',')) {
    const n = parseFloat(str.replace(/\./g, '').replace(',', '.'))
    return Math.round((Number.isNaN(n) ? 0 : n) * 100)
  }
  if (str.includes('.')) {
    const n = parseFloat(str)
    return Math.round((Number.isNaN(n) ? 0 : n) * 100)
  }
  const digits = str.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

const centavosToBr = (centavos: number): string =>
  (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const MESES_EXTENSO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const SUBTITULO_RAIO_X = 'Uma leitura do mês — não um relatório.'

const currentCompetencia = (now: Date = new Date()): { mes: number; ano: number } => ({
  mes: now.getMonth() + 1,
  ano: now.getFullYear(),
})

export const isMesValido = (mes: unknown): mes is number => {
  const n = Number(mes)
  return Number.isFinite(n) && n >= 1 && n <= 12
}

export const isAnoValido = (ano: unknown): ano is number => {
  const n = Number(ano)
  return Number.isFinite(n) && n > 2000
}

export const competenciaKey = (mes: number, ano: number): number => ano * 12 + mes

export const isMesFuturo = (
  mes: number,
  ano: number,
  now: Date = new Date()
): boolean => competenciaKey(mes, ano) > competenciaKey(now.getMonth() + 1, now.getFullYear())

export const labelCompetenciaExtenso = (mes: number, ano: number): string => {
  const nome = MESES_EXTENSO[mes - 1]
  if (!nome) return `${mes}/${ano}`
  return `${nome} ${ano}`
}

export const parsePositiveId = (value?: string | number | null): number | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const readStoredNumber = (key: string): number | null => {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export const persistRaioXCompetencia = (mes: number, ano: number) => {
  try {
    localStorage.setItem(RAIO_X_MES_STORAGE_KEY, String(mes))
    localStorage.setItem(RAIO_X_ANO_STORAGE_KEY, String(ano))
  } catch {
    // ignore
  }
}

export const resolveRaioXSearch = (
  urlParams?: URLSearchParams | null,
  now: Date = new Date()
): RaioXSearch => {
  const atual = currentCompetencia(now)
  const mesUrl = Number(urlParams?.get('mes'))
  const anoUrl = Number(urlParams?.get('ano'))
  const mesUrlValido = isMesValido(mesUrl)
  const anoUrlValido = isAnoValido(anoUrl)
  const deepLink = mesUrlValido && anoUrlValido

  const mesStored = readStoredNumber(RAIO_X_MES_STORAGE_KEY)
  const anoStored = readStoredNumber(RAIO_X_ANO_STORAGE_KEY)
  const storedValido = isMesValido(mesStored) && isAnoValido(anoStored)

  return {
    mes: deepLink ? mesUrl : storedValido ? Number(mesStored) : atual.mes,
    ano: deepLink ? anoUrl : storedValido ? Number(anoStored) : atual.ano,
    responsavel_id: parsePositiveId(urlParams?.get('responsavel_id')),
  }
}

export type RaioXNivelUi = {
  emoji: string
  color: string
  bg: string
  sr: string
}

export const NIVEL_UI: Record<RaioXNivel, RaioXNivelUi> = {
  positivo: { emoji: '🟢', color: 'var(--bs-success)', bg: 'var(--bs-success-bg-subtle)', sr: 'Positivo' },
  atencao: { emoji: '🟡', color: 'var(--bs-warning)', bg: 'var(--bs-warning-bg-subtle)', sr: 'Atenção' },
  alerta: { emoji: '🔴', color: 'var(--bs-danger)', bg: 'var(--bs-danger-bg-subtle)', sr: 'Alerta' },
  incompleto: { emoji: '⚪', color: 'var(--bs-secondary)', bg: 'var(--bs-secondary-bg-subtle)', sr: 'Incompleto' },
}

export const nivelUi = (nivel?: RaioXNivel | string | null): RaioXNivelUi => {
  if (nivel && nivel in NIVEL_UI) return NIVEL_UI[nivel as RaioXNivel]
  return NIVEL_UI.incompleto
}

export const DIAGNOSTICO_ICONE: Record<string, string> = {
  parceladas: 'ri-list-ordered',
  atraso: 'ri-time-line',
  assinaturas: 'ri-refresh-line',
  crescimento: 'ri-line-chart-line',
  concentracao: 'ri-alarm-warning-line',
  ok: 'ri-checkbox-circle-line',
}

export const diagnosticoIcone = (tipo?: RaioXDiagnosticoTipo | null): string => {
  if (!tipo) return 'ri-pulse-line'
  return DIAGNOSTICO_ICONE[tipo] || 'ri-pulse-line'
}

export const atalhoToPath = (atalho?: RaioXAtalho | null): string | null => {
  if (!atalho?.rota) return null
  const query = new URLSearchParams()
  const raw = atalho.query ?? {}
  Object.entries(raw).forEach(([key, value]) => {
    if (value == null || value === '') return
    query.set(key, String(value))
  })
  const qs = query.toString()
  const suffix = qs ? `?${qs}` : ''

  switch (atalho.rota) {
    case 'faturas':
      return `/faturas${suffix}`
    case 'parceladas':
      return `/parceladas${suffix}`
    case 'projecao':
      return `/projecao-faturas${suffix}`
    case 'simulador':
      return `/simulador${suffix}`
    case 'gastos-criticos':
      return `/gastos-criticos${suffix}`
    case 'assinaturas':
      return `/assinaturas${suffix}`
    case 'perfil':
      return '/pages-profile-settings'
    default:
      return null
  }
}

/** Payload BRL do PUT perfil (`11.400,00`). Não aceita 0. */
export const formatRendaPayload = (value: string | number | null | undefined): string | null => {
  const cents = toCentavos(value)
  if (!Number.isFinite(cents) || cents <= 0) return null
  return centavosToBr(cents)
}

export const parseRendaMensal = (value: unknown): number | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }
  const cents = toCentavos(String(value))
  if (!Number.isFinite(cents) || cents <= 0) return null
  return cents / 100
}

export const rendaToInputValue = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value) || value <= 0) return ''
  return centavosToBr(Math.round(value * 100))
}

export type RaioXEmptyKind = 'mes_futuro' | 'vazio' | null

export const resolveRaioXEmpty = (
  data: RaioXView | undefined,
  mes: number,
  ano: number,
  now: Date = new Date()
): RaioXEmptyKind => {
  if (!data) return null
  if (isMesFuturo(mes, ano, now)) return 'mes_futuro'
  if (data.diagnostico != null) return null
  const sinais = data.sinais ?? []
  const temSinalForte = sinais.some((s) => s.nivel === 'alerta' || s.nivel === 'atencao')
  if (temSinalForte) return null
  return 'vazio'
}

type MockOpts = {
  mes: number
  ano: number
  rendaInformada?: boolean
  rendaValor?: number | null
  now?: Date
}

const atalhoMesAno = (rota: RaioXAtalho['rota'], mes: number, ano: number): RaioXAtalho => ({
  rota,
  query: { mes, ano },
})

/**
 * Contrato da UI enquanto `GET /dashboard/raio-x` não existe.
 * Frases vêm prontas — o front não recalcula %.
 */
export const buildRaioXMock = ({
  mes,
  ano,
  rendaInformada = true,
  rendaValor = 11400,
  now = new Date(),
}: MockOpts): RaioXView => {
  const referencia = {
    mes,
    ano,
    label: labelCompetenciaExtenso(mes, ano),
    label_curto: 'Seu mês',
  }

  if (isMesFuturo(mes, ano, now)) {
    return {
      referencia,
      renda: {
        informada: Boolean(rendaInformada && rendaValor),
        valor: rendaInformada ? rendaValor ?? null : null,
        moeda: 'BRL',
      },
      sinais: [
        {
          id: 'pagamentos',
          nivel: 'incompleto',
          titulo: 'Ainda não há fatura nesta competência.',
          frase: 'Ainda não há fatura nesta competência.',
          contexto: 'Quando a fatura deste mês existir, o Raio-X lê pagamentos, crescimento e comprometimento.',
          atalho: atalhoMesAno('faturas', mes, ano),
        },
        {
          id: 'crescimento',
          nivel: 'incompleto',
          titulo: 'Sem fatura para comparar o crescimento.',
          frase: 'Sem fatura para comparar o crescimento.',
          contexto: null,
          atalho: atalhoMesAno('faturas', mes, ano),
        },
        {
          id: 'comprometimento',
          nivel: 'incompleto',
          titulo: 'Sem fatura para calcular o comprometimento.',
          frase: 'Sem fatura para calcular o comprometimento.',
          contexto: null,
          atalho: atalhoMesAno('projecao', mes, ano),
        },
      ],
      diagnostico: null,
      acoes: [
        { id: 'faturas', label: 'Ver faturas', atalho: atalhoMesAno('faturas', mes, ano) },
        { id: 'posso_comprar', label: 'Posso comprar?', atalho: { rota: 'simulador' } },
      ],
    }
  }

  const comprometimento: RaioXView['sinais'][number] = rendaInformada
    ? {
        id: 'comprometimento',
        nivel: 'alerta',
        titulo: '74% da sua renda já está comprometida',
        frase: '74% da sua renda já está comprometida',
        contexto: 'R$ 8.430 de faturas sobre R$ 11.400 de renda mensal.',
        metricas: {
          percentual: 74.0,
          valor_comprometido: 8430.0,
          renda: rendaValor ?? 11400.0,
        },
        atalho: atalhoMesAno('projecao', mes, ano),
      }
    : {
        id: 'comprometimento',
        nivel: 'incompleto',
        titulo: 'Informe sua renda para ver o comprometimento',
        frase: 'Informe sua renda para ver o comprometimento',
        contexto: 'Com a renda mensal, o Raio-X diz quanto da sua entrada já está nas faturas.',
        atalho: { rota: 'perfil' },
      }

  return {
    referencia,
    renda: {
      informada: Boolean(rendaInformada),
      valor: rendaInformada ? rendaValor ?? 11400.0 : null,
      moeda: 'BRL',
    },
    sinais: [
      {
        id: 'pagamentos',
        nivel: 'positivo',
        titulo: 'Pagamentos em dia',
        frase: 'Pagamentos em dia',
        contexto: 'Nenhuma fatura vencida em aberto neste mês.',
        atalho: atalhoMesAno('faturas', mes, ano),
      },
      {
        id: 'crescimento',
        nivel: 'atencao',
        titulo: 'Faturas cresceram 18%',
        frase: 'Faturas cresceram 18%',
        contexto: 'R$ 4.820 neste mês vs R$ 4.085 no mês anterior.',
        metricas: {
          variacao_percentual: 18.0,
          valor_atual: 4820.0,
          valor_anterior: 4085.0,
        },
        atalho: atalhoMesAno('faturas', mes, ano),
      },
      comprometimento,
    ],
    diagnostico: {
      tipo: 'parceladas',
      titulo: 'Principal problema: compras parceladas.',
      frase: 'Você possui R$ 8.420 em parcelas futuras, distribuídas em 23 compras.',
      projecao: rendaInformada
        ? 'Se não realizar novas compras parceladas, seu comprometimento deve cair para 51% em janeiro.'
        : null,
      contexto: 'Sem novas parceladas, a curva cai conforme as compras atuais terminam.',
      metricas: {
        valor_aberto: 8420.0,
        compras: 23,
        comprometimento_atual_percentual: rendaInformada ? 74.0 : null,
        comprometimento_projetado_percentual: rendaInformada ? 51.0 : null,
        horizonte: { mes: 1, ano: mes > 1 ? ano + 1 : ano, label: 'janeiro' },
      },
      atalho: atalhoMesAno('parceladas', mes, ano),
    },
    acoes: [
      { id: 'parceladas', label: 'Ver compras parceladas', atalho: atalhoMesAno('parceladas', mes, ano) },
      { id: 'posso_comprar', label: 'Posso comprar?', atalho: { rota: 'simulador' } },
      { id: 'gastos_criticos', label: 'Onde estou gastando demais?', atalho: { rota: 'gastos-criticos' } },
    ],
  }
}
