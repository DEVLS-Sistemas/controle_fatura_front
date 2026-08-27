import {
    ImpactoRemoverAnexo,
    ImpactoRemoverAnexoMotivo,
    MotivoRemoverAnexo,
    TipoRemoverAnexo,
} from 'interfaces/Faturas/FaturasInterface'

/** Etapa 2 liga o POST `/remover-anexo`. Enquanto false, Continuar fica desabilitado. */
export const POST_REMOVER_ANEXO_HABILITADO = false

export const TOOLTIP_REMOVER_ANEXO =
    'Desfaz o extrato deste arquivo: apaga lançamentos importados e parcelas que este PDF criou em outras competências.'

export const MOTIVOS_REMOVER_ANEXO_FALLBACK: ImpactoRemoverAnexoMotivo[] = [
    { value: 'trocar_pdf', label: 'PDF incorreto — quero trocar' },
    { value: 'remover', label: 'Apenas remover' },
]

export const MOTIVO_REMOVER_ANEXO_APOIO: Record<MotivoRemoverAnexo, string> = {
    trocar_pdf:
        'O arquivo desta competência está errado. Você escolhe o PDF certo, vê o preview e as compras conciliadas neste extrato poderão ser vinculadas de novo no arquivo correto.',
    remover:
        'Remove o extrato desta fatura. Lançamentos importados e parcelas que este PDF criou em faturas anteriores/futuras são apagados. Compras que você cadastrou não são apagadas — voltam a aparecer como “precisa conciliar”.',
}

export const podeRemoverAnexo = (fatura: {
    pode_remover_anexo?: boolean | null
    tem_pdf?: boolean
    tem_csv?: boolean
    arquivo_pdf?: string | null
    arquivo_csv?: string | null
    status?: string | null
}): boolean => {
    if (String(fatura.status ?? '').toLowerCase() === 'processando') return false
    if (typeof fatura.pode_remover_anexo === 'boolean') return fatura.pode_remover_anexo
    const temPdf = fatura.tem_pdf === true || Boolean(fatura.arquivo_pdf)
    const temCsv = fatura.tem_csv === true || Boolean(fatura.arquivo_csv)
    return temPdf || temCsv
}

export const labelBotaoRemoverAnexo = (anexo: {
    temPdf: boolean
    temCsv: boolean
}): string => {
    if (anexo.temPdf && anexo.temCsv) return 'Remover anexo…'
    if (anexo.temCsv && !anexo.temPdf) return 'Remover CSV'
    return 'Remover PDF'
}

export const tituloModalRemoverAnexo = (
    tipo?: TipoRemoverAnexo | null,
    impacto?: Pick<ImpactoRemoverAnexo, 'tem_pdf' | 'tem_csv'> | null,
): string => {
    if (tipo === 'csv' || (!tipo && impacto?.tem_csv && !impacto?.tem_pdf)) {
        return 'Remover o CSV desta fatura?'
    }
    if (tipo === 'ambos' || (!tipo && impacto?.tem_pdf && impacto?.tem_csv)) {
        return 'Remover o anexo desta fatura?'
    }
    return 'Remover o PDF desta fatura?'
}

export const subtituloModalRemoverAnexo = (impacto?: {
    cartao_nome?: string | null
    bandeira?: string | null
    competencia?: string | null
} | null): string =>
    [impacto?.cartao_nome, impacto?.bandeira, impacto?.competencia].filter(Boolean).join(' · ')

export const motivosRemoverAnexo = (
    impacto?: Pick<ImpactoRemoverAnexo, 'motivos'> | null,
): ImpactoRemoverAnexoMotivo[] => {
    const fromApi = (impacto?.motivos ?? []).filter((m) => m?.value)
    return fromApi.length > 0 ? fromApi : MOTIVOS_REMOVER_ANEXO_FALLBACK
}

export const apoioMotivoRemoverAnexo = (value?: string | null): string => {
    if (value === 'trocar_pdf' || value === 'remover') {
        return MOTIVO_REMOVER_ANEXO_APOIO[value]
    }
    return ''
}

export const avisosImpactoRemoverAnexo = (
    impacto?: ImpactoRemoverAnexo | null,
): string[] => {
    const fromApi = (impacto?.avisos ?? []).map((a) => String(a).trim()).filter(Boolean)
    if (fromApi.length > 0) return fromApi
    if (!impacto) return []

    const avisos: string[] = []
    const qLanc = Number(impacto.lancamentos_deste_anexo?.quantidade ?? 0)
    const qParc = Number(impacto.parcelas_geradas_outras_faturas?.quantidade ?? 0)
    const qComp = impacto.compras_que_voltam_a_conciliar?.length ?? 0

    if (qLanc > 0) {
        avisos.push(`${qLanc} lançamentos deste PDF serão apagados nesta fatura`)
    }
    if (qParc > 0) {
        avisos.push(`${qParc} parcelas automáticas em outras competências serão apagadas`)
    }
    if (qComp > 0) {
        avisos.push(`${qComp} compras manuais voltam a precisar de conciliação`)
    }
    return avisos
}

export const labelStatusConciliacaoImpacto = (status?: string | null): string => {
    switch (String(status ?? '').trim()) {
        case 'conciliada':
            return 'Conciliada'
        case 'nao_conciliada':
            return 'Precisa conciliar'
        case 'pendente':
            return 'Pendente'
        default:
            return status?.trim() || '-'
    }
}

export const hintContinuarRemoverAnexo = (motivo?: string | null): string => {
    if (!POST_REMOVER_ANEXO_HABILITADO) return 'Em breve: confirmar remoção'
    if (!motivo) return 'Escolha um motivo para continuar'
    return ''
}

export const podeContinuarRemoverAnexo = (motivo?: string | null): boolean =>
    POST_REMOVER_ANEXO_HABILITADO && Boolean(motivo)
