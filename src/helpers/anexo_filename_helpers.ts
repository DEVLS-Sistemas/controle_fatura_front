/** Extrai o filename de `Content-Disposition` (`filename` ou `filename*`). */
export const parseContentDispositionFilename = (header?: string | null): string | null => {
  if (!header) return null
  const encoded = header.match(/filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i)
  if (encoded?.[1]) {
    const raw = encoded[1].trim().replace(/^["']|["']$/g, '')
    try {
      return decodeURIComponent(raw) || null
    } catch {
      return raw || null
    }
  }
  const plain = header.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)
  const value = (plain?.[1] ?? plain?.[2] ?? '').trim()
  return value || null
}

export const primeiroNomeArquivoUtil = (
  ...candidatos: Array<string | null | undefined>
): string | null => {
  for (const candidato of candidatos) {
    const nome = String(candidato ?? '').trim()
    if (nome) return nome
  }
  return null
}

/** Fallback sintético da API de compra (`anexo-42`) — não é o nome enviado. */
export const isFilenameFallbackPorId = (filename?: string | null): boolean =>
  Boolean(filename && /^anexo-\d+$/i.test(filename.trim()))
