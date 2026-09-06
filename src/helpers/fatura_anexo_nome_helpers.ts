import { parseContentDispositionFilename, primeiroNomeArquivoUtil } from './anexo_filename_helpers'

export type FaturaAnexoDownloadTipo = 'pdf' | 'csv'

export type FaturaAnexoDownloadMeta = {
  cartaoNome?: string | null
  competencia?: string | null
  mes?: number | string | null
  ano?: number | string | null
  nomeOriginal?: string | null
  nomeOriginalPdf?: string | null
  nomeOriginalCsv?: string | null
}

export const faturaAnexoDownloadMetaFrom = (
  fatura: {
    cartao_nome?: string | null
    competencia?: string | null
    mes?: number | string | null
    ano?: number | string | null
    nome_original?: string | null
    nome_original_pdf?: string | null
    nome_original_csv?: string | null
  },
  competenciaFallback?: string | null,
): FaturaAnexoDownloadMeta => ({
  cartaoNome: fatura.cartao_nome,
  competencia: fatura.competencia ?? competenciaFallback,
  mes: fatura.mes,
  ano: fatura.ano,
  nomeOriginal: fatura.nome_original,
  nomeOriginalPdf: fatura.nome_original_pdf,
  nomeOriginalCsv: fatura.nome_original_csv,
})

const sanitizeFilenamePart = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

/** Fallback legado: fatura - {cartão} - {competência}.{ext} */
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

/** Filename da API (header ou meta) — fallback só se o back antigo não mandar nome. */
export const resolveFaturaAnexoDownloadFilename = (
  tipo: FaturaAnexoDownloadTipo,
  meta?: FaturaAnexoDownloadMeta,
  contentDisposition?: string | null,
): string => {
  const doHeader = parseContentDispositionFilename(contentDisposition)
  if (doHeader) return doHeader
  const daMeta = tipo === 'pdf'
    ? primeiroNomeArquivoUtil(meta?.nomeOriginalPdf, meta?.nomeOriginal)
    : primeiroNomeArquivoUtil(meta?.nomeOriginalCsv, meta?.nomeOriginal)
  if (daMeta) return daMeta
  return buildFaturaAnexoFilename(tipo, meta)
}

export type FaturaAnexoNomeSource = {
  nome_original?: string | null
  nome_original_pdf?: string | null
  nome_original_csv?: string | null
  tem_pdf?: boolean
  tem_csv?: boolean
  tipo_arquivo?: string | null
}

/** Nome enviado pelo usuário para PDF ou CSV — nunca o path interno nem o id. */
export const resolveFaturaAnexoNomeOriginal = (
  fatura: FaturaAnexoNomeSource | null | undefined,
  tipo: 'pdf' | 'csv',
): string | null => {
  if (!fatura) return null
  const especifico = tipo === 'pdf' ? fatura.nome_original_pdf : fatura.nome_original_csv
  const direto = primeiroNomeArquivoUtil(especifico)
  if (direto) return direto

  const generico = primeiroNomeArquivoUtil(fatura.nome_original)
  if (!generico) return null

  const temEste = tipo === 'pdf' ? fatura.tem_pdf : fatura.tem_csv
  const temOutro = tipo === 'pdf' ? fatura.tem_csv : fatura.tem_pdf
  if (temEste === false) return null
  if (temEste === true && temOutro === true) {
    const tipoApi = (fatura.tipo_arquivo || 'pdf').toLowerCase()
    return tipoApi === tipo ? generico : null
  }
  return generico
}

export const rotulosFaturaAnexoNomes = (
  fatura: FaturaAnexoNomeSource | null | undefined,
): string[] => {
  const nomes = [
    resolveFaturaAnexoNomeOriginal(fatura, 'pdf'),
    resolveFaturaAnexoNomeOriginal(fatura, 'csv'),
  ].filter((nome): nome is string => Boolean(nome))
  return [...new Set(nomes)]
}
