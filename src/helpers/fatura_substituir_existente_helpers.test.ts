import { FaturaAnexoDuplicadoError } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { FaturaCartaoTitularError } from 'libs/api/exceptions/FaturaCartaoTitularError'
import { FaturaJaAnexadaError } from 'libs/api/exceptions/FaturaJaAnexadaError'
import { FaturaMetadadosError } from 'libs/api/exceptions/FaturaMetadadosError'
import { FaturaProcessandoError } from 'libs/api/exceptions/FaturaProcessandoError'
import { FaturaSelecaoError } from 'libs/api/exceptions/FaturaSelecaoError'
import { FaturaTitularError } from 'libs/api/exceptions/FaturaTitularError'
import {
    LABEL_CADASTRAR_CARTAO_E_FATURA,
    LABEL_CADASTRAR_FATURA,
    LABEL_SUBSTITUIR_FATURA,
    faturaExistenteTemAnexo,
    idFaturaAposSubstituir,
    labelCtaFaturaExistente,
    podeSubstituirFaturaExistente,
    resolveAcaoSugeridaFatura,
    substituirFaturaRetryFields,
    totalLancamentosAposReprocesso,
} from './fatura_substituir_existente_helpers'

const bodyJaAnexada = {
    error: true,
    message: 'Já existe uma fatura com anexo nesta competência. Confirme para substituir a fatura.',
    codigo: 'fatura_ja_anexada',
    fatura_ja_anexada: true,
    acao_sugerida: 'substituir',
    fatura_existente_id: 591,
    orientacao: 'Já existe fatura com anexo nesta competência: Nubank 08/2026 (Leonardo).',
    fatura_existente: {
        id: 591,
        cartao_nome: 'Nubank',
        bandeira: 'Mastercard',
        pessoa_nome: 'Leonardo',
        mes: 8,
        ano: 2026,
        competencia: '08/2026',
        valor_total: '1250.40',
        status: 'processada',
        total_transacoes: 34,
        tem_anexo: true,
        tem_pdf: true,
        tem_csv: false,
    },
}

const bodyMetadadosSubstituir = {
    codigo: 'precisa_confirmar_metadados',
    precisa_confirmar_metadados: true,
    acao_sugerida: 'substituir',
    fatura_existente_id: 591,
    fatura_existente: bodyJaAnexada.fatura_existente,
    sugestao: { cartao_id: 33, mes: 8, ano: 2026 },
}

const bodyMetadadosCadastrar = {
    codigo: 'precisa_confirmar_metadados',
    precisa_confirmar_metadados: true,
    acao_sugerida: 'cadastrar',
    fatura_existente: {
        id: 700,
        tem_anexo: false,
        tem_pdf: false,
        status: 'pendente',
    },
}

describe('FaturaJaAnexadaError', () => {
    it('reconhece codigo ou flag', () => {
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody({ codigo: 'fatura_ja_anexada' })).toBe(true)
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody({ fatura_ja_anexada: true })).toBe(true)
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody({ message: 'já existe' })).toBe(false)
    })

    it('não trata anexo_duplicado nem cartão do titular', () => {
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody({ codigo: 'anexo_duplicado', anexo_duplicado: true })).toBe(false)
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody({
            codigo: 'precisa_cartao_do_titular',
            precisa_cartao_do_titular: true,
        })).toBe(false)
    })

    it('não é capturado pelos outros gates de 422', () => {
        expect(FaturaTitularError.isTitularBody(bodyJaAnexada)).toBe(false)
        expect(FaturaMetadadosError.isMetadadosBody(bodyJaAnexada)).toBe(false)
        expect(FaturaSelecaoError.isSelecaoBody(bodyJaAnexada)).toBe(false)
        expect(FaturaCartaoTitularError.isCartaoTitularBody(bodyJaAnexada)).toBe(false)
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody(bodyJaAnexada)).toBe(false)
    })

    it('lê fatura_existente e ação substituir', () => {
        const error = new FaturaJaAnexadaError(bodyJaAnexada)
        expect(error.fatura_ja_anexada).toBe(true)
        expect(error.acao_sugerida).toBe('substituir')
        expect(error.fatura_existente_id).toBe(591)
        expect(error.fatura_existente?.tem_anexo).toBe(true)
        expect(error.orientacao).toContain('Nubank 08/2026')
    })
})

describe('FaturaMetadadosError — CTA', () => {
    it('lê acao_sugerida e fatura_existente no 422 de metadados', () => {
        const error = new FaturaMetadadosError(bodyMetadadosSubstituir)
        expect(error.acao_sugerida).toBe('substituir')
        expect(error.fatura_existente_id).toBe(591)
        expect(error.fatura_existente?.tem_anexo).toBe(true)
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody(bodyMetadadosSubstituir)).toBe(false)
    })
})

describe('resolveAcaoSugeridaFatura', () => {
    it('usa acao_sugerida quando a API manda', () => {
        expect(resolveAcaoSugeridaFatura({ acao_sugerida: 'substituir' })).toBe('substituir')
        expect(resolveAcaoSugeridaFatura({ acao_sugerida: 'cadastrar' })).toBe('cadastrar')
    })

    it('cai no tem_anexo se a API antiga não mandar acao_sugerida', () => {
        expect(resolveAcaoSugeridaFatura({ fatura_existente: { tem_anexo: true } })).toBe('substituir')
        expect(resolveAcaoSugeridaFatura({ fatura_existente: { tem_pdf: true } })).toBe('substituir')
        expect(resolveAcaoSugeridaFatura({ fatura_existente: { tem_anexo: false } })).toBe('cadastrar')
        expect(resolveAcaoSugeridaFatura({})).toBe('cadastrar')
    })
})

describe('labelCtaFaturaExistente', () => {
    it('nunca mistura cadastrar e substituir', () => {
        expect(labelCtaFaturaExistente('substituir')).toBe(LABEL_SUBSTITUIR_FATURA)
        expect(labelCtaFaturaExistente('cadastrar')).toBe(LABEL_CADASTRAR_FATURA)
        expect(labelCtaFaturaExistente('cadastrar', { cadastrarCartao: true })).toBe(LABEL_CADASTRAR_CARTAO_E_FATURA)
        expect(labelCtaFaturaExistente('substituir', { cadastrarCartao: true })).toBe(LABEL_SUBSTITUIR_FATURA)
        expect(LABEL_SUBSTITUIR_FATURA).not.toMatch(/anexo existente/i)
    })
})

describe('podeSubstituirFaturaExistente', () => {
    it('bloqueia só enquanto processando', () => {
        expect(podeSubstituirFaturaExistente({ status: 'processando' })).toBe(false)
        expect(podeSubstituirFaturaExistente({ status: 'processada' })).toBe(true)
        expect(faturaExistenteTemAnexo(bodyMetadadosCadastrar.fatura_existente)).toBe(false)
        expect(faturaExistenteTemAnexo(bodyJaAnexada.fatura_existente)).toBe(true)
    })
})

describe('substituirFaturaRetryFields', () => {
    it('envia a flag e o id da fatura existente', () => {
        expect(substituirFaturaRetryFields(591)).toEqual({
            confirmar_substituir_fatura: true,
            fatura_existente_id: 591,
        })
    })
})

const bodyProcessando = {
    error: true,
    message: 'A fatura está sendo processada. Aguarde para substituir o anexo.',
    codigo: 'fatura_processando',
    fatura_processando: true,
    fatura_existente_id: 591,
}

describe('FaturaProcessandoError', () => {
    it('reconhece codigo ou flag', () => {
        expect(FaturaProcessandoError.isFaturaProcessandoBody({ codigo: 'fatura_processando' })).toBe(true)
        expect(FaturaProcessandoError.isFaturaProcessandoBody({ fatura_processando: true })).toBe(true)
        expect(FaturaProcessandoError.isFaturaProcessandoBody({ message: 'aguarde' })).toBe(false)
    })

    it('não abre o modal de fatura já anexada', () => {
        expect(FaturaJaAnexadaError.isFaturaJaAnexadaBody(bodyProcessando)).toBe(false)
        expect(FaturaAnexoDuplicadoError.isAnexoDuplicadoBody(bodyProcessando)).toBe(false)
        expect(FaturaTitularError.isTitularBody(bodyProcessando)).toBe(false)
        expect(FaturaMetadadosError.isMetadadosBody(bodyProcessando)).toBe(false)
        expect(FaturaSelecaoError.isSelecaoBody(bodyProcessando)).toBe(false)
        expect(FaturaCartaoTitularError.isCartaoTitularBody(bodyProcessando)).toBe(false)
    })

    it('lê a message do 422 para o aviso', () => {
        const error = new FaturaProcessandoError(bodyProcessando)
        expect(error.fatura_processando).toBe(true)
        expect(error.fatura_existente_id).toBe(591)
        expect(error.message).toBe(bodyProcessando.message)
    })
})

describe('idFaturaAposSubstituir', () => {
    it('usa o id da existente e não o de uma fatura nova', () => {
        expect(idFaturaAposSubstituir(591, 999)).toBe(591)
        expect(idFaturaAposSubstituir(null, 591)).toBe(591)
        expect(idFaturaAposSubstituir(undefined, undefined)).toBeNull()
    })
})

describe('totalLancamentosAposReprocesso', () => {
    it('depois de processada usa a lista refetchada, mesmo vazia', () => {
        expect(totalLancamentosAposReprocesso({
            status: 'processada',
            total_transacoes: 34,
            transacoesCount: 0,
        })).toBe(0)
        expect(totalLancamentosAposReprocesso({
            status: 'processada',
            total_transacoes: 34,
            transacoesCount: 41,
        })).toBe(41)
    })

    it('enquanto processa ainda pode mostrar o total conhecido', () => {
        expect(totalLancamentosAposReprocesso({
            status: 'processando',
            total_transacoes: 34,
            transacoesCount: 0,
        })).toBe(34)
    })
})
