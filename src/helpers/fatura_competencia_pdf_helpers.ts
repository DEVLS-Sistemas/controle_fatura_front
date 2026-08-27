import { extractFaturaId, extractFaturaPayload } from 'interfaces/Faturas/FaturasInterface'

export type CompetenciaFaturaRef = {
    id?: number | string | null
    mes?: number | string | null
    ano?: number | string | null
    competencia?: string | null
}

export const TOOLTIP_ICONE_PDF_LISTAGEM =
    'O ícone indica que esta competência tem arquivo. Se o PDF for de outro ano, remova e envie de novo — o sistema ancora pelo ano escrito no arquivo.'

export const COPY_CONFERIR_COMPETENCIA_PDF =
    'Confira o mês e o ano lidos do arquivo. Um PDF de julho/2024 não deve ir para julho/2026.'

export const formatCompetenciaMesAno = (ref?: CompetenciaFaturaRef | null): string | null => {
    if (!ref) return null
    const raw = String(ref.competencia ?? '').trim()
    if (raw) return raw.replace(/-/g, '/')
    const mes = Number(ref.mes)
    const ano = Number(ref.ano)
    if (!Number.isFinite(mes) || mes < 1 || mes > 12) return null
    if (!Number.isFinite(ano) || ano < 1000) return null
    return `${String(mes).padStart(2, '0')}/${ano}`
}

export const destinoFaturaDoAnexo = (result: unknown): CompetenciaFaturaRef | null => {
    const data = extractFaturaPayload(result)
    const id = extractFaturaId(result)
    if (!data && id == null) return null
    const mes = data?.mes ?? null
    const ano = data?.ano ?? null
    const competencia = data?.competencia ?? null
    if (id == null && mes == null && ano == null && !competencia) return null
    return { id, mes, ano, competencia }
}

export const anexoFoiParaOutraFatura = (
    origem?: CompetenciaFaturaRef | null,
    destino?: CompetenciaFaturaRef | null,
): boolean => {
    if (!destino) return false
    if (origem?.id != null && destino.id != null && Number(origem.id) !== Number(destino.id)) {
        return true
    }
    const origemComp = formatCompetenciaMesAno(origem)
    const destinoComp = formatCompetenciaMesAno(destino)
    return Boolean(origemComp && destinoComp && origemComp !== destinoComp)
}

export const mensagemPdfVinculadoCompetencia = (
    destino?: CompetenciaFaturaRef | null,
    fallback = 'Arquivo enviado com sucesso',
): string => {
    const competencia = formatCompetenciaMesAno(destino)
    if (!competencia) return fallback
    return `PDF vinculado à fatura ${competencia}.`
}
