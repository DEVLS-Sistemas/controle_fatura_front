import {
    anosLookupToOptions,
    buildFaturasListagemSearchParams,
    buildFaturasListarApiParams,
    extractCompetenciaAtual,
    extractFaturasListagemMeta,
    extractLookupsFaturas,
    isMesAtualAtivo,
    parseAnoFiltro,
    parseFaturasListagemSearchParams,
    parseMesFiltro,
    resolveCompetenciaInicial,
} from './fatura_listagem_helpers'

const competencia = { mes: 8, ano: 2026, label: '08/2026' }

describe('parseMesFiltro / parseAnoFiltro', () => {
    it('aceita mês 1–12 e rejeita o resto', () => {
        expect(parseMesFiltro('8')).toBe(8)
        expect(parseMesFiltro(12)).toBe(12)
        expect(parseMesFiltro('0')).toBeNull()
        expect(parseMesFiltro('13')).toBeNull()
        expect(parseMesFiltro('')).toBeNull()
    })

    it('aceita ano > 2000', () => {
        expect(parseAnoFiltro('2026')).toBe(2026)
        expect(parseAnoFiltro(1999)).toBeNull()
        expect(parseAnoFiltro(null)).toBeNull()
    })
})

describe('parseFaturasListagemSearchParams', () => {
    it('lê mes/ano da query', () => {
        const url = parseFaturasListagemSearchParams(new URLSearchParams('mes=3&ano=2025'))
        expect(url.mes).toBe(3)
        expect(url.ano).toBe(2025)
        expect(url.skipDefaultMesAtual).toBe(false)
    })

    it('marca skip quando mes_atual=0 sem mes/ano', () => {
        const url = parseFaturasListagemSearchParams(new URLSearchParams('mes_atual=0'))
        expect(url.mes).toBeNull()
        expect(url.ano).toBeNull()
        expect(url.skipDefaultMesAtual).toBe(true)
    })

    it('não marca skip se há mes/ano junto de mes_atual=0', () => {
        const url = parseFaturasListagemSearchParams(new URLSearchParams('mes=8&ano=2026&mes_atual=0'))
        expect(url.skipDefaultMesAtual).toBe(false)
        expect(url.mes).toBe(8)
    })

    it('preserva outros filtros da URL', () => {
        const url = parseFaturasListagemSearchParams(
            new URLSearchParams('cartao_id=4&status=pendente&palavra_chave=nubank&page=2')
        )
        expect(url.cartao_id).toBe(4)
        expect(url.status).toBe('pendente')
        expect(url.palavra_chave).toBe('nubank')
        expect(url.page).toBe(2)
    })
})

describe('resolveCompetenciaInicial', () => {
    it('abre /faturas sem query com a competência atual', () => {
        const resolved = resolveCompetenciaInicial(
            { mes: null, ano: null, skipDefaultMesAtual: false },
            competencia,
        )
        expect(resolved).toEqual({
            mes: 8,
            ano: 2026,
            mesAtualAtivo: true,
            usarAtalhoMesAtual: false,
        })
    })

    it('respeita mes_atual=0 e não religa o default', () => {
        const resolved = resolveCompetenciaInicial(
            { mes: null, ano: null, skipDefaultMesAtual: true },
            competencia,
        )
        expect(resolved).toEqual({
            mes: null,
            ano: null,
            mesAtualAtivo: false,
            usarAtalhoMesAtual: false,
        })
    })

    it('deep-link de outro mês deixa o botão desligado', () => {
        const resolved = resolveCompetenciaInicial(
            { mes: 3, ano: 2025, skipDefaultMesAtual: false },
            competencia,
        )
        expect(resolved.mesAtualAtivo).toBe(false)
        expect(resolved.mes).toBe(3)
        expect(resolved.ano).toBe(2025)
    })

    it('deep-link do mês atual deixa o botão ligado', () => {
        const resolved = resolveCompetenciaInicial(
            { mes: 8, ano: 2026, skipDefaultMesAtual: false },
            competencia,
        )
        expect(resolved.mesAtualAtivo).toBe(true)
    })

    it('sem lookup usa o atalho mes_atual da API', () => {
        const resolved = resolveCompetenciaInicial(
            { mes: null, ano: null, skipDefaultMesAtual: false },
            null,
        )
        expect(resolved.usarAtalhoMesAtual).toBe(true)
        expect(resolved.mesAtualAtivo).toBe(true)
        expect(resolved.mes).toBeNull()
        expect(resolved.ano).toBeNull()
    })
})

describe('isMesAtualAtivo', () => {
    it('só liga quando mes e ano batem com a competência', () => {
        expect(isMesAtualAtivo(8, 2026, competencia)).toBe(true)
        expect(isMesAtualAtivo(3, 2026, competencia)).toBe(false)
        expect(isMesAtualAtivo(8, null, competencia)).toBe(false)
        expect(isMesAtualAtivo(8, 2026, null)).toBe(false)
    })
})

describe('buildFaturasListagemSearchParams', () => {
    it('grava mes/ano quando o botão está ligado', () => {
        const qs = buildFaturasListagemSearchParams({ mes: 8, ano: 2026 }).toString()
        expect(qs).toBe('mes=8&ano=2026')
    })

    it('grava mes_atual=0 quando não há recorte de competência', () => {
        const qs = buildFaturasListagemSearchParams({ cartao_id: 1 }).toString()
        expect(qs).toBe('mes_atual=0&cartao_id=1')
    })

    it('mantém outros filtros ao desmarcar o mês atual', () => {
        const qs = buildFaturasListagemSearchParams({
            status: 'pendente',
            palavra_chave: 'nubank',
        }).toString()
        expect(qs).toContain('mes_atual=0')
        expect(qs).toContain('status=pendente')
        expect(qs).toContain('palavra_chave=nubank')
        expect(qs).not.toContain('mes=')
        expect(qs).not.toContain('ano=')
    })
})

describe('buildFaturasListarApiParams', () => {
    it('não envia mes_atual=0 para a API', () => {
        const params = buildFaturasListarApiParams({
            mes: null,
            ano: null,
            mes_atual: 0,
            cartao_id: 2,
            perPage: 5,
            page: 1,
        })
        expect(params.mes_atual).toBeUndefined()
        expect(params.mes).toBeUndefined()
        expect(params.ano).toBeUndefined()
        expect(params.cartao_id).toBe(2)
    })

    it('envia mes+ano e pode enviar mes_atual=1', () => {
        expect(buildFaturasListarApiParams({ mes: 8, ano: 2026, page: 1 })).toEqual({
            mes: 8,
            ano: 2026,
            page: 1,
        })
        expect(buildFaturasListarApiParams({ mes_atual: 1, page: 1 }).mes_atual).toBe(1)
    })
})

describe('extractCompetenciaAtual / extractFaturasListagemMeta', () => {
    it('lê competencia_atual do lookup', () => {
        expect(extractCompetenciaAtual({ competencia_atual: competencia })).toEqual(competencia)
        expect(extractCompetenciaAtual({ data: { competencia_atual: competencia } })).toEqual(competencia)
    })

    it('lê filtros.mes_atual_ativo da listagem', () => {
        const meta = extractFaturasListagemMeta({
            competencia_atual: competencia,
            filtros: { mes: 8, ano: 2026, mes_atual_ativo: true },
        })
        expect(meta.filtros?.mes_atual_ativo).toBe(true)
        expect(meta.filtros?.mes).toBe(8)
        expect(meta.competencia_atual).toEqual(competencia)
    })
})

describe('extractLookupsFaturas / anosLookupToOptions', () => {
    it('aceita lookup no topo ou aninhado', () => {
        const lookups = extractLookupsFaturas({
            cartoes: [{ id: 1, nome: 'Nubank' }],
            competencia_atual: competencia,
            anos: [{ value: 2026, label: '2026' }],
        })
        expect(lookups?.cartoes).toHaveLength(1)
        expect(extractLookupsFaturas({ data: lookups })?.anos).toHaveLength(1)
    })

    it('monta options de ano com Todos', () => {
        expect(anosLookupToOptions([{ value: 2026, label: '2026' }])).toEqual([
            { value: '', label: 'Todos' },
            { value: 2026, label: '2026' },
        ])
    })
})
