import { ProjecaoFaturasView, ProjecaoValor } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { SimuladorOverlayResult } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { calcularVereditoCompra, formatPctVeredito, formatPesoChip, formatTotalCurto, nivelMes } from './posso_comprar_helpers'

describe('nivelMes', () => {
  it('fica baixo quando o uso é baixo e a parcela pesa pouco', () => {
    expect(nivelMes(2000, 2250, 250, 8000, 28.1)).toBe(0)
  })

  it('fica moderado em 70–89% do limite', () => {
    expect(nivelMes(5000, 5600, 250, 8000, 70)).toBe(1)
    expect(nivelMes(5000, 7120, 250, 8000, 89)).toBe(1)
  })

  it('fica alto em 90% ou mais do limite', () => {
    expect(nivelMes(7000, 7250, 250, 8000, 90)).toBe(2)
    expect(nivelMes(7000, 7520, 250, 8000, 94)).toBe(2)
  })

  it('fica moderado quando a parcela é 20–39% da fatura', () => {
    expect(nivelMes(1000, 1250, 250, null, null)).toBe(1)
  })

  it('fica alto quando a parcela é 40% ou mais da fatura', () => {
    expect(nivelMes(500, 750, 250, null, null)).toBe(2)
  })

  it('sem limite e fatura vazia fica baixo', () => {
    expect(nivelMes(0, 250, 250, null, null)).toBe(0)
  })
})

describe('formatPctVeredito', () => {
  it('usa 0 casa se inteiro e 1 se não', () => {
    expect(formatPctVeredito(41)).toBe('41')
    expect(formatPctVeredito(41.0)).toBe('41')
    expect(formatPctVeredito(12.5)).toBe('12,5')
  })
})

describe('formatPesoChip', () => {
  it('mostra % quando a parcela é menor que a fatura', () => {
    expect(formatPesoChip(0.4)).toBe('Parcela = 40% da fatura')
  })

  it('mostra múltiplo quando a parcela é maior que a fatura', () => {
    expect(formatPesoChip(3.492)).toBe('Parcela = 3,5x a fatura')
  })
})

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const cell = (total: number, limite: number | null): ProjecaoValor => ({
  realizado: 0,
  projetado: total,
  total,
  fonte: total > 0 ? 'projecao' : 'vazio',
  em_uso: total,
  livre: limite != null ? limite - total : null,
  percentual_utilizado: limite != null && limite > 0 ? Math.round((total / limite) * 10000) / 100 : null,
  percentual_livre: limite != null && limite > 0 ? Math.round(((limite - total) / limite) * 10000) / 100 : null,
  disponivel: limite != null ? limite - total : null,
})

const montarCenario = (opts: { totaisAntes: number[]; limite: number | null; parcela?: number }) => {
  const parcela = opts.parcela ?? 250
  const n = opts.totaisAntes.length
  const colunas = opts.totaisAntes.map((_, i) => {
    const cursor = new Date(2026, 8 + i, 1)
    const mes = cursor.getMonth() + 1
    const ano = cursor.getFullYear()
    return {
      mes,
      ano,
      chave: `${ano}-${String(mes).padStart(2, '0')}`,
      label: `${MESES[mes - 1]}/${ano}`,
      referencia: i === 0,
    }
  })
  const base: ProjecaoFaturasView = {
    referencia: { mes: 9, ano: 2026 },
    colunas,
    por_cartao: [
      {
        cartao_id: 1,
        nome: 'Nubank',
        limite_credito: opts.limite,
        valores: opts.totaisAntes.map((t) => cell(t, opts.limite)),
        total: opts.totaisAntes.reduce((a, b) => a + b, 0),
      },
    ],
    por_responsavel: [],
    totais_por_coluna: [],
  }
  const overlay: ProjecaoFaturasView = JSON.parse(JSON.stringify(base))
  overlay.por_cartao[0].valores = opts.totaisAntes.map((t) => cell(t + parcela, opts.limite))
  const parcelas = colunas.map((c, i) => ({
    parcela: i + 1,
    valor: parcela,
    mes: c.mes,
    ano: c.ano,
    chave: c.chave,
    label: c.label,
    na_janela: true,
    indice_coluna: i,
  }))
  const overlayInput: SimuladorOverlayResult = {
    parcelas,
    deltas: Array.from({ length: n }, () => parcela),
    parcelas_na_janela: n,
    parcelas_fora_da_janela: 0,
    primeira: parcelas[0],
    ultima: parcelas[n - 1],
    totais_batem: true,
  }
  return { base, overlay, overlayInput }
}

describe('calcularVereditoCompra', () => {
  it('classifica baixo quando nenhum mês chega a 70% e a parcela pesa pouco', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: Array.from({ length: 10 }, () => 2000),
      limite: 8000,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 2500,
      overlayInput,
    })
    expect(v?.nivel).toBe('baixo')
    expect(v?.eyebrow).toBe('Pode comprar')
    expect(v?.frase).toContain('R$')
    expect(v?.frase).toContain('10 faturas')
  })

  it('classifica moderado quando um mês fica entre 70 e 89%', () => {
    const totais = Array.from({ length: 10 }, () => 2000)
    totais[2] = 5500
    const { base, overlay, overlayInput } = montarCenario({ totaisAntes: totais, limite: 8000 })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 2500,
      overlayInput,
    })
    expect(v?.nivel).toBe('moderado')
    expect(v?.eyebrow).toBe('Dá para comprar, com ressalva')
  })

  it('classifica alto quando um mês vai a 90% ou mais do limite', () => {
    const totais = Array.from({ length: 10 }, () => 2000)
    totais[6] = 7270
    const { base, overlay, overlayInput } = montarCenario({ totaisAntes: totais, limite: 8000 })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 2500,
      overlayInput,
    })
    expect(v?.nivel).toBe('alto')
    expect(v?.eyebrow).toBe('Melhor não agora')
    expect(v?.frase).toContain('Nubank')
    expect(v?.mesCritico?.ehCritico).toBe(true)
  })

  it('sobe para alto se 4 ou mais meses já estão amarelos', () => {
    const totais = Array.from({ length: 10 }, (_, i) => (i < 4 ? 5500 : 2000))
    const { base, overlay, overlayInput } = montarCenario({ totaisAntes: totais, limite: 8000 })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 2500,
      overlayInput,
    })
    expect(v?.nivel).toBe('alto')
    expect(v?.bumpDuracao).toBe(true)
    expect(v?.motivos.some((m) => m.id === 'duracao')).toBe(true)
  })

  it('não aplica bump à vista', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: [5000],
      limite: 8000,
      parcela: 1000,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 1,
      valorCompra: 1000,
      overlayInput,
    })
    expect(v?.nivel).toBe('moderado')
    expect(v?.bumpDuracao).toBe(false)
  })

  it('classifica por peso quando o cartão não tem limite', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: [1000, 1000, 1000],
      limite: null,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 3,
      valorCompra: 750,
      overlayInput,
    })
    expect(v?.nivel).toBe('moderado')
    expect(v?.semLimite).toBe(true)
    expect(v?.frase).not.toContain('% do limite')
  })

  it('fica baixo sem histórico quando não há limite e as faturas estão zeradas', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: Array.from({ length: 10 }, () => 0),
      limite: null,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 2500,
      overlayInput,
    })
    expect(v?.nivel).toBe('baixo')
    expect(v?.frase).toContain('Não há histórico neste cartão')
  })

  it('não mostra porcentagem acima de 100% quando a parcela é maior que a fatura', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: [71.59],
      limite: null,
      parcela: 250,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 1,
      valorCompra: 250,
      overlayInput,
    })
    expect(v?.nivel).toBe('alto')
    expect(v?.frase).not.toMatch(/\d+,\d+% da fatura/)
    expect(v?.frase).toContain('vezes a fatura atual')
    expect(v?.frase).toContain('71,59')
    expect(v?.motivos.find((m) => m.id === 'peso')?.label).toBe('Parcela = 3,5x a fatura')
  })

  it('no empate sem limite aponta o mês mais carregado em R$, não o de maior ratio', () => {
    const { base, overlay, overlayInput } = montarCenario({
      totaisAntes: [1742.32, 1100, 900, 457, 210, 155, 143.2, 0, 0, 0],
      limite: null,
      parcela: 500,
    })
    const v = calcularVereditoCompra({
      base,
      overlay,
      cartaoId: 1,
      cartaoNome: 'Nubank',
      nParcelas: 10,
      valorCompra: 5000,
      overlayInput,
    })
    expect(v?.nivel).toBe('alto')
    expect(v?.mesCritico?.indice).toBe(1)
    expect(v?.frase).toContain('Out/2026')
    expect(v?.frase).not.toContain('vezes a fatura')
    expect(v?.frase).toContain('Nubank')
    expect(v?.motivos.find((m) => m.id === 'peso')?.label).not.toContain('x a fatura')
  })
})
