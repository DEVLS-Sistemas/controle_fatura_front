import {
    CompetenciaAtual,
    FaturasListFiltros,
    FaturasLookupAno,
    FaturasSearch,
    LookupsFaturas,
} from 'interfaces/Faturas/FaturasInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'

export type FaturasListagemUrl = {
    mes: number | null
    ano: number | null
    skipDefaultMesAtual: boolean
    cartao_id: string | number | null
    pessoa_id: string | number | null
    cartao_bandeira_id: string | number | null
    status: string | null
    palavra_chave: string | null
    page: number
}

export type CompetenciaInicial = {
    mes: number | null
    ano: number | null
    mesAtualAtivo: boolean
    usarAtalhoMesAtual: boolean
}

const emptyToNull = (value: string | null): string | null => {
    if (value == null || value === '') return null
    return value
}

export const parseMesFiltro = (value: unknown): number | null => {
    if (value == null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null
}

export const parseAnoFiltro = (value: unknown): number | null => {
    if (value == null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) && n > 2000 ? n : null
}

const parsePositiveId = (value: unknown): number | string | null => {
    if (value == null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : String(value)
}

const parsePage = (value: unknown): number => {
    const n = Number(value)
    return Number.isFinite(n) && n >= 1 ? n : 1
}

export const isMesAtualDesligadoNaUrl = (raw: string | null): boolean =>
    raw === '0' || raw === 'false'

export const isMesAtualAtivo = (
    mes: number | null,
    ano: number | null,
    competencia?: CompetenciaAtual | null,
): boolean => {
    if (!competencia || mes == null || ano == null) return false
    return Number(mes) === Number(competencia.mes) && Number(ano) === Number(competencia.ano)
}

export const parseFaturasListagemSearchParams = (
    searchParams: URLSearchParams,
): FaturasListagemUrl => {
    const mes = parseMesFiltro(searchParams.get('mes'))
    const ano = parseAnoFiltro(searchParams.get('ano'))
    const skipDefaultMesAtual = isMesAtualDesligadoNaUrl(searchParams.get('mes_atual'))
        && mes == null
        && ano == null

    return {
        mes,
        ano,
        skipDefaultMesAtual,
        cartao_id: parsePositiveId(searchParams.get('cartao_id')),
        pessoa_id: parsePositiveId(searchParams.get('pessoa_id')),
        cartao_bandeira_id: parsePositiveId(searchParams.get('cartao_bandeira_id')),
        status: emptyToNull(searchParams.get('status')),
        palavra_chave: emptyToNull(searchParams.get('palavra_chave')),
        page: parsePage(searchParams.get('page')),
    }
}

export const resolveCompetenciaInicial = (
    url: Pick<FaturasListagemUrl, 'mes' | 'ano' | 'skipDefaultMesAtual'>,
    competencia: CompetenciaAtual | null,
): CompetenciaInicial => {
    if (url.mes != null || url.ano != null) {
        return {
            mes: url.mes,
            ano: url.ano,
            mesAtualAtivo: isMesAtualAtivo(url.mes, url.ano, competencia),
            usarAtalhoMesAtual: false,
        }
    }
    if (url.skipDefaultMesAtual) {
        return {
            mes: null,
            ano: null,
            mesAtualAtivo: false,
            usarAtalhoMesAtual: false,
        }
    }
    if (competencia) {
        return {
            mes: competencia.mes,
            ano: competencia.ano,
            mesAtualAtivo: true,
            usarAtalhoMesAtual: false,
        }
    }
    return {
        mes: null,
        ano: null,
        mesAtualAtivo: true,
        usarAtalhoMesAtual: true,
    }
}

const setIfPresent = (params: URLSearchParams, key: string, value: unknown) => {
    if (value == null || value === '') return
    params.set(key, String(value))
}

export const buildFaturasListagemSearchParams = (filters: {
    mes?: unknown
    ano?: unknown
    cartao_id?: unknown
    pessoa_id?: unknown
    cartao_bandeira_id?: unknown
    status?: unknown
    palavra_chave?: unknown
    page?: unknown
}): URLSearchParams => {
    const next = new URLSearchParams()
    const mes = parseMesFiltro(filters.mes)
    const ano = parseAnoFiltro(filters.ano)
    if (mes != null) next.set('mes', String(mes))
    if (ano != null) next.set('ano', String(ano))
    if (mes == null && ano == null) next.set('mes_atual', '0')
    setIfPresent(next, 'cartao_id', filters.cartao_id)
    setIfPresent(next, 'pessoa_id', filters.pessoa_id)
    setIfPresent(next, 'cartao_bandeira_id', filters.cartao_bandeira_id)
    setIfPresent(next, 'status', filters.status)
    setIfPresent(next, 'palavra_chave', filters.palavra_chave)
    const page = parsePage(filters.page)
    if (page > 1) next.set('page', String(page))
    return next
}

export const buildFaturasListarApiParams = (filters: FaturasSearch & {
    firstEntry?: boolean
}): FaturasSearch => {
    const params: FaturasSearch = {}
    const mes = parseMesFiltro(filters.mes)
    const ano = parseAnoFiltro(filters.ano)
    if (mes != null) params.mes = mes
    if (ano != null) params.ano = ano
    if (filters.mes_atual === 1 || filters.mes_atual === true) params.mes_atual = 1
    if (filters.cartao_id) params.cartao_id = filters.cartao_id
    if (filters.pessoa_id) params.pessoa_id = filters.pessoa_id
    if (filters.cartao_bandeira_id) params.cartao_bandeira_id = filters.cartao_bandeira_id
    if (filters.status) params.status = filters.status
    if (filters.palavra_chave) params.palavra_chave = filters.palavra_chave
    if (filters.page) params.page = Number(filters.page)
    if (filters.perPage) params.perPage = Number(filters.perPage)
    return params
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

export const extractCompetenciaAtual = (source: unknown): CompetenciaAtual | null => {
    const body = asRecord(source)
    if (!body) return null
    const nested = asRecord(body.data) ?? asRecord(body.lookups)
    const raw = asRecord(body.competencia_atual) ?? asRecord(nested?.competencia_atual)
    if (!raw) return null
    const mes = parseMesFiltro(raw.mes)
    const ano = parseAnoFiltro(raw.ano)
    if (mes == null || ano == null) return null
    const label = typeof raw.label === 'string' ? raw.label : undefined
    return { mes, ano, label }
}

export const extractLookupsFaturas = (source: unknown): LookupsFaturas | undefined => {
    const body = asRecord(source)
    if (!body) return undefined
    if (body.cartoes || body.competencia_atual || body.anos) {
        return body as unknown as LookupsFaturas
    }
    const nested = asRecord(body.data) ?? asRecord(body.lookups)
    if (nested && (nested.cartoes || nested.competencia_atual || nested.anos)) {
        return nested as unknown as LookupsFaturas
    }
    return body as unknown as LookupsFaturas
}

export const extractFaturasListagemMeta = (source: unknown): {
    competencia_atual: CompetenciaAtual | null
    filtros: FaturasListFiltros | null
} => {
    const body = asRecord(source)
    if (!body) return { competencia_atual: null, filtros: null }
    const competencia_atual = extractCompetenciaAtual(body)
    const rawFiltros = asRecord(body.filtros)
    if (!rawFiltros) return { competencia_atual, filtros: null }
    return {
        competencia_atual,
        filtros: {
            mes: parseMesFiltro(rawFiltros.mes),
            ano: parseAnoFiltro(rawFiltros.ano),
            mes_atual_ativo: rawFiltros.mes_atual_ativo === true || rawFiltros.mes_atual_ativo === 1,
        },
    }
}

export const anosLookupToOptions = (anos?: FaturasLookupAno[] | null): SelectOptions[] => {
    const opts: SelectOptions[] = [{ value: '', label: 'Todos' }]
    ;(anos ?? []).forEach((item) => {
        const value = Number(item.value)
        if (!Number.isFinite(value)) return
        opts.push({ value, label: item.label || String(value) })
    })
    return opts
}
