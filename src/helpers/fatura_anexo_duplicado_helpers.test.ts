import { FaturaAnexoDuplicadoError } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { FaturaCartaoTitularError } from 'libs/api/exceptions/FaturaCartaoTitularError'
import { FaturaTitularError } from 'libs/api/exceptions/FaturaTitularError'
import { FaturaMetadadosError } from 'libs/api/exceptions/FaturaMetadadosError'
import { FaturaSelecaoError } from 'libs/api/exceptions/FaturaSelecaoError'
import {
    anexoDuplicadoRetryFields,
    copySubstituirAnexo,
    extractFaturaMessage,
    faturaExistenteEmProcessamento,
    podeSubstituirAnexoDuplicado,
    rotuloCartaoBandeira,
    rotuloCicloFatura,
    rotuloCompetenciaFatura,
    rotuloValorTransacoes,
    statusFaturaLabel,
} from './fatura_anexo_duplicado_helpers'

const bodyDuplicado = {
    error: true,
    message: 'Este arquivo já foi anexado em outra fatura. Deseja substituir o anexo ou manter o que já está salvo?',
    codigo: 'anexo_duplicado',
    anexo_duplicado: true,
    orientacao: 'O conteúdo deste PDF/CSV é o mesmo da fatura Nubank 08/2026 (LEONARDO S FERREIRA).',
    fatura_existente: {
        id: 643,
        cartao_id: 33,
        cartao_nome: 'Nubank',
        bandeira: 'Mastercard',
        pessoa_id: 6,
        pessoa_nome: 'LEONARDO S FERREIRA',
        mes: 8,
        ano: 2026,
        competencia: '08/2026',
        periodo_inicio: '2026-07-06',
        periodo_fim: '2026-08-05',
        data_vencimento: '2026-08-10',
        valor_total: '6138.97',
        status: 'processada',
        total_transacoes: 34,
        tem_pdf: true,
        pdf_url: 'http://10.0.0.164:5000/api/v1/faturas/pdf/643',
    },
}

describe('FaturaAnexoDuplicadoError', () => {
    it('reconhece codigo ou flag', () => {
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody({ codigo: 'anexo_duplicado' })).toBe(true)
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody({ anexo_duplicado: true })).toBe(true)
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody({ message: 'já existe' })).toBe(false)
    })

    it('não trata precisa_cartao_do_titular como duplicata de anexo', () => {
        const cartaoTitular = {
            codigo: 'precisa_cartao_do_titular',
            precisa_cartao_do_titular: true,
        }
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody(cartaoTitular)).toBe(false)
        expect(FaturaCartaoTitularError.isCartaoTitularBody(cartaoTitular)).toBe(true)
    })

    it('não é capturado pelos outros gates de 422', () => {
        expect(FaturaTitularError.isTitularBody(bodyDuplicado)).toBe(false)
        expect(FaturaMetadadosError.isMetadadosBody(bodyDuplicado)).toBe(false)
        expect(FaturaSelecaoError.isSelecaoBody(bodyDuplicado)).toBe(false)
        expect(FaturaCartaoTitularError.isCartaoTitularBody(bodyDuplicado)).toBe(false)
    })

    it('lê fatura_existente e orientação', () => {
        const error = new FaturaAnexoDuplicadoError(bodyDuplicado)
        expect(error.anexo_duplicado).toBe(true)
        expect(error.fatura_existente?.id).toBe(643)
        expect(error.fatura_existente?.pessoa_nome).toBe('LEONARDO S FERREIRA')
        expect(error.orientacao).toContain('Nubank 08/2026')
    })
})

describe('faturaExistenteEmProcessamento', () => {
    it('desabilita substituir só enquanto processando', () => {
        expect(faturaExistenteEmProcessamento({ status: 'processando' })).toBe(true)
        expect(podeSubstituirAnexoDuplicado({ status: 'processando' })).toBe(false)
        expect(podeSubstituirAnexoDuplicado({ status: 'processada' })).toBe(true)
        expect(podeSubstituirAnexoDuplicado({ status: 'pendente' })).toBe(true)
    })
})

describe('rótulos do card', () => {
    it('monta cartão, ciclo, competência e valor', () => {
        const fatura = bodyDuplicado.fatura_existente
        expect(rotuloCartaoBandeira(fatura)).toBe('Nubank · Mastercard')
        expect(rotuloCompetenciaFatura(fatura)).toBe('08/2026')
        expect(rotuloCicloFatura(fatura)).toBe('06/07/2026 – 05/08/2026')
        expect(rotuloValorTransacoes(fatura)).toContain('34 transações')
        expect(copySubstituirAnexo(fatura)).toContain('fatura 08/2026')
        expect(statusFaturaLabel('processada')).toBe('Processada')
    })
})

describe('anexoDuplicadoRetryFields', () => {
    it('envia a flag e o id da fatura existente', () => {
        expect(anexoDuplicadoRetryFields('substituir', 643)).toEqual({
            confirmar_anexo_duplicado: 'substituir',
            fatura_duplicada_id: 643,
        })
        expect(anexoDuplicadoRetryFields('manter', 643)).toEqual({
            confirmar_anexo_duplicado: 'manter',
            fatura_duplicada_id: 643,
        })
    })
})

describe('extractFaturaMessage', () => {
    it('lê message do envelope fatura.data', () => {
        expect(extractFaturaMessage({
            fatura: { data: { id: 643 }, status: true, message: 'Anexo mantido. Nenhuma fatura nova foi criada.' },
        })).toBe('Anexo mantido. Nenhuma fatura nova foi criada.')
        expect(extractFaturaMessage({ message: 'ok' })).toBe('ok')
        expect(extractFaturaMessage(null)).toBeNull()
    })
})
