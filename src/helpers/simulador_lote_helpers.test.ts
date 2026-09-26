jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      interceptors: {
        request: { use: () => undefined },
        response: { use: () => undefined },
      },
    }),
  },
}))

import { formatCurrency } from 'helpers/fatura_helpers'
import { SimulacaoLoteItem } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import {
  bandeirasAtivasDoCartao,
  bloqueioTamanhoLote,
  cartaoExigeBandeira,
  concluirEstaHabilitado,
  fraseSomando,
  destinosFaturaDoLote,
  indiceErroLote,
  mensagemSucessoLote,
  montarCompraLote,
  montarPayloadLote,
  primeiroIndiceInvalido,
  primeiroIndiceSemBandeira,
  textoConfirmacaoLote,
  textoTotalLista,
} from './simulador_lote_helpers'

const item = (parcial: Partial<SimulacaoLoteItem> = {}): SimulacaoLoteItem => ({
  observacoes: 'Mouse Logitech',
  valor_compra: '249,90',
  data: '2026-08-27',
  cartao_id: 1,
  parcelas_total: 1,
  ...parcial,
})

describe('textoConfirmacaoLote', () => {
  it('mostra quantidade e a soma dos totais, não da parcela', () => {
    const itens = [
      item({ valor_compra: '1.000,00', parcelas_total: 10 }),
      item({ valor_compra: '200,00' }),
      item({ valor_compra: '3.000,00' }),
    ]
    expect(textoConfirmacaoLote(itens)).toBe(`3 compras · ${formatCurrency(4200)}`)
  })

  it('usa o singular com uma compra', () => {
    expect(textoConfirmacaoLote([item({ valor_compra: '10,00' })])).toBe(
      `1 compra · ${formatCurrency(10)}`
    )
  })
})

describe('concluirEstaHabilitado', () => {
  it('veredito alto não desabilita o Concluir', () => {
    expect(concluirEstaHabilitado(false, 'alto')).toBe(true)
    expect(concluirEstaHabilitado(true, 'baixo')).toBe(false)
  })
})

describe('montarCompraLote', () => {
  it('monta o mínimo da compra rápida e omite campo vazio', () => {
    const payload = montarCompraLote(item({
      responsavel_id: 15,
      origem_compra: '',
      cartao_numero_id: null,
      categoria_id: undefined,
    }))
    expect(payload).toEqual({
      cartao_id: 1,
      observacoes: 'Mouse Logitech',
      valor_compra: '249,90',
      data: '2026-08-27',
      tipo: 'purchase',
      parcelas_total: 1,
      responsavel_id: 15,
    })
    expect(payload).not.toHaveProperty('estabelecimento')
    expect(payload).not.toHaveProperty('estabelecimento_id')
    expect(payload).not.toHaveProperty('origem_compra')
    expect(payload).not.toHaveProperty('parcelas')
  })

  it('envia parcelas só quando a lista já ajustou os valores', () => {
    const payload = montarCompraLote(item({
      parcelas_total: 2,
      parcelas: [
        { parcela: 1, valor: '100,00' },
        { parcela: 2, valor: '149,90' },
      ],
    }))
    expect(payload.parcelas).toEqual([
      { parcela: 1, valor: '100,00' },
      { parcela: 2, valor: '149,90' },
    ])
  })

  it('um único array, na ordem da lista', () => {
    const body = montarPayloadLote([
      item({ observacoes: 'A' }),
      item({ observacoes: 'B', cartao_id: 2 }),
    ])
    expect(body.compras.map((c) => c.observacoes)).toEqual(['A', 'B'])
  })

  it('omite cartao_bandeira_id no cartão de uma bandeira e envia no de duas', () => {
    const nubank = [{ id: 9, bandeira: 'Mastercard' }]
    const sofisa = [
      { id: 115, bandeira: 'Visa' },
      { id: 124, bandeira: 'Mastercard' },
    ]
    const body = montarPayloadLote(
      [
        item({ cartao_id: 163, observacoes: 'Mouse', cartao_bandeira_id: 9 }),
        item({ cartao_id: 164, observacoes: 'Teclado', cartao_bandeira_id: 115 }),
      ],
      (cartaoId) => (cartaoId === 164 ? sofisa : nubank)
    )
    expect(body.compras[0]).not.toHaveProperty('cartao_bandeira_id')
    expect(body.compras[1].cartao_bandeira_id).toBe(115)
  })

  it('omite a chave quando a bandeira está vazia', () => {
    const sofisa = [
      { id: 115, bandeira: 'Visa' },
      { id: 124, bandeira: 'Mastercard' },
    ]
    const payload = montarPayloadLote(
      [item({ cartao_id: 164, cartao_bandeira_id: null })],
      () => sofisa
    )
    expect(payload.compras[0]).not.toHaveProperty('cartao_bandeira_id')
    expect(montarCompraLote(item({ cartao_bandeira_id: '' as unknown as number }), true))
      .not.toHaveProperty('cartao_bandeira_id')
  })
})

describe('bandeira da fatura', () => {
  const sofisa = [
    { id: 115, bandeira: 'Visa' },
    { id: 124, bandeira: 'Mastercard' },
  ]
  const nubank = [{ id: 9, bandeira: 'Mastercard' }]

  it('considera só bandeiras ativas com id e nome', () => {
    expect(bandeirasAtivasDoCartao([
      { id: 115, bandeira: 'Visa', ativo: true },
      { id: 124, bandeira: 'Mastercard', ativo: false },
      { bandeira: 'Elo' },
    ])).toEqual([{ id: 115, bandeira: 'Visa', cor_principal: null, cor_secundaria: null }])
    expect(cartaoExigeBandeira(sofisa)).toBe(true)
    expect(cartaoExigeBandeira(nubank)).toBe(false)
    expect(cartaoExigeBandeira([])).toBe(false)
  })

  it('aponta só o item de cartão com duas bandeiras sem escolha', () => {
    const bandeirasDe = (cartaoId: number) => (cartaoId === 164 ? sofisa : nubank)
    expect(primeiroIndiceSemBandeira([
      item({ cartao_id: 163 }),
      item({ cartao_id: 164 }),
    ], bandeirasDe)).toEqual({ indice: 1, message: 'Selecione a bandeira da fatura' })
    expect(primeiroIndiceSemBandeira([
      item({ cartao_id: 164, cartao_bandeira_id: 115 }),
    ], bandeirasDe)).toBeNull()
    expect(primeiroIndiceSemBandeira([
      item({ cartao_id: 163 }),
    ], bandeirasDe)).toBeNull()
  })
})

describe('erros do lote', () => {
  it('barra 0 e 21 itens antes do POST', () => {
    expect(bloqueioTamanhoLote(0)).toBe('Envie entre 1 e 20 compras')
    expect(bloqueioTamanhoLote(21)).toBe('Envie entre 1 e 20 compras')
    expect(bloqueioTamanhoLote(3)).toBeNull()
  })

  it('aponta o índice do item sem valor', () => {
    const achado = primeiroIndiceInvalido([
      item(),
      item({ valor_compra: '' }),
    ])
    expect(achado).toEqual({ indice: 1, message: 'Valor da compra é obrigatório' })
  })

  it('lê o indice do 422 e ignora quando vem vazio', () => {
    expect(indiceErroLote({ error: true, message: 'Valor da compra é obrigatório', indice: 1 })).toBe(1)
    expect(indiceErroLote({ error: true, message: 'Envie entre 1 e 20 compras' })).toBeNull()
    expect(indiceErroLote({ message: 'falhou' })).toBeNull()
  })
})

describe('lista somada', () => {
  it('avisa quantas simulações já entram na soma', () => {
    expect(fraseSomando(0)).toBeNull()
    expect(fraseSomando(1)).toBe('Somando com 1 simulação')
    expect(fraseSomando(2)).toBe('Somando com 2 simulações')
  })

  it('total da lista usa o valor da compra, não a parcela', () => {
    expect(textoTotalLista([
      item({ valor_compra: '1.000,00', parcelas_total: 10 }),
      item({ valor_compra: '2.249,90' }),
    ])).toBe(`2 simulações · ${formatCurrency(3249.9)}`)
  })
})

describe('mensagemSucessoLote', () => {
  it('conta as compras gravadas', () => {
    expect(mensagemSucessoLote(1)).toBe('1 compra registrada.')
    expect(mensagemSucessoLote(3)).toBe('3 compras registradas.')
  })
})

describe('destinosFaturaDoLote', () => {
  it('lista a fatura inicial de cada cartão e ignora as parcelas seguintes', () => {
    const destinos = destinosFaturaDoLote({
      compras: [
        {
          transacao: {
            data: {
              transacoes: [
                { parcela_atual: 1, fatura_id: 10, cartao_id: 1, cartao_nome: 'Nubank', fatura_mes: 10, fatura_ano: 2026 },
                { parcela_atual: 2, fatura_id: 11, cartao_id: 1, cartao_nome: 'Nubank', fatura_mes: 11, fatura_ano: 2026 },
              ],
            },
          },
        },
        {
          transacao: {
            data: {
              transacoes: [
                { parcela_atual: 1, fatura_id: 20, cartao_id: 2, cartao_nome: 'Inter', fatura_mes: 10, fatura_ano: 2026 },
              ],
            },
          },
        },
      ],
    })

    expect(destinos).toEqual([
      { cartaoId: 1, cartaoNome: 'Nubank', faturaId: 10, mes: 10, ano: 2026 },
      { cartaoId: 2, cartaoNome: 'Inter', faturaId: 20, mes: 10, ano: 2026 },
    ])
  })
})
