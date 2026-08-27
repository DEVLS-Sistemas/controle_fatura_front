import { extractImpactoRemoverAnexo, extractRemoverAnexoResult, ImpactoRemoverAnexo } from 'interfaces/Faturas/FaturasInterface'
import {
    apoioMotivoRemoverAnexo,
    avisosImpactoRemoverAnexo,
    hintContinuarRemoverAnexo,
    labelBotaoRemoverAnexo,
    labelConfirmarRemoverAnexo,
    labelStatusConciliacaoImpacto,
    motivosRemoverAnexo,
    MOTIVOS_REMOVER_ANEXO_FALLBACK,
    podeContinuarRemoverAnexo,
    podeRemoverAnexo,
    stubsExcluidosComCompetencia,
    subtituloModalRemoverAnexo,
    textoStubsExcluidos,
    tipoParaPostRemoverAnexo,
    tituloConfirmacaoRemoverAnexo,
    tituloModalRemoverAnexo,
} from './fatura_anexo_remover_helpers'

describe('podeRemoverAnexo', () => {
    it('esconde o botão enquanto a fatura está processando', () => {
        expect(podeRemoverAnexo({
            pode_remover_anexo: true,
            tem_pdf: true,
            status: 'processando',
        })).toBe(false)
    })

    it('respeita o flag da API quando vier', () => {
        expect(podeRemoverAnexo({ tem_pdf: true, status: 'processada', pode_remover_anexo: true })).toBe(true)
        expect(podeRemoverAnexo({ tem_pdf: true, status: 'processada', pode_remover_anexo: false })).toBe(false)
    })

    it('faz fallback para anexo + status quando o flag não vier', () => {
        expect(podeRemoverAnexo({ tem_pdf: true, status: 'processada' })).toBe(true)
        expect(podeRemoverAnexo({ tem_csv: true, status: 'pendente' })).toBe(true)
        expect(podeRemoverAnexo({ tem_pdf: false, tem_csv: false, status: 'pendente' })).toBe(false)
    })

    it('não mostra o botão em stub sem anexo', () => {
        expect(podeRemoverAnexo({
            status: 'pendente',
            tem_pdf: false,
            tem_csv: false,
            arquivo_pdf: null,
            arquivo_csv: null,
        })).toBe(false)
    })
})

describe('labelBotaoRemoverAnexo', () => {
    it('usa PDF, CSV ou menu conforme o anexo', () => {
        expect(labelBotaoRemoverAnexo({ temPdf: true, temCsv: false })).toBe('Remover PDF')
        expect(labelBotaoRemoverAnexo({ temPdf: false, temCsv: true })).toBe('Remover CSV')
        expect(labelBotaoRemoverAnexo({ temPdf: true, temCsv: true })).toBe('Remover anexo…')
    })
})

describe('tituloModalRemoverAnexo', () => {
    it('varia o título pelo tipo escolhido', () => {
        expect(tituloModalRemoverAnexo('pdf')).toBe('Remover o PDF desta fatura?')
        expect(tituloModalRemoverAnexo('csv')).toBe('Remover o CSV desta fatura?')
        expect(tituloModalRemoverAnexo('ambos')).toBe('Remover o anexo desta fatura?')
    })

    it('cai no CSV quando o impacto só tem CSV', () => {
        expect(tituloModalRemoverAnexo(null, { tem_pdf: false, tem_csv: true }))
            .toBe('Remover o CSV desta fatura?')
    })
})

describe('subtituloModalRemoverAnexo', () => {
    it('junta cartão, bandeira e competência', () => {
        expect(subtituloModalRemoverAnexo({
            cartao_nome: 'Sofisa',
            bandeira: 'Mastercard',
            competencia: '08/2026',
        })).toBe('Sofisa · Mastercard · 08/2026')
    })
})

describe('motivosRemoverAnexo', () => {
    it('usa os motivos da API quando vierem', () => {
        expect(motivosRemoverAnexo({
            motivos: [{ value: 'remover', label: 'Só tirar' }],
        })).toEqual([{ value: 'remover', label: 'Só tirar' }])
    })

    it('cai no fallback das duas opções', () => {
        expect(motivosRemoverAnexo({ motivos: [] })).toEqual(MOTIVOS_REMOVER_ANEXO_FALLBACK)
        expect(motivosRemoverAnexo(null)).toEqual(MOTIVOS_REMOVER_ANEXO_FALLBACK)
    })
})

describe('apoioMotivoRemoverAnexo', () => {
    it('explica troca e remoção em linguagem humana', () => {
        expect(apoioMotivoRemoverAnexo('trocar_pdf')).toMatch(/PDF certo/)
        expect(apoioMotivoRemoverAnexo('remover')).toMatch(/não são apagadas/)
        expect(apoioMotivoRemoverAnexo('outro')).toBe('')
    })
})

describe('avisosImpactoRemoverAnexo', () => {
    it('usa avisos da API quando existirem', () => {
        expect(avisosImpactoRemoverAnexo({
            fatura_id: 1,
            avisos: ['42 lançamentos importados deste PDF serão apagados nesta fatura.'],
        })).toEqual(['42 lançamentos importados deste PDF serão apagados nesta fatura.'])
    })

    it('monta fallback a partir dos totais', () => {
        const impacto: ImpactoRemoverAnexo = {
            fatura_id: 73,
            lancamentos_deste_anexo: { quantidade: 42, valor_total: 10 },
            parcelas_geradas_outras_faturas: { quantidade: 18, valor_total: 20, faturas_afetadas: [] },
            compras_que_voltam_a_conciliar: [{
                id: 901,
                texto_compra: 'Mouse Logitech',
                valor: 249.9,
                data: '2026-08-23',
            }],
        }
        expect(avisosImpactoRemoverAnexo(impacto)).toEqual([
            '42 lançamentos deste PDF serão apagados nesta fatura',
            '18 parcelas automáticas em outras competências serão apagadas',
            '1 compras manuais voltam a precisar de conciliação',
        ])
    })
})

describe('labelStatusConciliacaoImpacto', () => {
    it('traduz os status conhecidos', () => {
        expect(labelStatusConciliacaoImpacto('conciliada')).toBe('Conciliada')
        expect(labelStatusConciliacaoImpacto('nao_conciliada')).toBe('Precisa conciliar')
        expect(labelStatusConciliacaoImpacto('pendente')).toBe('Pendente')
    })
})

describe('continuar da etapa 2', () => {
    it('libera Continuar só para “apenas remover”', () => {
        expect(podeContinuarRemoverAnexo(null)).toBe(false)
        expect(hintContinuarRemoverAnexo(null)).toBe('Escolha um motivo para continuar')
        expect(podeContinuarRemoverAnexo('remover')).toBe(true)
        expect(hintContinuarRemoverAnexo('remover')).toBe('')
        expect(podeContinuarRemoverAnexo('trocar_pdf')).toBe(false)
        expect(hintContinuarRemoverAnexo('trocar_pdf')).toBe('Em breve: trocar o PDF')
    })
})

describe('extractImpactoRemoverAnexo', () => {
    it('lê o envelope data da API', () => {
        expect(extractImpactoRemoverAnexo({
            status: true,
            message: 'Impacto da remoção do anexo',
            data: { fatura_id: 73, tem_pdf: true },
        })).toEqual({ fatura_id: 73, tem_pdf: true })
    })

    it('devolve null quando o payload não é de impacto', () => {
        expect(extractImpactoRemoverAnexo(null)).toBeNull()
        expect(extractImpactoRemoverAnexo({ status: true, data: { id: 1 } })).toBeNull()
    })
})

describe('tipoParaPostRemoverAnexo', () => {
    it('omite tipo quando só existe um anexo', () => {
        expect(tipoParaPostRemoverAnexo('pdf', { tem_pdf: true, tem_csv: false })).toBeUndefined()
        expect(tipoParaPostRemoverAnexo('csv', { tem_pdf: false, tem_csv: true })).toBeUndefined()
    })

    it('envia o recorte quando PDF e CSV coexistem', () => {
        expect(tipoParaPostRemoverAnexo('pdf', { tem_pdf: true, tem_csv: true })).toBe('pdf')
        expect(tipoParaPostRemoverAnexo('csv', { tem_pdf: true, tem_csv: true })).toBe('csv')
        expect(tipoParaPostRemoverAnexo('ambos', { tem_pdf: true, tem_csv: true })).toBe('ambos')
    })
})

describe('tituloConfirmacaoRemoverAnexo', () => {
    it('usa a competência no título destrutivo', () => {
        expect(tituloConfirmacaoRemoverAnexo('08/2026', 'pdf')).toBe('Remover o PDF de 08/2026?')
        expect(tituloConfirmacaoRemoverAnexo('08/2026', 'csv')).toBe('Remover o CSV de 08/2026?')
        expect(labelConfirmarRemoverAnexo('pdf')).toBe('Remover PDF')
        expect(labelConfirmarRemoverAnexo('csv')).toBe('Remover CSV')
    })
})

describe('stubsExcluidosComCompetencia', () => {
    it('resolve competência dos ids com o preview', () => {
        expect(stubsExcluidosComCompetencia(
            [74],
            [{ id: 74, competencia: '09/2026' }],
        )).toEqual([{ id: 74, competencia: '09/2026' }])
        expect(textoStubsExcluidos(['09/2026']))
            .toBe('A competência 09/2026 era só projeção deste PDF e foi removida.')
    })
})

describe('extractRemoverAnexoResult', () => {
    it('lê o envelope e a message da API', () => {
        expect(extractRemoverAnexoResult({
            status: true,
            message: 'Anexo removido. 1 compra voltou a precisar de conciliação.',
            data: {
                fatura_id: 73,
                anexo_removido: true,
                compras_que_voltaram_a_conciliar: [{ id: 901, texto_compra: 'Mouse', valor: 10, data: '2026-08-23' }],
            },
        })).toMatchObject({
            fatura_id: 73,
            anexo_removido: true,
            message: 'Anexo removido. 1 compra voltou a precisar de conciliação.',
        })
    })
})
