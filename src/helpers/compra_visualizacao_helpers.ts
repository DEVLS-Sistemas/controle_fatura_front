import {
  CompraParcelaItem,
  CompraStatusParcela,
  CompraVisualizacaoView,
} from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'

export const formatPercentual = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(Number(pct))) return '0%'
  return `${Number(pct).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`
}

export const statusParcelaColor = (
  status?: CompraStatusParcela | string | null
): string => {
  switch (status) {
    case 'paga':
      return 'success'
    case 'atual':
      return 'info'
    case 'aberta':
      return 'warning'
    default:
      return 'secondary'
  }
}

export const isResponsavelEu = (compra?: CompraVisualizacaoView | null): boolean => {
  const tipo = String(compra?.responsavel?.tipo ?? '').toLowerCase()
  if (tipo === 'eu') return true
  const nome = String(compra?.responsavel?.nome ?? '').trim().toLowerCase()
  return nome === 'eu'
}

export const deveMostrarRepasse = (
  parcela: CompraParcelaItem,
  compra?: CompraVisualizacaoView | null
): boolean => {
  const repasse = parcela.repasse
  if (!repasse) return false
  const status = String(repasse.status_repasse ?? '').toLowerCase()
  if (status && status !== 'pendente') return true
  return !isResponsavelEu(compra)
}

export const temColunaRepasse = (compra?: CompraVisualizacaoView | null): boolean =>
  (compra?.parcelas ?? []).some((parcela) => deveMostrarRepasse(parcela, compra))

export const ultimosDigitosCartao = (compra?: CompraVisualizacaoView | null): string | null => {
  const digitos = String(compra?.cartao_numero?.ultimos_digitos ?? '').replace(/\D/g, '').slice(-4)
  return digitos || null
}

export const formatCartaoNumeroLabel = (compra?: CompraVisualizacaoView | null): string | null => {
  const digitos = ultimosDigitosCartao(compra)
  if (!digitos) return null
  const numero = compra?.cartao_numero
  const extras = [numero?.apelido, numero?.tipo_label || numero?.tipo].filter(Boolean)
  return extras.length ? `**** ${digitos} · ${extras.join(' · ')}` : `**** ${digitos}`
}

export const faturaDestinoParcela = (parcela: CompraParcelaItem): string | null =>
  parcela.fatura_id ? `/faturas/view/${parcela.fatura_id}` : null
