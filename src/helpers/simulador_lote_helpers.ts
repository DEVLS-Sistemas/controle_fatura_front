import { centavosToBr, formatCurrency, toCentavos } from 'helpers/fatura_helpers'
import { SimulacaoLoteItem, SimuladorVereditoNivel } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

export const LOTE_MIN = 1
export const LOTE_MAX = 20
export const MENSAGEM_TAMANHO_LOTE = 'Envie entre 1 e 20 compras'
export const MENSAGEM_BANDEIRA_FATURA = 'Selecione a bandeira da fatura'

export type BandeiraAtiva = {
  id: number
  bandeira: string
  cor_principal?: string | null
  cor_secundaria?: string | null
}

export type CompraLotePayload = {
  cartao_id: number
  observacoes: string
  valor_compra: string
  data: string
  tipo: 'purchase'
  parcelas_total: number
  cartao_bandeira_id?: number
  cartao_numero_id?: number
  origem_compra?: string
  plataforma_id?: number
  categoria_id?: number
  subcategoria_id?: number
  responsavel_id?: number
  fatura_id?: number
  eh_assinatura?: boolean
  parcelas?: Array<{ parcela: number; valor: string }>
}

const texto = (value: unknown): string => String(value ?? '').trim()

const idPositivo = (value: unknown): number | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** Bandeiras ativas do lookup do cartão. Inativa, sem id ou sem nome fica de fora. */
export const bandeirasAtivasDoCartao = (raw: unknown): BandeiraAtiva[] => {
  if (!Array.isArray(raw)) return []
  const lista: BandeiraAtiva[] = []
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return
    const rec = item as Record<string, unknown>
    const ativo = rec.ativo
    if (ativo === false || ativo === 0 || ativo === '0') return
    if (rec.deleted_at) return
    const id = idPositivo(rec.id)
    const bandeira = texto(rec.bandeira)
    if (id == null || !bandeira) return
    lista.push({
      id,
      bandeira,
      cor_principal: rec.cor_principal != null ? String(rec.cor_principal) : null,
      cor_secundaria: rec.cor_secundaria != null ? String(rec.cor_secundaria) : null,
    })
  })
  return lista
}

export const cartaoExigeBandeira = (bandeiras: readonly BandeiraAtiva[]): boolean =>
  bandeiras.length >= 2

export const bandeiraEscolhida = (
  bandeiras: readonly BandeiraAtiva[],
  value: unknown
): BandeiraAtiva | null => {
  if (!cartaoExigeBandeira(bandeiras)) return null
  const id = idPositivo(value)
  if (id == null) return null
  return bandeiras.find((bandeira) => bandeira.id === id) ?? null
}

export const primeiroIndiceSemBandeira = (
  itens: SimulacaoLoteItem[],
  bandeirasDe: (cartaoId: number) => readonly BandeiraAtiva[]
): { indice: number; message: string } | null => {
  for (let indice = 0; indice < itens.length; indice += 1) {
    const item = itens[indice]
    const bandeiras = bandeirasDe(Number(item.cartao_id))
    if (!cartaoExigeBandeira(bandeiras)) continue
    if (bandeiraEscolhida(bandeiras, item.cartao_bandeira_id) == null) {
      return { indice, message: MENSAGEM_BANDEIRA_FATURA }
    }
  }
  return null
}

/** 1..36; vazio ou inválido vira 1. Acima de 36 permanece para a validação barrar. */
export const parcelasTotalInformado = (value: unknown): number => {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

export const somaValorCompraCentavos = (itens: SimulacaoLoteItem[]): number =>
  itens.reduce((acc, item) => acc + toCentavos(item.valor_compra), 0)

export const fraseSomando = (qtd: number): string | null => {
  if (qtd <= 0) return null
  return qtd === 1 ? 'Somando com 1 simulação' : `Somando com ${qtd} simulações`
}

export const textoTotalLista = (itens: SimulacaoLoteItem[]): string => {
  const qtd = itens.length
  const rotulo = qtd === 1 ? '1 simulação' : `${qtd} simulações`
  const total = somaValorCompraCentavos(itens) / 100
  return `${rotulo} · ${formatCurrency(total)}`
}

export const textoConfirmacaoLote = (itens: SimulacaoLoteItem[]): string => {
  const qtd = itens.length
  const rotulo = qtd === 1 ? '1 compra' : `${qtd} compras`
  const total = somaValorCompraCentavos(itens) / 100
  return `${rotulo} · ${formatCurrency(total)}`
}

export const mensagemSucessoLote = (qtd: number): string =>
  qtd === 1 ? '1 compra registrada.' : `${qtd} compras registradas.`

/** Veredito (inclusive alto) não entra na conta. Só o POST em voo desabilita. */
export const concluirEstaHabilitado = (
  gravando: boolean,
  _nivel?: SimuladorVereditoNivel | null
): boolean => !gravando

export const bloqueioTamanhoLote = (qtd: number): string | null => {
  if (qtd < LOTE_MIN || qtd > LOTE_MAX) return MENSAGEM_TAMANHO_LOTE
  return null
}

export const primeiroIndiceInvalido = (
  itens: SimulacaoLoteItem[]
): { indice: number; message: string } | null => {
  for (let indice = 0; indice < itens.length; indice += 1) {
    const item = itens[indice]
    if (!texto(item.observacoes)) {
      return { indice, message: 'Descrição da compra é obrigatória' }
    }
    if (toCentavos(item.valor_compra) <= 0) {
      return { indice, message: 'Valor da compra é obrigatório' }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto(item.data))) {
      return { indice, message: 'Data da compra é obrigatória' }
    }
    if (idPositivo(item.cartao_id) == null) {
      return { indice, message: 'Cartão é obrigatório' }
    }
    const parcelas = parcelasTotalInformado(item.parcelas_total)
    if (parcelas > 36) {
      return { indice, message: 'Parcelas devem ser de 1 a 36' }
    }
  }
  return null
}

const atribuirOpcional = (
  payload: CompraLotePayload,
  key: keyof CompraLotePayload,
  value: unknown
) => {
  if (typeof value === 'boolean') {
    ;(payload as Record<string, unknown>)[key] = value
    return
  }
  if (typeof value === 'string') {
    const limpo = value.trim()
    if (limpo) (payload as Record<string, unknown>)[key] = limpo
    return
  }
  const id = idPositivo(value)
  if (id != null) (payload as Record<string, unknown>)[key] = id
}

export const montarCompraLote = (
  item: SimulacaoLoteItem,
  exigeBandeira = false
): CompraLotePayload => {
  const parcelas = Math.min(36, parcelasTotalInformado(item.parcelas_total))
  const payload: CompraLotePayload = {
    cartao_id: idPositivo(item.cartao_id) || 0,
    observacoes: texto(item.observacoes),
    valor_compra: centavosToBr(toCentavos(item.valor_compra)),
    data: texto(item.data),
    tipo: 'purchase',
    parcelas_total: parcelas,
  }

  if (exigeBandeira) {
    atribuirOpcional(payload, 'cartao_bandeira_id', item.cartao_bandeira_id)
  }
  atribuirOpcional(payload, 'cartao_numero_id', item.cartao_numero_id)
  atribuirOpcional(payload, 'origem_compra', item.origem_compra)
  atribuirOpcional(payload, 'plataforma_id', item.plataforma_id)
  atribuirOpcional(payload, 'categoria_id', item.categoria_id)
  atribuirOpcional(payload, 'subcategoria_id', item.subcategoria_id)
  atribuirOpcional(payload, 'responsavel_id', item.responsavel_id)
  atribuirOpcional(payload, 'fatura_id', item.fatura_id)
  if (typeof item.eh_assinatura === 'boolean') {
    payload.eh_assinatura = item.eh_assinatura
  }

  if (parcelas > 1 && item.parcelas && item.parcelas.length > 0) {
    payload.parcelas = item.parcelas.map((parcela, idx) => ({
      parcela: parcela.parcela || idx + 1,
      valor: centavosToBr(toCentavos(parcela.valor)),
    }))
  }

  return payload
}

export const montarPayloadLote = (
  itens: SimulacaoLoteItem[],
  bandeirasDe?: (cartaoId: number) => readonly BandeiraAtiva[]
): { compras: CompraLotePayload[] } => ({
  compras: itens.map((item) => {
    const bandeiras = bandeirasDe ? bandeirasDe(Number(item.cartao_id)) : []
    const exige = bandeirasDe
      ? cartaoExigeBandeira(bandeiras) && bandeiraEscolhida(bandeiras, item.cartao_bandeira_id) != null
      : false
    return montarCompraLote(item, exige)
  }),
})

export type DestinoFaturaCartao = {
  cartaoId: number
  cartaoNome: string
  faturaId: number
  mes: number
  ano: number
}

const transacoesDaCompra = (compra: unknown): Record<string, unknown>[] => {
  if (!compra || typeof compra !== 'object') return []
  const transacao = (compra as Record<string, unknown>).transacao
  if (!transacao || typeof transacao !== 'object') return []
  const data = (transacao as Record<string, unknown>).data
  if (!data || typeof data !== 'object') return []
  const lista = (data as Record<string, unknown>).transacoes
  if (!Array.isArray(lista)) return []
  return lista.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

/** Fatura inicial de cada cartão usado no lote. Mesmo cartão em meses diferentes vira uma linha por mês. */
export const destinosFaturaDoLote = (body: unknown): DestinoFaturaCartao[] => {
  const compras = body && typeof body === 'object' ? (body as Record<string, unknown>).compras : null
  if (!Array.isArray(compras)) return []

  const porFatura = new Map<number, DestinoFaturaCartao>()
  compras.forEach((compra) => {
    const transacoes = transacoesDaCompra(compra)
    const primeiras = transacoes.filter((tx) => Number(tx.parcela_atual) <= 1)
    const fontes = primeiras.length ? primeiras : transacoes.slice(0, 1)
    fontes.forEach((tx) => {
      const faturaId = Number(tx.fatura_id)
      const cartaoId = Number(tx.cartao_id)
      if (!Number.isInteger(faturaId) || faturaId <= 0 || !Number.isInteger(cartaoId) || cartaoId <= 0) return
      if (porFatura.has(faturaId)) return
      porFatura.set(faturaId, {
        cartaoId,
        cartaoNome: String(tx.cartao_nome || `Cartão ${cartaoId}`),
        faturaId,
        mes: Number(tx.fatura_mes) || 0,
        ano: Number(tx.fatura_ano) || 0,
      })
    })
  })

  return Array.from(porFatura.values())
}

export const indiceErroLote = (body: unknown): number | null => {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  const bruto = record.indice ?? (record.data && typeof record.data === 'object'
    ? (record.data as Record<string, unknown>).indice
    : undefined)
  if (bruto == null || bruto === '') return null
  const n = Number(bruto)
  if (!Number.isInteger(n) || n < 0) return null
  return n
}
