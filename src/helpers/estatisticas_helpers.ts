import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import {
    EstatisticasCompra,
    EstatisticasPeriodo,
    pickEstatisticas,
} from 'interfaces/Estatisticas/EstatisticasCompraInterface'

const ORIGEM_LABEL: Record<string, string> = {
    historico: 'histórico',
    filtro: 'intervalo',
    mes: 'mês',
}

export function formatTaxa(value?: number | null, sufixo?: string): string {
    if (value == null || Number.isNaN(Number(value))) return '—'
    const formatted = Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
    return sufixo ? `${formatted}×/${sufixo}` : `${formatted}×`
}

export function formatPeriodoAplicado(periodo?: EstatisticasPeriodo | null): string | null {
    if (!periodo) return null
    const partes: string[] = []
    if (periodo.inicio || periodo.fim) {
        partes.push(`${formatDateBr(periodo.inicio)} → ${formatDateBr(periodo.fim)}`)
    }
    if (periodo.dias != null) partes.push(`${periodo.dias} ${periodo.dias === 1 ? 'dia' : 'dias'}`)
    if (periodo.origem) partes.push(ORIGEM_LABEL[periodo.origem] ?? periodo.origem)
    return partes.length ? partes.join(' · ') : null
}

export function frequenciaLabel(stats?: EstatisticasCompra | null): string {
    const compras = stats?.compras ?? 0
    return stats?.frequencia?.label
        ?? (compras === 0 ? 'Nenhuma compra no período' : '—')
}

export function extraEstatisticasLinha(source?: Parameters<typeof pickEstatisticas>[0]): string {
    const stats = pickEstatisticas(source)
    const partes: string[] = []
    if (stats.ocorrencias != null) {
        partes.push(`${stats.ocorrencias} lançamento${stats.ocorrencias === 1 ? '' : 's'}`)
    }
    if (stats.ticket_medio != null && (stats.compras ?? 0) > 0) {
        partes.push(`ticket ${formatCurrency(stats.ticket_medio)}`)
    }
    return partes.join(' · ')
}
