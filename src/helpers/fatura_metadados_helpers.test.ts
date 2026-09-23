import {
    bandeirasDoModal,
    cartaoEBandeiraDoCadastro,
    nomeCartaoDoPayload,
    nomeDoParserFatura,
    resolveModoMetadados,
} from './fatura_metadados_helpers'
import { FaturaMetadadosError } from 'libs/api/exceptions/FaturaMetadadosError'

const bandeiraMastercardPicPay = { value: 9, label: 'Mastercard', criar: false }
const lookupCompleto = [
    { value: null, label: 'Visa', criar: true },
    { value: null, label: 'Mastercard', criar: true },
    { value: null, label: 'Elo', criar: true },
]

const bodySofisaNovo = {
    codigo: 'precisa_confirmar_metadados',
    precisa_confirmar_metadados: true,
    modo: 'cadastrar_cartao',
    pode_cadastrar_cartao: true,
    precisa_selecionar_bandeira: true,
    sugestao: {
        cartao_id: null,
        cartao_nome: 'PicPay',
        cartao_nome_sugerido: 'Sofisa',
        parser: 'sofisa',
        bandeira_sugerida: 'Mastercard',
        confianca: 'baixa',
    },
    bandeiras: lookupCompleto,
}

describe('nomeCartaoDoPayload', () => {
    it('usa cartao_nome_sugerido (Sofisa), não o PicPay da tela', () => {
        expect(nomeCartaoDoPayload(bodySofisaNovo.sugestao, 'cadastrar_cartao')).toBe('Sofisa')
    })

    it('em cadastrar_cartao não cai no cartao_nome da rota', () => {
        expect(nomeCartaoDoPayload({
            cartao_id: null,
            cartao_nome: 'PicPay',
            parser: 'sofisa',
        }, 'cadastrar_cartao')).toBe('Sofisa')
    })

    it('mapeia o parser picpay', () => {
        expect(nomeDoParserFatura('picpay')).toBe('PicPay')
    })
})

describe('resolveModoMetadados', () => {
    it('respeita modo cadastrar mesmo se alguém passar cartao_id da rota', () => {
        expect(resolveModoMetadados({
            modo: 'cadastrar_cartao',
            sugestao: { cartao_id: 12, confianca: 'informado' },
        })).toBe('cadastrar_cartao')
    })

    it('confirma o Sofisa já cadastrado, não o PicPay da URL', () => {
        expect(resolveModoMetadados({
            modo: 'confirmar_cartao',
            sugestao: { cartao_id: 46, confianca: 'media' },
        })).toBe('confirmar_cartao')
    })
})

describe('bandeirasDoModal', () => {
    it('no cadastro usa o lookup completo, não só a Mastercard do PicPay', () => {
        expect(bandeirasDoModal({
            modo: 'cadastrar_cartao',
            payload: [bandeiraMastercardPicPay],
            lookup: lookupCompleto,
        })).toEqual(lookupCompleto)
    })

    it('mantém bandeiras[] do 422 quando já vem completo', () => {
        expect(bandeirasDoModal({
            modo: 'cadastrar_cartao',
            payload: lookupCompleto,
            lookup: [],
        })).toEqual(lookupCompleto)
    })
})

describe('cartaoEBandeiraDoCadastro', () => {
    it('no retry de cadastrar Sofisa não reenvia cartao_id nem bandeira do PicPay', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: true,
            cartaoNome: 'Sofisa',
            cartaoIdFormulario: 12,
            bandeiraIdFormulario: 9,
            temArquivo: true,
        })).toEqual({
            cartao_id: null,
            cartao_bandeira_id: null,
        })
    })

    it('no primeiro POST com PDF manda o cartao_id da tela como hint, sem a bandeira auto', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: false,
            cartaoIdFormulario: 12,
            bandeiraIdFormulario: 9,
            temArquivo: true,
            bandeiraDoFormularioExplicita: false,
        })).toEqual({
            cartao_id: 12,
            cartao_bandeira_id: null,
        })
    })

    it('sem PDF, Adicionar no PicPay continua com o cartão da tela', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: false,
            cartaoIdFormulario: 12,
            bandeiraIdFormulario: 9,
            temArquivo: false,
        })).toEqual({
            cartao_id: 12,
            cartao_bandeira_id: 9,
        })
    })

    it('confirmar Sofisa existente usa o id do payload, não o da rota', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: false,
            cartaoIdRetry: 46,
            cartaoIdFormulario: 12,
            bandeiraIdFormulario: 9,
            temArquivo: true,
        })).toEqual({
            cartao_id: 46,
            cartao_bandeira_id: null,
        })
    })
})

describe('FaturaMetadadosError — modo do PDF', () => {
    it('expõe modo e nome sugerido do Sofisa', () => {
        const error = new FaturaMetadadosError(bodySofisaNovo)
        expect(error.modo).toBe('cadastrar_cartao')
        expect(error.pode_cadastrar_cartao).toBe(true)
        expect(error.sugestao.cartao_nome_sugerido).toBe('Sofisa')
        expect(error.bandeiras).toHaveLength(3)
    })
})
