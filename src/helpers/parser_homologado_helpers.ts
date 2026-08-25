import {
    CARTAO_PRESETS_CORES_PADRAO,
    matchPresetCorCartao,
    ParCorLookup,
    ParserHomologado,
    PARSERS_HOMOLOGADOS_PADRAO,
    PresetCorLookup,
} from 'interfaces/Cartoes/CartoesInterface'

export const AVISO_PARSER_NAO_HOMOLOGADO =
    'A leitura automática desta fatura ainda não está homologada. Os valores extraídos do arquivo podem não ser os corretos.'

const PARSER_CHAVES_NAO_HOMOLOGADAS = new Set(['generico', 'csv', 'xml'])

export const parsersHomologadosOrFallback = (
    list?: ParserHomologado[] | null
): ParserHomologado[] => (list?.length ? list : PARSERS_HOMOLOGADOS_PADRAO)

export const normalizeParserChave = (parser?: string | null): string => {
    const key = String(parser ?? '').trim().toLowerCase()
    if (key === 'inter-csv') return 'inter'
    return key
}

export const parserHomologadoByChave = (
    chave?: string | null,
    parsers?: ParserHomologado[] | null
): ParserHomologado | null => {
    const key = normalizeParserChave(chave)
    if (!key || PARSER_CHAVES_NAO_HOMOLOGADAS.has(key)) return null
    return parsersHomologadosOrFallback(parsers).find((p) => p.chave === key) ?? null
}

export const isParserChaveHomologada = (
    parser?: string | null,
    parsers?: ParserHomologado[] | null
): boolean => Boolean(parserHomologadoByChave(parser, parsers))

export const formatParsersHomologadosLista = (
    parsers?: ParserHomologado[] | null
): string => {
    const labels = parsersHomologadosOrFallback(parsers).map((p) => p.label)
    if (labels.length === 0) return ''
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return `${labels[0]} e ${labels[1]}`
    return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`
}

export const notasParsersHomologados = (
    parsers?: ParserHomologado[] | null
): ParserHomologado[] =>
    parsersHomologadosOrFallback(parsers).filter((p) => Boolean(p.nota?.trim()))

export type CartaoHomologacaoSource = {
    nome?: string | null
    banco?: string | null
    importacao_pdf_homologada?: boolean
    parser_homologado?: ParserHomologado | null
    parser?: string | null
}

export type CartaoHomologacaoResolvida = {
    homologada: boolean
    parser: ParserHomologado | null
}

const parserFromNomeBanco = (
    source: CartaoHomologacaoSource,
    parsers: ParserHomologado[],
    presets?: PresetCorLookup[]
): ParserHomologado | null => {
    const matched = matchPresetCorCartao(
        source.nome,
        source.banco,
        presets ?? CARTAO_PRESETS_CORES_PADRAO
    )
    if (!matched.chave || matched.padrao || matched.chave === 'padrao') return null
    return parserHomologadoByChave(matched.chave, parsers)
}

export const resolveCartaoHomologacao = (
    source?: CartaoHomologacaoSource | null,
    parsers?: ParserHomologado[] | null,
    presets?: PresetCorLookup[]
): CartaoHomologacaoResolvida => {
    const list = parsersHomologadosOrFallback(parsers)
    if (!source) return { homologada: false, parser: null }

    const fromFlagParser = source.parser_homologado
        ?? parserFromNomeBanco(source, list, presets)
        ?? parserHomologadoByChave(source.parser, list)

    if (typeof source.importacao_pdf_homologada === 'boolean') {
        return {
            homologada: source.importacao_pdf_homologada,
            parser: source.importacao_pdf_homologada ? (fromFlagParser ?? source.parser_homologado ?? null) : (source.parser_homologado ?? null),
        }
    }

    if (source.parser_homologado) {
        return { homologada: true, parser: source.parser_homologado }
    }

    if (source.parser) {
        const parser = parserHomologadoByChave(source.parser, list)
        return { homologada: Boolean(parser), parser }
    }

    const parser = parserFromNomeBanco(source, list, presets)
    return { homologada: Boolean(parser), parser }
}

export const isParCorPdfHomologado = (
    par: ParCorLookup,
    parsers?: ParserHomologado[] | null
): boolean => {
    if (par.padrao || par.chave === 'padrao') return false
    if (typeof par.importacao_pdf_homologada === 'boolean') {
        return par.importacao_pdf_homologada
    }
    return isParserChaveHomologada(par.chave, parsers)
}

export const tooltipParCorCartao = (
    par: ParCorLookup,
    parsers?: ParserHomologado[] | null
): string => {
    const label = par.label || 'Cor'
    if (par.padrao || par.chave === 'padrao') return label
    if (isParCorPdfHomologado(par, parsers)) {
        const parser = par.parser_homologado ?? parserHomologadoByChave(par.chave, parsers)
        const base = parser?.label ? `PDF homologado — ${parser.label}` : 'PDF homologado'
        return parser?.nota ? `${base}. ${parser.nota}` : base
    }
    return 'Cor oficial — importação de PDF ainda não homologada'
}

export const textoFormCartaoHomologacao = (
    homologacao: CartaoHomologacaoResolvida,
    parsers?: ParserHomologado[] | null
): { homologada: boolean; texto: string } => {
    if (homologacao.homologada && homologacao.parser) {
        const nota = homologacao.parser.nota?.trim()
        return {
            homologada: true,
            texto: nota
                ? `Importação de fatura (PDF/CSV) homologada para ${homologacao.parser.label}. ${nota}.`
                : `Importação de fatura (PDF/CSV) homologada para ${homologacao.parser.label}.`,
        }
    }
    const lista = formatParsersHomologadosLista(parsers)
    return {
        homologada: false,
        texto: lista
            ? `Você pode cadastrar este cartão. A leitura automática de PDF ainda não foi testada para ele — ao anexar uma fatura, os valores podem não ser os corretos. Hoje lemos: ${lista}.`
            : 'Você pode cadastrar este cartão. A leitura automática de PDF ainda não foi testada para ele — ao anexar uma fatura, os valores podem não ser os corretos.',
    }
}

export const avisoParserOuPadrao = (aviso?: string | null): string =>
    aviso?.trim() || AVISO_PARSER_NAO_HOMOLOGADO
