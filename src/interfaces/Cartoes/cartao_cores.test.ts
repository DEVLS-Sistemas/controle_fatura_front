import {
  CARTAO_COR_PADRAO,
  CARTAO_PARES_CORES_PADRAO,
  COR_TEXTO_CARTAO_CLARO,
  COR_TEXTO_CARTAO_ESCURO,
  corTextoPorContraste,
  hexesCartaoIguais,
  luminanciaRelativaHex,
  parCorCasaComFundo,
  toInputColorHex,
} from './CartoesInterface'

describe('corTextoPorContraste', () => {
  it('fundo claro usa texto escuro', () => {
    expect(corTextoPorContraste('#ffffff')).toBe(COR_TEXTO_CARTAO_ESCURO)
    expect(corTextoPorContraste('#e5e7eb')).toBe(COR_TEXTO_CARTAO_ESCURO)
    expect(corTextoPorContraste('#f8d117')).toBe(COR_TEXTO_CARTAO_ESCURO)
  })

  it('fundo escuro usa texto claro', () => {
    expect(corTextoPorContraste('#000000')).toBe(COR_TEXTO_CARTAO_CLARO)
    expect(corTextoPorContraste('#820ad1')).toBe(COR_TEXTO_CARTAO_CLARO)
    expect(corTextoPorContraste('#111111')).toBe(COR_TEXTO_CARTAO_CLARO)
  })

  it('limiar 0.179 separa claro de escuro', () => {
    expect(luminanciaRelativaHex('#ffffff')).toBeGreaterThanOrEqual(0.179)
    expect(luminanciaRelativaHex('#000000')).toBeLessThan(0.179)
  })
})

describe('hexesCartaoIguais / parCorCasaComFundo', () => {
  it('ignora maiúsculas ao comparar', () => {
    expect(hexesCartaoIguais('#820AD1', '#820ad1')).toBe(true)
  })

  it('casa com preset pelo fundo', () => {
    expect(parCorCasaComFundo('#820ad1', CARTAO_PARES_CORES_PADRAO)).toBe(true)
    expect(parCorCasaComFundo(CARTAO_COR_PADRAO.cor_fundo, CARTAO_PARES_CORES_PADRAO)).toBe(true)
  })

  it('HEX fora do catálogo não casa', () => {
    expect(parCorCasaComFundo('#1a2b3c', CARTAO_PARES_CORES_PADRAO)).toBe(false)
  })
})

describe('toInputColorHex', () => {
  it('normaliza para #rrggbb minúsculo', () => {
    expect(toInputColorHex('#820AD1')).toBe('#820ad1')
    expect(toInputColorHex('abc')).toBe('#aabbcc')
  })

  it('cai no fallback se inválido', () => {
    expect(toInputColorHex('azul', '#e5e7eb')).toBe('#e5e7eb')
  })
})
