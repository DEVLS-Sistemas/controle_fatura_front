import { CategoriaTemaLookup, LookupsCategorias } from 'interfaces/Categorias/CategoriasInterface'
import { LookupsPlataformas } from 'interfaces/Plataformas/PlataformasInterface'

export const COR_TEMA_PADRAO = '#000000'
export const COR_SEM_CATEGORIA = '#9ca3af'
export const COR_FATIA_OUTROS = '#d1d5db'

export type PaletaTemaLookup = LookupsCategorias | LookupsPlataformas | null | undefined

export type CorCategoriaItem = {
  cor?: string | null
  categoria_id?: number | null
}

export type CorPlataformaItem = {
  cor?: string | null
  plataforma_id?: number | null
}

export const TEMAS_CATEGORIA_FALLBACK: CategoriaTemaLookup[] = [
  { chave: 'preto', label: 'Preto', hex: '#000000', padrao: true, variacoes: [] },
  { chave: 'vermelho', label: 'Vermelho', hex: '#ef4444', padrao: false, variacoes: [] },
  { chave: 'laranja', label: 'Laranja', hex: '#f59e0b', padrao: false, variacoes: [] },
  { chave: 'verde', label: 'Verde', hex: '#22c55e', padrao: false, variacoes: [] },
  { chave: 'azul', label: 'Azul', hex: '#3b82f6', padrao: false, variacoes: [] },
  { chave: 'roxo', label: 'Roxo', hex: '#8b5cf6', padrao: false, variacoes: [] },
  { chave: 'rosa', label: 'Rosa', hex: '#ec4899', padrao: false, variacoes: [] },
  { chave: 'cinza', label: 'Cinza', hex: '#6b7280', padrao: false, variacoes: [] },
  { chave: 'teal', label: 'Teal', hex: '#14b8a6', padrao: false, variacoes: [] },
]

export const normalizeHexTema = (value?: string | null): string => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return ''
  const hex = (raw.startsWith('#') ? raw.slice(1) : raw).replace(/[^0-9a-f]/g, '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  if (full.length !== 6) return ''
  return `#${full}`
}

export const hexesTemaIguais = (a?: string | null, b?: string | null): boolean => {
  const left = normalizeHexTema(a)
  const right = normalizeHexTema(b)
  return Boolean(left) && left === right
}

export const corTemaPadrao = (lookups?: PaletaTemaLookup): string =>
  normalizeHexTema(lookups?.cor_padrao) || COR_TEMA_PADRAO

const temaConhecido = (hex?: string | null): CategoriaTemaLookup | undefined =>
  TEMAS_CATEGORIA_FALLBACK.find((tema) => hexesTemaIguais(tema.hex, hex))

export const resolverTemasCategoria = (lookups?: PaletaTemaLookup): CategoriaTemaLookup[] => {
  if (lookups?.temas && lookups.temas.length > 0) {
    return lookups.temas.map((tema, index) => {
      const hex = normalizeHexTema(tema.hex) || tema.hex
      const known = temaConhecido(hex)
      return {
        chave: tema.chave || known?.chave || `tema-${index}`,
        label: tema.label || known?.label || hex,
        hex,
        padrao: Boolean(tema.padrao || known?.padrao),
        variacoes: (tema.variacoes ?? [])
          .map((item) => normalizeHexTema(item))
          .filter((item): item is string => Boolean(item)),
      }
    })
  }

  const cores = lookups?.cores && lookups.cores.length > 0
    ? lookups.cores
    : TEMAS_CATEGORIA_FALLBACK.map((tema) => tema.hex)

  return cores.map((hex, index) => {
    const normalized = normalizeHexTema(hex) || hex
    const known = temaConhecido(normalized)
    return {
      chave: known?.chave || `cor-${index}`,
      label: known?.label || normalized,
      hex: normalized,
      padrao: Boolean(known?.padrao || normalized === COR_TEMA_PADRAO),
      variacoes: (known?.variacoes ?? [])
        .map((item) => normalizeHexTema(item))
        .filter((item): item is string => Boolean(item)),
    }
  })
}

export const corHexLegadoForaDaPaleta = (
  cor?: string | null,
  temas: CategoriaTemaLookup[] = []
): string | null => {
  const hex = normalizeHexTema(cor)
  if (!hex) return null
  return temas.some((tema) => hexesTemaIguais(tema.hex, hex)) ? null : hex
}

export const corCategoria = (item?: string | null | CorCategoriaItem): string => {
  if (item == null || typeof item === 'string') {
    return normalizeHexTema(item) || COR_TEMA_PADRAO
  }
  const id = Number(item.categoria_id)
  if (!Number.isFinite(id) || id <= 0) {
    return normalizeHexTema(item.cor) || COR_SEM_CATEGORIA
  }
  return normalizeHexTema(item.cor) || COR_TEMA_PADRAO
}

export const corPlataforma = (item?: string | null | CorPlataformaItem): string => {
  if (item == null || typeof item === 'string') {
    return normalizeHexTema(item) || COR_SEM_CATEGORIA
  }
  const id = Number(item.plataforma_id)
  if (!Number.isFinite(id) || id <= 0) {
    return normalizeHexTema(item.cor) || COR_SEM_CATEGORIA
  }
  return normalizeHexTema(item.cor) || COR_TEMA_PADRAO
}

export const corSubcategoria = (item?: {
  cor?: string | null
  categoria_cor?: string | null
}): string =>
  normalizeHexTema(item?.cor) || normalizeHexTema(item?.categoria_cor) || COR_TEMA_PADRAO

export const variacoesDoTema = (
  temas: CategoriaTemaLookup[],
  hex?: string | null
): string[] => {
  const tema = temas.find((item) => hexesTemaIguais(item.hex, hex))
  return (tema?.variacoes ?? [])
    .map((item) => normalizeHexTema(item))
    .filter((item): item is string => Boolean(item))
}

export const previewVariacoesSubcategoria = (
  formCor?: string | null,
  temas: CategoriaTemaLookup[] = [],
  subcategoriasSalvas?: { cor?: string | null }[] | null,
  corCategoriaSalva?: string | null
): string[] => {
  const doTema = variacoesDoTema(temas, formCor)
  if (!hexesTemaIguais(formCor, corCategoriaSalva)) return doTema
  const salvas = (subcategoriasSalvas ?? [])
    .map((item) => normalizeHexTema(item.cor))
    .filter((item): item is string => Boolean(item))
  return salvas.length > 0 ? salvas : doTema
}
