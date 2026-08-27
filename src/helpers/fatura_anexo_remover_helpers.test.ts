import {
    extractComprasParaReconcilia,
    extractImpactoRemoverAnexo,
    extractRemoverAnexoResult,
    ImpactoRemoverAnexo,
} from 'interfaces/Faturas/FaturasInterface'
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
    arquivoTrocaEhPdf,
    formatTamanhoArquivo,
    primeirasLinhasCsv,
    labelUsarArquivoTroca,
    precisaPollProcessamentoFatura,
    faturaProcessamentoTerminou,
    candidatoSugeridoReconcilia,
    comprasPendentesReconcilia,
    compraRestauradaParaReconcilia,
    TOAST_RECONCILIA_AUTO,
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

describe('continuar da etapa 3', () => {
    it('libera Continuar para remover e para trocar PDF', () => {
        expect(podeContinuarRemoverAnexo(null)).toBe(false)
        expect(hintContinuarRemoverAnexo(null)).toBe('Escolha um motivo para continuar')
        expect(podeContinuarRemoverAnexo('remover')).toBe(true)
        expect(hintContinuarRemoverAnexo('remover')).toBe('')
        expect(podeContinuarRemoverAnexo('trocar_pdf')).toBe(true)
        expect(hintContinuarRemoverAnexo('trocar_pdf')).toBe('')
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

describe('preview local do arquivo novo', () => {
    it('reconhece PDF e formata tamanho', () => {
        const pdf = new File(['%PDF'], 'fatura.pdf', { type: 'application/pdf' })
        const csv = new File(['a;b'], 'fatura.csv', { type: 'text/csv' })
        expect(arquivoTrocaEhPdf(pdf)).toBe(true)
        expect(arquivoTrocaEhPdf(csv)).toBe(false)
        expect(labelUsarArquivoTroca(pdf)).toBe('Usar este PDF')
        expect(labelUsarArquivoTroca(csv)).toBe('Usar este CSV')
        expect(formatTamanhoArquivo(512)).toBe('512 B')
        expect(primeirasLinhasCsv('a\nb\nc\nd', 2)).toBe('a\nb')
    })
})

describe('poll do processamento', () => {
    it('poll enquanto aguarda job; termina em processada ou erro', () => {
        expect(precisaPollProcessamentoFatura({ aguardando_processamento: true, status: 'pendente' })).toBe(true)
        expect(precisaPollProcessamentoFatura({ status: 'processada' })).toBe(false)
        expect(faturaProcessamentoTerminou('processada')).toBe(true)
        expect(faturaProcessamentoTerminou('erro')).toBe(true)
        expect(faturaProcessamentoTerminou('processando')).toBe(false)
    })
})

describe('extractComprasParaReconcilia', () => {
    it('mapeia estabelecimento do candidato para estabelecimento_nome', () => {
        const payload = extractComprasParaReconcilia({
            status: true,
            data: {
                fatura_id: 73,
                status: 'processada',
                compras_para_conciliar: [{
                    id: 901,
                    texto_compra: 'Mouse Logitech',
                    valor: 249.9,
                    data: '2026-08-23',
                    precisa_conciliar: true,
                    candidatos: [{
                        id: 1204,
                        estabelecimento: 'PAG*LOJA XYZ',
                        valor: 249.9,
                        data: '2026-08-23',
                        score: 0.92,
                        sugestao: true,
                    }],
                }],
            },
        })
        expect(payload).toMatchObject({ fatura_id: 73, status: 'processada' })
        expect(payload?.compras_para_conciliar).toHaveLength(1)
        expect(payload?.compras_para_conciliar[0].candidatos?.[0]).toMatchObject({
            id: 1204,
            lancamento_id: 1204,
            estabelecimento_nome: 'PAG*LOJA XYZ',
            sugestao: true,
            score: 0.92,
        })
    })

    it('aceita lista vazia (match exato já conciliou)', () => {
        expect(extractComprasParaReconcilia({
            data: { fatura_id: 73, compras_para_conciliar: [] },
        })).toEqual({
            fatura_id: 73,
            status: null,
            compras_para_conciliar: [],
        })
    })
})

describe('candidatoSugeridoReconcilia', () => {
    it('prefere sugestao e, na falta, o maior score', () => {
        expect(candidatoSugeridoReconcilia([
            { id: 1, estabelecimento_nome: 'A', score: 0.99, sugestao: false },
            { id: 2, estabelecimento_nome: 'B', score: 0.4, sugestao: true },
        ])?.id).toBe(2)
        expect(candidatoSugeridoReconcilia([
            { id: 1, score: 0.2 },
            { id: 3, score: 0.8 },
            { id: 2, score: 0.5 },
        ])?.id).toBe(3)
        expect(candidatoSugeridoReconcilia([])).toBeNull()
    })
})

describe('comprasPendentesReconcilia', () => {
    it('ignora compras já conciliadas e monta fallback a partir da restauração', () => {
        expect(comprasPendentesReconcilia([
            { id: 1, precisa_conciliar: true },
            { id: 2, precisa_conciliar: false },
            { id: 3 },
        ]).map((c) => c.id)).toEqual([1, 3])
        expect(compraRestauradaParaReconcilia(
            { id: 901, texto_compra: 'Mouse', valor: 10, data: '2026-08-23' },
            [{ id: 1204, estabelecimento_nome: 'PAG' }],
        )).toMatchObject({
            id: 901,
            precisa_conciliar: true,
            candidatos: [{ id: 1204 }],
        })
        expect(TOAST_RECONCILIA_AUTO).toContain('conciliadas automaticamente')
    })
})
