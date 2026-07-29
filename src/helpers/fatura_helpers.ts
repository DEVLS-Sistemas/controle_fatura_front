export const formatCurrency = (value?: number | string | null): string => {
  const amount = Number(value || 0)
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const formatDateBr = (value?: string | null): string => {
  if (!value) return '-'
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

export const tipoTransacaoLabel: Record<string, string> = {
  purchase: 'Compra',
  payment: 'Pagamento',
  refund: 'Estorno',
  advance: 'Antecipação',
}

export const tipoTransacaoColor: Record<string, string> = {
  purchase: 'danger',
  payment: 'success',
  refund: 'info',
  advance: 'warning',
}

export const responsavelTipoColor: Record<string, string> = {
  pessoal: 'primary',
  empresa: 'secondary',
}

export const faturaStatusColor: Record<string, string> = {
  pendente: 'secondary',
  processando: 'warning',
  processada: 'success',
  erro: 'danger',
}

export const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, '0'),
}))

/** Extensões e MIME types aceitos no upload de fatura */
export const FATURA_FILE_ACCEPT =
  '.pdf,.csv,.xml,application/pdf,text/csv,text/xml,application/xml,application/vnd.ms-excel'

export const FATURA_FILE_EXTENSIONS = ['pdf', 'csv', 'xml'] as const

export const isValidFaturaFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if ((FATURA_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
    return true
  }

  const mime = (file.type || '').toLowerCase()
  return [
    'application/pdf',
    'text/csv',
    'text/xml',
    'application/xml',
    'application/vnd.ms-excel',
    'text/plain',
  ].includes(mime)
}
