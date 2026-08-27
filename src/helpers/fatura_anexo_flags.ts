export type FaturaAnexoTipo = 'pdf' | 'csv' | null

/** Resolve anexos a partir dos campos da API (PDF e CSV podem coexistir). */
export const resolveFaturaAnexo = (fatura: {
  tipo_arquivo?: string | null
  tem_pdf?: boolean
  tem_csv?: boolean
  arquivo_pdf?: string | null
  arquivo_csv?: string | null
}): { tipo: FaturaAnexoTipo; temPdf: boolean; temCsv: boolean } => {
  const extPdf = fatura.arquivo_pdf
    ? (fatura.arquivo_pdf.split('?')[0].split('.').pop() || '').toLowerCase()
    : ''
  const tipoApi = fatura.tipo_arquivo?.toLowerCase()
  const flagPdfAusente = fatura.tem_pdf == null
  const flagCsvAusente = fatura.tem_csv == null

  // `tem_pdf: false` nesta competência ganha sempre. Stub pago / parcela de
  // outro PDF não é anexo — não inferir por `tipo_arquivo`, `pago` ou status.
  let temPdf = fatura.tem_pdf === true
  let temCsv = fatura.tem_csv === true

  if (flagPdfAusente || flagCsvAusente) {
    const csvNoCampoPdf = !fatura.arquivo_csv && extPdf === 'csv'
    if (flagPdfAusente) {
      temPdf = Boolean(fatura.arquivo_pdf) && !csvNoCampoPdf
      if (!temPdf && !fatura.arquivo_pdf && tipoApi === 'pdf') temPdf = true
    }
    if (flagCsvAusente) {
      temCsv = Boolean(fatura.arquivo_csv) || csvNoCampoPdf
      if (!temCsv && !fatura.arquivo_csv && !fatura.arquivo_pdf && tipoApi === 'csv') {
        temCsv = true
      }
    }
  }

  let tipo: FaturaAnexoTipo = null
  if (temPdf && temCsv) tipo = tipoApi === 'csv' ? 'csv' : 'pdf'
  else if (temPdf) tipo = 'pdf'
  else if (temCsv) tipo = 'csv'

  return { tipo, temPdf, temCsv }
}
