import {
    ResponsavelVisualizarAtalhoRef,
    ResponsavelVisualizarAtalhos,
    ResponsavelVisualizarView,
} from 'interfaces/Responsaveis/ResponsaveisInterface'

export const MESES_NOMES_PT: { value: number; label: string }[] = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
]

export const shiftCompetencia = (mes: number, ano: number, delta: number) => {
    const cursor = new Date(ano, mes - 1 + delta, 1)
    return { mes: cursor.getMonth() + 1, ano: cursor.getFullYear() }
}

export const parseCompetenciaQuery = (
    mesRaw?: string | null,
    anoRaw?: string | null
): { mes: number; ano: number } => {
    const now = new Date()
    const mes = Number(mesRaw)
    const ano = Number(anoRaw)
    return {
        mes: Number.isFinite(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
        ano: Number.isFinite(ano) && ano > 2000 ? ano : now.getFullYear(),
    }
}

export const buildResponsavelVisualizarPath = (
    id: number | string,
    mes?: number | null,
    ano?: number | null
): string => {
    const qs = new URLSearchParams()
    if (mes) qs.set('mes', String(mes))
    if (ano) qs.set('ano', String(ano))
    const query = qs.toString()
    return query ? `/responsaveis/view/${id}?${query}` : `/responsaveis/view/${id}`
}

export const buildFaturaResponsavelAtalhoPath = (
    atalho?: ResponsavelVisualizarAtalhoRef | null,
    fallback?: { id: number | string; mes: number; ano: number }
): string | null => {
    const id = atalho?.responsavel_id ?? fallback?.id
    const mes = atalho?.mes ?? fallback?.mes
    const ano = atalho?.ano ?? fallback?.ano
    if (id == null || mes == null || ano == null) return null
    return `/projecao-faturas/responsaveis/${id}/fatura?mes=${mes}&ano=${ano}`
}

export const buildRepassesAtalhoPath = (
    atalho?: ResponsavelVisualizarAtalhoRef | null,
    fallback?: { id: number | string; mes: number; ano: number }
): string | null => {
    const id = atalho?.responsavel_id ?? fallback?.id
    const mes = atalho?.mes ?? fallback?.mes
    const ano = atalho?.ano ?? fallback?.ano
    if (id == null || mes == null || ano == null) return null
    return `/projecao-faturas/responsaveis/${id}/repasses?mes=${mes}&ano=${ano}`
}

export const buildRankingAtalhoPath = (
    atalho?: (ResponsavelVisualizarAtalhoRef & { apenas_abertas?: number | boolean }) | null,
    fallback?: { id: number | string; mes: number; ano: number }
): string | null => {
    const id = atalho?.responsavel_id ?? fallback?.id
    const mes = atalho?.mes ?? fallback?.mes
    const ano = atalho?.ano ?? fallback?.ano
    if (id == null || mes == null || ano == null) return null
    const qs = new URLSearchParams({
        responsavel_id: String(id),
        mes: String(mes),
        ano: String(ano),
    })
    const apenas = atalho?.apenas_abertas
    if (apenas === 1 || apenas === true || apenas == null) {
        qs.set('apenas_abertas', '1')
    }
    return `/parceladas?${qs.toString()}`
}

export const buildComprasAtalhoPath = (
    atalho?: ResponsavelVisualizarAtalhos['compras'],
    fallbackId?: number | string,
    extra?: { categoria_id?: number | null }
): string | null => {
    const id = atalho?.responsavel_id ?? fallbackId
    if (id == null) return null
    const qs = new URLSearchParams({
        responsavel_id: String(id),
        tipo: atalho?.tipo || 'purchase',
    })
    const categoriaId = extra?.categoria_id ?? atalho?.categoria_id
    if (categoriaId != null) qs.set('categoria_id', String(categoriaId))
    return `/transacoes?${qs.toString()}`
}

export const buildCompraVisualizarPath = (
    identificador?: string | null,
    mes?: number | null,
    ano?: number | null
): string | null => {
    if (!identificador) return null
    const qs = new URLSearchParams()
    if (mes) qs.set('mes', String(mes))
    if (ano) qs.set('ano', String(ano))
    const query = qs.toString()
    const path = `/compras/${encodeURIComponent(identificador)}`
    return query ? `${path}?${query}` : path
}

export const buildFaturaCartaoPath = (faturaId?: number | null): string | null =>
    faturaId != null ? `/faturas/view/${faturaId}` : null

export const buildPessoaViewPath = (pessoaId?: number | null): string | null =>
    pessoaId != null ? `/pessoas/view/${pessoaId}` : null

export const extractVisualizarPayload = (body: any): ResponsavelVisualizarView | undefined => {
    if (!body) return undefined
    if (body.id != null && (body.totais || body.nome != null)) return body
    const nested = body.data
    if (nested && nested.id != null) return nested
    return nested ?? body
}
