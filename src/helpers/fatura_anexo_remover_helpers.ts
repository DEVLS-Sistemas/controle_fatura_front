import {
    ImpactoRemoverAnexo,
    ImpactoRemoverAnexoMotivo,
    MotivoRemoverAnexo,
    TipoRemoverAnexo,
} from 'interfaces/Faturas/FaturasInterface'

/** Etapa 2: POST `/remover-anexo` com `motivo=remover`. */
export const POST_REMOVER_ANEXO_HABILITADO = true

/** Etapa 3: POST multipart com `motivo=trocar_pdf`. */
export const POST_TROCAR_PDF_HABILITADO = false

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
    if (!motivo) return 'Escolha um motivo para continuar'
    if (motivo === 'trocar_pdf' && !POST_TROCAR_PDF_HABILITADO) return 'Em breve: trocar o PDF'
    if (motivo === 'remover' && !POST_REMOVER_ANEXO_HABILITADO) return 'Em breve: confirmar remoção'
    return ''
}

export const podeContinuarRemoverAnexo = (motivo?: string | null): boolean => {
    if (!motivo) return false
    if (motivo === 'trocar_pdf') return POST_TROCAR_PDF_HABILITADO
    if (motivo === 'remover') return POST_REMOVER_ANEXO_HABILITADO
    return false
}

export const tipoParaPostRemoverAnexo = (
    tipo?: TipoRemoverAnexo | null,
    impacto?: Pick<ImpactoRemoverAnexo, 'tem_pdf' | 'tem_csv'> | null,
): TipoRemoverAnexo | undefined => {
    const temPdf = impacto?.tem_pdf === true
    const temCsv = impacto?.tem_csv === true
    if (temPdf && temCsv) return tipo ?? 'ambos'
    return undefined
}

const rotuloAnexo = (
    tipo?: TipoRemoverAnexo | null,
    impacto?: Pick<ImpactoRemoverAnexo, 'tem_pdf' | 'tem_csv'> | null,
): 'PDF' | 'CSV' | 'anexo' => {
    if (tipo === 'csv' || (!tipo && impacto?.tem_csv && !impacto?.tem_pdf)) return 'CSV'
    if (tipo === 'ambos' || (!tipo && impacto?.tem_pdf && impacto?.tem_csv)) return 'anexo'
    return 'PDF'
}

export const tituloConfirmacaoRemoverAnexo = (
    competencia?: string | null,
    tipo?: TipoRemoverAnexo | null,
    impacto?: Pick<ImpactoRemoverAnexo, 'tem_pdf' | 'tem_csv'> | null,
): string => {
    const rotulo = rotuloAnexo(tipo, impacto)
    const comp = competencia?.trim()
    return comp ? `Remover o ${rotulo} de ${comp}?` : `Remover o ${rotulo} desta competência?`
}

export const TEXTO_CONFIRMACAO_REMOVER_ANEXO =
    'Isso apaga o extrato importado e as parcelas que este arquivo criou em outras faturas. As compras que você cadastrou não serão apagadas — elas voltam a aparecer para conciliar.'

export const labelConfirmarRemoverAnexo = (
    tipo?: TipoRemoverAnexo | null,
    impacto?: Pick<ImpactoRemoverAnexo, 'tem_pdf' | 'tem_csv'> | null,
): string => {
    const rotulo = rotuloAnexo(tipo, impacto)
    if (rotulo === 'CSV') return 'Remover CSV'
    if (rotulo === 'anexo') return 'Remover anexo'
    return 'Remover PDF'
}

export const stubsExcluidosComCompetencia = (
    excluidas?: Array<number | { id: number; competencia?: string }> | null,
    preview?: Array<{ id: number; competencia?: string }> | null,
): Array<{ id: number; competencia: string }> => {
    if (!excluidas?.length) return []
    const byId = new Map((preview ?? []).map((s) => [s.id, s.competencia]))
    return excluidas.map((item) => {
        if (typeof item === 'number') {
            return { id: item, competencia: byId.get(item) || String(item) }
        }
        return {
            id: item.id,
            competencia: item.competencia || byId.get(item.id) || String(item.id),
        }
    })
}

export const textoStubsExcluidos = (competencias: string[]): string | null => {
    if (!competencias.length) return null
    if (competencias.length === 1) {
        return `A competência ${competencias[0]} era só projeção deste PDF e foi removida.`
    }
    return `As competências ${competencias.join(', ')} eram só projeção deste PDF e foram removidas.`
}
