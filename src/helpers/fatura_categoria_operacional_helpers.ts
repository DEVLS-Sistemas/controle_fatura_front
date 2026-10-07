/**
 * Na fatura, pagamento, estorno, antecipação, encargo e saldo anterior
 * não editam categoria. Compra (`purchase`) sempre edita, mesmo sem cartão.
 */
export const linhaFaturaSemCategoria = (tx: {
  operacional?: boolean | null
  tipo?: string | null
}): boolean => {
  if ((tx.tipo ?? '').toLowerCase() === 'purchase') return false
  return tx.operacional === true
}
