import { getApiBaseUrl } from 'libs/api/ApiConfig'
import { getAuthToken, handleUnauthorizedSession } from 'helpers/auth_session'
import { corCategoria, corSubcategoria, corPlataforma, CorCategoriaItem, CorPlataformaItem } from 'helpers/cores_tema_helpers'

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
  fee: 'Encargo',
  carryover: 'Saldo anterior',
}

export const tipoTransacaoColor: Record<string, string> = {
  purchase: 'danger',
  payment: 'success',
  refund: 'info',
  advance: 'warning',
  fee: 'dark',
  carryover: 'secondary',
}

export const resolveTipoTransacaoLabel = (
  tipo?: string | null,
  tipoLabel?: string | null,
): string => {
  if (tipoLabel) return tipoLabel
  if (!tipo) return '-'
  return tipoTransacaoLabel[tipo] ?? tipo
}

/** Tipos que não são compra — vão na seção Operacionais do detalhe da fatura */
export const TIPOS_TRANSACAO_OPERACIONAIS = ['payment', 'refund', 'advance', 'fee', 'carryover'] as const

/**
 * Normaliza nome do estabelecimento para matching (sem acento, maiúsculas).
 */
export const normalizeEstabelecimentoNome = (value?: string | null): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

const isSaldoFaturaAnteriorNome = (nome: string): boolean => {
  if (!nome) return false
  if (nome.includes('SALDO RESTANTE') && nome.includes('FATURA ANTERIOR')) return true
  if (nome.includes('SALDO RESTANTE DA FATURA')) return true
  return nome === 'SALDO ANTERIOR'
}

/**
 * Pagamentos, estornos, antecipações, encargos e saldo da fatura anterior
 * ficam em Operacionais — não são compras.
 * Nome próprio na lista (ex.: Thaís Araújo da Silva) é estabelecimento (`purchase`).
 */
export const isTransacaoOperacional = (tx: {
  tipo?: string | null
  operacional?: boolean | null
  origem_compra?: string | null
  estabelecimento_nome?: string | null
  estabelecimento?: string | null
}): boolean => {
  const tipo = (tx.tipo ?? '').toLowerCase()
  if ((TIPOS_TRANSACAO_OPERACIONAIS as readonly string[]).includes(tipo)) return true

  const nome = normalizeEstabelecimentoNome(tx.estabelecimento_nome ?? tx.estabelecimento)
  if (isSaldoFaturaAnteriorNome(nome)) return true

  if (tx.operacional === true) return true
  if (tx.operacional === false) return false

  if (tx.origem_compra === 'PAGAMENTO_FATURA') return true
  if (!nome) return false

  if (nome.includes('PAGAMENTO DE FATURA') || nome.includes('PAGAMENTO FATURA')) return true
  if (nome.startsWith('PAGAMENTO EM ')) return true

  // Encargos comuns no extrato (fallback se o backend ainda marcar como purchase)
  const keywords = [
    'JUROS',
    'MULTA',
    'IOF',
    'ENCARGO',
    'ENCARGOS',
    'TARIFA',
    'ANUIDADE',
    'MORA',
    'ATRASO',
  ]
  return keywords.some((kw) => nome.includes(kw))
}

/** Fallback quando lookups.origens_compra ainda não carregou */
export const origemCompraLabel: Record<string, string> = {
  COMPRAS_ONLINE: 'Compras online',
  COMPRAS_PRESENCIAL: 'Compras presencial',
  PAGAMENTO_SERVICOS: 'Pagamento de serviços',
  PAGAMENTO_FATURA: 'Pagamento fatura',
}

export const origemCompraColor: Record<string, string> = {
  COMPRAS_ONLINE: 'info',
  COMPRAS_PRESENCIAL: 'primary',
  PAGAMENTO_SERVICOS: 'warning',
  PAGAMENTO_FATURA: 'secondary',
}

export const resolveOrigemCompraLabel = (
  value?: string | null,
  lookupLabel?: string | null
): string => {
  if (lookupLabel) return lookupLabel
  if (!value) return '-'
  return origemCompraLabel[value] ?? value
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

/** Quitação da fatura (`pago`) — distinto do status de processamento do PDF */
export const faturaQuitacaoLabel = (pago?: boolean | null): string =>
  pago ? 'Paga' : 'Em aberto'

export const faturaQuitacaoColor = (pago?: boolean | null): string =>
  pago ? 'success' : 'warning'

/** Repasse do responsável — distinto da quitação da bandeira */
export const statusRepasseLabel: Record<string, string> = {
  pendente: 'Não pagou',
  parcial: 'Pagou parcial',
  pago: 'Já pagou',
}

export const statusRepasseColor: Record<string, string> = {
  pendente: 'secondary',
  parcial: 'warning',
  pago: 'success',
}

export const statusRepasseBadgeClass: Record<string, string> = {
  pendente: 'bg-secondary-subtle text-secondary',
  parcial: 'bg-warning-subtle text-warning',
  pago: 'bg-success-subtle text-success',
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
  cor?: string | null | CorCategoriaItem
): { backgroundColor: string; borderColor: string; borderLeftWidth: number; borderLeftStyle: 'solid'; color: string } => {
  const hex = corCategoria(cor)
  return {
    backgroundColor: hexToRgba(hex, 0.28),
    borderColor: hex,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    color: '#212529',
  }
}

export const getSubcategoriaFieldStyle = (item?: {
  cor?: string | null
  categoria_cor?: string | null
}) => getCategoriaFieldStyle(corSubcategoria(item))

export const getPlataformaFieldStyle = (
  cor?: string | null | CorPlataformaItem
): { backgroundColor: string; borderColor: string; borderLeftWidth: number; borderLeftStyle: 'solid'; color: string } => {
  const hex = corPlataforma(cor)
  return {
    backgroundColor: hexToRgba(hex, 0.28),
    borderColor: hex,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    color: '#212529',
  }
}

export const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, '0'),
}))

/** Extensões e MIME types aceitos no upload de fatura (apenas PDF e CSV) */
export const FATURA_FILE_ACCEPT =
  '.pdf,.csv,application/pdf,text/csv,application/vnd.ms-excel'

export const FATURA_FILE_EXTENSIONS = ['pdf', 'csv'] as const

export type { FaturaAnexoTipo } from './fatura_anexo_flags'
export { resolveFaturaAnexo } from './fatura_anexo_flags'

export type FaturaAnexoDownloadTipo = 'pdf' | 'csv'

export type FaturaAnexoDownloadMeta = {
  cartaoNome?: string | null
  competencia?: string | null
  mes?: number | string | null
  ano?: number | string | null
}

const sanitizeFilenamePart = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

/** Monta o nome do arquivo: fatura - {cartão} - {competência}.{ext} */
export const buildFaturaAnexoFilename = (
  tipo: FaturaAnexoDownloadTipo,
  meta?: FaturaAnexoDownloadMeta,
): string => {
  const cartao = sanitizeFilenamePart(meta?.cartaoNome?.trim() || 'cartao')
  const competenciaRaw = meta?.competencia
    || (meta?.mes != null && meta?.ano != null
      ? `${String(meta.mes).padStart(2, '0')}/${meta.ano}`
      : '')
  const competencia = sanitizeFilenamePart(competenciaRaw || 'sem-competencia')
  return `fatura - ${cartao} - ${competencia}.${tipo}`
}

/** Baixa o anexo autenticado (`GET /faturas/pdf|{csv}/{id}`). */
export const downloadFaturaAnexo = async (
  id: number | string,
  tipo: FaturaAnexoDownloadTipo,
  meta?: FaturaAnexoDownloadMeta,
): Promise<void> => {
  const token = getAuthToken()
  const base = getApiBaseUrl()
  const res = await fetch(`${base}faturas/${tipo}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    handleUnauthorizedSession()
    throw new Error('Sessão expirada')
  }
  if (!res.ok) {
    throw new Error(tipo === 'pdf' ? 'PDF não disponível' : 'CSV não disponível')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = buildFaturaAnexoFilename(tipo, meta)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Abre o anexo autenticado em nova aba (Bearer, igual ao preview do detalhe). */
export const openFaturaAnexoInNewTab = async (
  id: number | string,
  tipo: FaturaAnexoDownloadTipo = 'pdf',
  meta?: FaturaAnexoDownloadMeta,
): Promise<void> => {
  const token = getAuthToken()
  const base = getApiBaseUrl()
  const res = await fetch(`${base}faturas/${tipo}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    handleUnauthorizedSession()
    throw new Error('Sessão expirada')
  }
  if (!res.ok) {
    throw new Error(tipo === 'pdf' ? 'PDF não disponível' : 'CSV não disponível')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    const a = document.createElement('a')
    a.href = url
    a.download = buildFaturaAnexoFilename(tipo, meta)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const isValidFaturaFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if ((FATURA_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
    return true
  }

  const mime = (file.type || '').toLowerCase()
  return [
    'application/pdf',
    'text/csv',
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

export const isNomeResponsavelEu = (nome?: string | null): boolean =>
  (nome ?? '').trim().toLowerCase() === 'eu'

/** Nome do responsável padrão da fatura, se não for o "Eu" */
export const nomeResponsavelPadraoNaoEu = (
  source?: { responsavel_nome?: string | null } | null
): string | null => {
  const nome = String(source?.responsavel_nome ?? '').trim()
  if (!nome || isNomeResponsavelEu(nome)) return null
  return nome
}

/** "Eu" só quando o responsável é de fato Eu — não o titular de outra pessoa. */
export const isMeuResponsavelDisplay = (opts: {
  responsavelId?: number | null
  responsavelNome?: string | null
  defaultResponsavelId?: number | null
  padraoFaturaNome?: string | null
}): boolean => {
  const nome = (opts.responsavelNome ?? '').trim()
  if (nome && !isNomeResponsavelEu(nome)) return false
  if (opts.responsavelId == null) {
    return !nomeResponsavelPadraoNaoEu({ responsavel_nome: opts.padraoFaturaNome ?? null })
  }
  if (opts.defaultResponsavelId != null) {
    return Number(opts.responsavelId) === Number(opts.defaultResponsavelId)
  }
  return isNomeResponsavelEu(nome)
}
