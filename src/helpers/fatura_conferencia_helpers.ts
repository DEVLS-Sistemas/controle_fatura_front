export type FaturaConferencia = {
    valor_cabecalho?: number | string | null
    soma_transacoes?: number | string | null
    bate?: boolean | null
    diferenca?: number | string | null
}

const moneyOrNull = (value?: number | string | null): number | null => {
    if (value == null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100

/** Aviso só quando a API manda `bate === false`. Não inferir soma no client. */
export const conferenciaFaturaDiverge = (
    conferencia?: FaturaConferencia | null,
): boolean => conferencia != null && conferencia.bate === false

export type ValoresConferenciaFatura = {
    valorCabecalho: number | null
    somaTransacoes: number | null
    diferenca: number | null
}

export const valoresConferenciaFatura = (
    conferencia?: FaturaConferencia | null,
): ValoresConferenciaFatura | null => {
    if (!conferenciaFaturaDiverge(conferencia) || !conferencia) return null
    const valorCabecalho = moneyOrNull(conferencia.valor_cabecalho)
    const somaTransacoes = moneyOrNull(conferencia.soma_transacoes)
    const diferencaApi = moneyOrNull(conferencia.diferenca)
    const diferenca = diferencaApi != null
        ? roundMoney(diferencaApi)
        : (valorCabecalho != null && somaTransacoes != null
            ? roundMoney(valorCabecalho - somaTransacoes)
            : null)
    return { valorCabecalho, somaTransacoes, diferenca }
}
