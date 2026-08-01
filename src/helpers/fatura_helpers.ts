/** Classe CSS para alinhar valores monetários à direita */
export const VALOR_TEXT_CLASS = 'text-valor'

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

const hexToRgba = (hex: string, alpha: number): string => {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw
  if (full.length !== 6) return hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Estilo de fundo com a cor cadastrada da categoria (texto permanece legível) */
export const getCategoriaFieldStyle = (
  cor?: string | null
): { backgroundColor: string; borderColor: string; borderLeftWidth: number; borderLeftStyle: 'solid'; color: string } | null => {
  if (!cor) return null
  return {
    backgroundColor: hexToRgba(cor, 0.28),
    borderColor: cor,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    color: '#212529',
  }
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

/** Converte valor monetário (BR "1.234,56", "1234.56", dígitos-centavos ou number) para centavos. */
export const toCentavos = (value: string | number | null | undefined): number => {
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

  // Dígitos puros: tratados como centavos (padrão da máscara `preco`)
  const digits = str.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

/** Formata centavos para string BR sem símbolo (ex.: "1.234,56"). */
export const centavosToBr = (centavos: number): string => {
  return (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Divide o total em N parcelas iguais; centavos restantes na última.
 * Retorna strings de dígitos (centavos), compatíveis com a máscara `preco`.
 */
export const splitValorEmParcelas = (valorCentavos: number, n: number): string[] => {
  const totalParcelas = Math.max(1, Math.min(36, Math.floor(n) || 1))
  if (totalParcelas === 1) return [String(valorCentavos)]

  const base = Math.floor(valorCentavos / totalParcelas)
  const resto = valorCentavos - base * totalParcelas

  return Array.from({ length: totalParcelas }, (_, i) => {
    const cents = i === totalParcelas - 1 ? base + resto : base
    return String(cents)
  })
}

export const parcelasOptions = Array.from({ length: 36 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}))
