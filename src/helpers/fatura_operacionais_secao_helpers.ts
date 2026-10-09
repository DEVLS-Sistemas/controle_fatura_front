const TIPOS_SECAO_OPERACIONAIS = ['payment', 'refund', 'advance', 'fee', 'carryover'] as const

/**
 * Estorno, pagamento, encargo, antecipação e saldo anterior vão para a seção
 * irmã Operacionais da fatura, mesmo com final de cartão.
 * Compra (`purchase` ou `operacional === false`) permanece no cartão.
 */
export const transacaoFaturaSecaoOperacionais = (tx: {
  tipo?: string | null
  operacional?: boolean | null
}): boolean => {
  const tipo = (tx.tipo ?? '').toLowerCase()
  if (tipo === 'purchase') return false
  if (tx.operacional === false) return false
  if (tx.operacional === true) return true
  return (TIPOS_SECAO_OPERACIONAIS as readonly string[]).includes(tipo)
}
