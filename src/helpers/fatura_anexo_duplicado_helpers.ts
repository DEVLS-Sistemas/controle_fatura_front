import { formatCompetenciaMesAno } from 'helpers/fatura_competencia_pdf_helpers'
import {
    FaturaAnexoDuplicadoRetryPayload,
    FaturaExistenteAnexoDuplicado,
} from 'libs/api/exceptions/FaturaAnexoDuplicadoError'

export const TITULO_MODAL_ANEXO_DUPLICADO = 'Esta fatura já foi anexada'

export const COPY_MANTER_ANEXO =
    'Nada muda na fatura que já existe. Este arquivo não será importado de novo.'

export const COPY_AGUARDE_PROCESSANDO =
    'Aguarde o processamento terminar para substituir o anexo.'

const formatDateBr = (value?: string | null): string => {
    if (!value) return '-'
    const [y, m, d] = value.split('-')
    if (!y || !m || !d) return value
    return `${d}/${m}/${y}`
}

const formatCurrency = (value?: number | string | null): string => {
    const amount = Number(value || 0)
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const faturaExistenteEmProcessamento = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'status'> | null,
): boolean => String(fatura?.status ?? '').toLowerCase() === 'processando'

export const podeSubstituirAnexoDuplicado = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'status'> | null,
): boolean => !faturaExistenteEmProcessamento(fatura)

export const rotuloCartaoBandeira = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'cartao_nome' | 'bandeira'> | null,
): string | null => {
    const cartao = String(fatura?.cartao_nome ?? '').trim()
    const bandeira = String(fatura?.bandeira ?? '').trim()
    if (cartao && bandeira) return `${cartao} · ${bandeira}`
    return cartao || bandeira || null
}

export const rotuloCicloFatura = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'periodo_inicio' | 'periodo_fim'> | null,
): string | null => {
    if (!fatura?.periodo_inicio && !fatura?.periodo_fim) return null
    return `${formatDateBr(fatura?.periodo_inicio)} – ${formatDateBr(fatura?.periodo_fim)}`
}

export const rotuloCompetenciaFatura = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'competencia' | 'mes' | 'ano'> | null,
): string | null => formatCompetenciaMesAno(fatura)

export const copySubstituirAnexo = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'competencia' | 'mes' | 'ano'> | null,
): string => {
    const competencia = rotuloCompetenciaFatura(fatura)
    if (!competencia) {
        return 'O PDF atual desta fatura será trocado por este arquivo e processado de novo.'
    }
    return `O PDF atual da fatura ${competencia} será trocado por este arquivo e processado de novo.`
}

export const rotuloValorTransacoes = (
    fatura?: Pick<FaturaExistenteAnexoDuplicado, 'valor_total' | 'total_transacoes'> | null,
): string => {
    const valor = formatCurrency(fatura?.valor_total)
    const qtd = Number(fatura?.total_transacoes ?? 0)
    const transacoes = qtd === 1 ? '1 transação' : `${qtd} transações`
    return `${valor} · ${transacoes}`
}

export const anexoDuplicadoRetryFields = (
    acao: FaturaAnexoDuplicadoRetryPayload['confirmar_anexo_duplicado'],
    faturaId: number,
): FaturaAnexoDuplicadoRetryPayload => ({
    confirmar_anexo_duplicado: acao,
    fatura_duplicada_id: faturaId,
})

export const extractFaturaMessage = (result: unknown): string | null => {
    const body = result as Record<string, unknown> | null | undefined
    if (!body) return null
    const nested = body.fatura
    const fromNested = nested && typeof nested === 'object'
        ? (nested as Record<string, unknown>).message
        : null
    const msg = fromNested ?? body.message
    return typeof msg === 'string' && msg.trim() ? msg : null
}

export const statusFaturaLabel = (status?: string | null): string => {
    const map: Record<string, string> = {
        pendente: 'Pendente',
        processando: 'Processando',
        processada: 'Processada',
        erro: 'Erro',
    }
    const key = String(status ?? '').toLowerCase()
    return map[key] ?? (status || '—')
}
