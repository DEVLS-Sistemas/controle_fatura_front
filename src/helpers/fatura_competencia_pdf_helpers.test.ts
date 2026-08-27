import {
    anexoFoiParaOutraFatura,
    destinoFaturaDoAnexo,
    formatCompetenciaMesAno,
    mensagemPdfVinculadoCompetencia,
} from './fatura_competencia_pdf_helpers'

describe('formatCompetenciaMesAno', () => {
    it('usa competencia pronta ou monta mês/ano com o ano do arquivo', () => {
        expect(formatCompetenciaMesAno({ competencia: '07/2024' })).toBe('07/2024')
        expect(formatCompetenciaMesAno({ mes: 7, ano: 2024 })).toBe('07/2024')
        expect(formatCompetenciaMesAno({ mes: '7', ano: '2024' })).toBe('07/2024')
        expect(formatCompetenciaMesAno({ mes: 7 })).toBeNull()
        expect(formatCompetenciaMesAno({})).toBeNull()
    })
})

describe('destinoFaturaDoAnexo', () => {
    it('lê data.id / mes / ano da fatura que recebeu o arquivo', () => {
        expect(destinoFaturaDoAnexo({
            status: true,
            data: { id: 801, mes: 7, ano: 2024, tem_pdf: true, status: 'pendente' },
        })).toEqual({
            id: 801,
            mes: 7,
            ano: 2024,
            competencia: null,
        })
    })
})

describe('anexoFoiParaOutraFatura', () => {
    it('detecta realocação por id ou por competência', () => {
        expect(anexoFoiParaOutraFatura(
            { id: 645, mes: 7, ano: 2026 },
            { id: 801, mes: 7, ano: 2024 },
        )).toBe(true)
        expect(anexoFoiParaOutraFatura(
            { id: 645, mes: 7, ano: 2026 },
            { id: 645, mes: 7, ano: 2024 },
        )).toBe(true)
        expect(anexoFoiParaOutraFatura(
            { id: 692, mes: 8, ano: 2026 },
            { id: 692, mes: 8, ano: 2026 },
        )).toBe(false)
    })
})

describe('mensagemPdfVinculadoCompetencia', () => {
    it('cita a competência real do arquivo', () => {
        expect(mensagemPdfVinculadoCompetencia({ mes: 7, ano: 2024 }))
            .toBe('PDF vinculado à fatura 07/2024.')
        expect(mensagemPdfVinculadoCompetencia(null, 'Arquivo enviado com sucesso'))
            .toBe('Arquivo enviado com sucesso')
    })
})
