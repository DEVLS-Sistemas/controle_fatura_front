import {
    bandeiraConfereComFaturaExistente,
    bandeirasDaCompetencia,
    bandeirasDoModal,
    cartaoEBandeiraDoCadastro,
    competenciaExigeSelectBandeira,
    nomeBandeiraParaExibicao,
    nomeCartaoDoPayload,
    nomeDoParserFatura,
    resolveModoMetadados,
    retryMetadadosPelaBandeira,
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

describe('nomeBandeiraParaExibicao', () => {
    it('usa o nome escolhido no cadastro, não o id novo', () => {
        expect(nomeBandeiraParaExibicao({
            nome: 'Mastercard',
            cartaoBandeiraId: 111,
            opcoes: lookupCompleto,
        })).toBe('Mastercard')
    })

    it('resolve o nome pela opção quando só veio o id', () => {
        expect(nomeBandeiraParaExibicao({
            cartaoBandeiraId: 9,
            opcoes: [bandeiraMastercardPicPay],
        })).toBe('Mastercard')
    })

    it('não inventa rótulo com o id', () => {
        expect(nomeBandeiraParaExibicao({
            cartaoBandeiraId: 111,
            opcoes: lookupCompleto,
        })).toBeNull()
    })
})

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

    it('bandeira nova não reenvia a bandeira auto do formulário', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: false,
            cartaoIdRetry: 46,
            cartaoIdFormulario: 46,
            bandeiraIdFormulario: 9,
            bandeiraNomeRetry: 'Mastercard',
            temArquivo: true,
            bandeiraDoFormularioExplicita: true,
        })).toEqual({
            cartao_id: 46,
            cartao_bandeira_id: null,
        })
    })

    it('outra bandeira já cadastrada no cartão usa o id escolhido, não o do form', () => {
        expect(cartaoEBandeiraDoCadastro({
            cadastrarCartao: false,
            cartaoIdRetry: 46,
            bandeiraIdRetry: 12,
            cartaoIdFormulario: 46,
            bandeiraIdFormulario: 9,
            temArquivo: true,
            bandeiraDoFormularioExplicita: true,
        })).toEqual({
            cartao_id: 46,
            cartao_bandeira_id: 12,
        })
    })
})

describe('competência com fatura — select de bandeira', () => {
    const mastercard = { value: 9, label: 'Mastercard', criar: false }
    const visaCriar = { value: null, label: 'Visa', criar: true }
    const periodo = [
        { id: 591, cartao_bandeira_id: 9, bandeira: 'Mastercard', tem_anexo: true, competencia: '09/2026' },
    ]

    it('exige o select quando a competência já tem fatura, mesmo com uma bandeira', () => {
        expect(competenciaExigeSelectBandeira({
            precisaSelecionarBandeira: false,
            faturasPeriodo: periodo,
        })).toBe(true)
        expect(competenciaExigeSelectBandeira({
            precisaSelecionarBandeira: true,
            faturasPeriodo: [],
        })).toBe(true)
        expect(competenciaExigeSelectBandeira({
            precisaSelecionarBandeira: false,
            faturasPeriodo: [],
        })).toBe(false)
    })

    it('mantém bandeiras[] com criar e completa a lista quando só veio a do cartão', () => {
        expect(bandeirasDaCompetencia({
            payload: [mastercard, visaCriar],
            lookup: lookupCompleto,
        })).toEqual([mastercard, visaCriar])

        expect(bandeirasDaCompetencia({
            payload: [mastercard],
            lookup: lookupCompleto,
        }).map((b) => b.label)).toEqual(['Mastercard', 'Visa', 'Elo'])
    })

    it('outra bandeira cadastra sem a fatura sugerida; a mesma com anexo substitui', () => {
        const fatura = { id: 591, bandeira: 'Mastercard' }
        expect(bandeiraConfereComFaturaExistente(
            { cartao_bandeira_id: 9, bandeira: 'Mastercard' },
            fatura,
            periodo,
        )).toBe(true)
        expect(bandeiraConfereComFaturaExistente(
            { cartao_bandeira_id: 12, bandeira: 'Visa' },
            fatura,
            periodo,
        )).toBe(false)
        expect(bandeiraConfereComFaturaExistente(
            { criar: true, bandeira: 'Visa' },
            fatura,
            periodo,
        )).toBe(false)

        expect(retryMetadadosPelaBandeira({
            exigeBandeira: true,
            confereComExistente: false,
            faturaTemAnexo: true,
            faturaId: 591,
        })).toEqual({ acao: 'cadastrar' })

        expect(retryMetadadosPelaBandeira({
            exigeBandeira: true,
            confereComExistente: true,
            faturaTemAnexo: true,
            faturaId: 591,
        })).toEqual({
            acao: 'substituir',
            fatura_existente_id: 591,
            confirmar_substituir_fatura: true,
        })

        expect(retryMetadadosPelaBandeira({
            exigeBandeira: true,
            confereComExistente: true,
            faturaTemAnexo: false,
            faturaId: 591,
        })).toEqual({ acao: 'cadastrar', fatura_existente_id: 591 })

        expect(retryMetadadosPelaBandeira({
            exigeBandeira: true,
            confereComExistente: false,
            faturaTemAnexo: true,
            faturaId: 591,
            escolha: { cartao_bandeira_id: 12, bandeira: 'Visa' },
            periodo: [
                ...periodo,
                { id: 777, cartao_bandeira_id: 12, bandeira: 'Visa', tem_anexo: true, competencia: '09/2026' },
            ],
        })).toEqual({
            acao: 'substituir',
            fatura_existente_id: 777,
            confirmar_substituir_fatura: true,
        })
    })

    it('lê faturas_periodo do 422', () => {
        const error = new FaturaMetadadosError({
            codigo: 'precisa_confirmar_metadados',
            precisa_confirmar_metadados: true,
            precisa_selecionar_bandeira: true,
            modo: 'confirmar_cartao',
            faturas_periodo: periodo,
            bandeiras: [mastercard, visaCriar],
            sugestao: { cartao_id: 17, cartao_bandeira_id: 9, bandeira_sugerida: 'Mastercard' },
        })
        expect(error.faturas_periodo).toEqual(periodo)
        expect(error.precisa_selecionar_bandeira).toBe(true)
        expect(error.bandeiras).toHaveLength(2)
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
