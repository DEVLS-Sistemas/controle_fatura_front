export type PeriodoOrigem = 'historico' | 'filtro' | 'mes'

export type PeriodoModo = 'historico' | 'mes' | 'intervalo'

export interface EstatisticasPeriodo {
    inicio?: string | null
    fim?: string | null
    origem?: PeriodoOrigem
    dias?: number
}

export interface EstatisticasFrequencia {
    periodo_dias?: number
    compras?: number
    intervalo_medio_dias?: number | null
    label?: string
    por_dia?: number
    por_semana?: number
    por_mes?: number
    por_ano?: number
}

export interface EstatisticasCompra {
    periodo?: EstatisticasPeriodo
    compras?: number
    ocorrencias?: number
    valor_total?: number
    ticket_medio?: number | null
    primeira_compra?: string | null
    ultima_compra?: string | null
    dias_desde_ultima?: number | null
    frequencia?: EstatisticasFrequencia
}

export interface PeriodoFiltro {
    periodo_modo?: PeriodoModo
    mes?: number | string | null
    ano?: number | string | null
    data_inicio?: string | null
    data_fim?: string | null
}

export type EstatisticasSource = EstatisticasCompra & {
    estatisticas?: EstatisticasCompra
    frequencia?: EstatisticasFrequencia
}

export const PeriodoFiltroDefault: PeriodoFiltro = {
    periodo_modo: 'historico',
    mes: null,
    ano: null,
    data_inicio: null,
    data_fim: null,
}

export function periodoToQuery(f: PeriodoFiltro = {}): Record<string, string | number> {
    if (f.periodo_modo === 'mes' && f.mes && f.ano) {
        return { mes: f.mes, ano: f.ano }
    }
    if (f.periodo_modo === 'intervalo' && (f.data_inicio || f.data_fim)) {
        return {
            ...(f.data_inicio ? { data_inicio: f.data_inicio } : {}),
            ...(f.data_fim ? { data_fim: f.data_fim } : {}),
        }
    }
    return {}
}

export function pickPeriodoFiltro(source?: PeriodoFiltro | null): PeriodoFiltro {
    return {
        periodo_modo: source?.periodo_modo ?? 'historico',
        mes: source?.mes ?? null,
        ano: source?.ano ?? null,
        data_inicio: source?.data_inicio ?? null,
        data_fim: source?.data_fim ?? null,
    }
}

export function withPeriodoQuery<T extends PeriodoFiltro>(params: T): Record<string, unknown> {
    const { periodo_modo, mes, ano, data_inicio, data_fim, ...rest } = params
    return {
        ...rest,
        ...periodoToQuery({ periodo_modo, mes, ano, data_inicio, data_fim }),
    }
}

export function pickEstatisticas(source?: EstatisticasSource | null): EstatisticasCompra {
    const nested = source?.estatisticas ?? {}
    return {
        periodo: nested.periodo ?? source?.periodo,
        compras: nested.compras ?? source?.compras ?? 0,
        ocorrencias: nested.ocorrencias ?? source?.ocorrencias,
        valor_total: nested.valor_total ?? source?.valor_total ?? 0,
        ticket_medio: nested.ticket_medio ?? source?.ticket_medio ?? null,
        primeira_compra: nested.primeira_compra ?? source?.primeira_compra ?? null,
        ultima_compra: nested.ultima_compra ?? source?.ultima_compra ?? null,
        dias_desde_ultima: nested.dias_desde_ultima ?? source?.dias_desde_ultima ?? null,
        frequencia: nested.frequencia ?? source?.frequencia,
    }
}

export function unwrapApiData<T = any>(body: any, wrapKeys: string[] = []): T {
    if (!body || typeof body !== 'object') return body as T
    for (const key of wrapKeys) {
        const wrap = body[key]
        if (wrap?.data != null && typeof wrap.data === 'object' && !Array.isArray(wrap.data)) {
            return wrap.data as T
        }
        if (wrap && typeof wrap === 'object' && (wrap.id != null || wrap.estatisticas || wrap.compras != null)) {
            return wrap as T
        }
    }
    if (
        body.data != null
        && typeof body.data === 'object'
        && !Array.isArray(body.data)
        && body.data.current_page == null
    ) {
        return body.data as T
    }
    return body as T
}
