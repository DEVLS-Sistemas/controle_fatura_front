import {
    formatParsersHomologadosLista,
    isParCorPdfHomologado,
    isParserChaveHomologada,
    resolveCartaoHomologacao,
    textoFormCartaoHomologacao,
    tooltipParCorCartao,
} from './parser_homologado_helpers'
import { PARSERS_HOMOLOGADOS_PADRAO } from 'interfaces/Cartoes/CartoesInterface'

describe('isParserChaveHomologada', () => {
    it('reconhece os parsers testados e o CSV do Inter', () => {
        expect(isParserChaveHomologada('nubank')).toBe(true)
        expect(isParserChaveHomologada('inter-csv')).toBe(true)
        expect(isParserChaveHomologada('itau')).toBe(true)
    })

    it('não homologa parser genérico nem CSV/XML soltos', () => {
        expect(isParserChaveHomologada('generico')).toBe(false)
        expect(isParserChaveHomologada('csv')).toBe(false)
        expect(isParserChaveHomologada('xml')).toBe(false)
        expect(isParserChaveHomologada('santander')).toBe(false)
    })
})

describe('resolveCartaoHomologacao', () => {
    it('usa o flag da API quando vier', () => {
        expect(resolveCartaoHomologacao({
            nome: 'Santander SX',
            importacao_pdf_homologada: false,
        }).homologada).toBe(false)

        expect(resolveCartaoHomologacao({
            nome: 'Nubank Principal',
            importacao_pdf_homologada: true,
        }).homologada).toBe(true)
    })

    it('casa nome/banco com a lista homologada quando o flag faltar', () => {
        const nubank = resolveCartaoHomologacao({ nome: 'Nubank Principal' })
        expect(nubank.homologada).toBe(true)
        expect(nubank.parser?.chave).toBe('nubank')

        const itau = resolveCartaoHomologacao({ nome: 'Itaú Personnalité' })
        expect(itau.homologada).toBe(true)
        expect(itau.parser?.nota).toMatch(/Click/i)

        const santander = resolveCartaoHomologacao({ nome: 'Santander SX' })
        expect(santander.homologada).toBe(false)
    })

    it('não trata cor oficial como parser pronto', () => {
        expect(resolveCartaoHomologacao({ nome: 'Magalu' }).homologada).toBe(false)
        expect(resolveCartaoHomologacao({ nome: 'Bradesco' }).homologada).toBe(false)
    })
})

describe('formatParsersHomologadosLista', () => {
    it('junta os labels da API (ou o fallback)', () => {
        const texto = formatParsersHomologadosLista(PARSERS_HOMOLOGADOS_PADRAO)
        expect(texto).toContain('Nubank')
        expect(texto).toContain('PicPay')
        expect(texto).toMatch(/ e Itaú$/)
    })
})

describe('swatch e texto do form', () => {
    it('marca check só no chip homologado', () => {
        expect(isParCorPdfHomologado({ chave: 'nubank', cor_fundo: '#820ad1', cor_texto: '#fff', importacao_pdf_homologada: true })).toBe(true)
        expect(isParCorPdfHomologado({ chave: 'santander', cor_fundo: '#ec0000', cor_texto: '#fff', importacao_pdf_homologada: false })).toBe(false)
        expect(isParCorPdfHomologado({ chave: 'padrao', cor_fundo: '#e5e7eb', cor_texto: '#111', padrao: true })).toBe(false)
    })

    it('tooltip de cor oficial não homologada não parece erro de cadastro', () => {
        expect(tooltipParCorCartao({
            chave: 'santander',
            label: 'Santander',
            cor_fundo: '#ec0000',
            cor_texto: '#fff',
            importacao_pdf_homologada: false,
        })).toBe('Cor oficial — importação de PDF ainda não homologada')
    })

    it('texto do form avisa que o valor pode não ser o correto', () => {
        const aviso = textoFormCartaoHomologacao({ homologada: false, parser: null })
        expect(aviso.homologada).toBe(false)
        expect(aviso.texto).toMatch(/valores podem não ser os corretos/)
        expect(aviso.texto).toContain('Nubank')
    })
})
