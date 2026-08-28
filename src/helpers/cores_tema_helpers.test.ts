import {
  COR_FATIA_OUTROS,
  COR_SEM_CATEGORIA,
  COR_TEMA_PADRAO,
  corCategoria,
  corHexLegadoForaDaPaleta,
  corSubcategoria,
  corTemaPadrao,
  hexesTemaIguais,
  normalizeHexTema,
  resolverTemasCategoria,
  TEMAS_CATEGORIA_FALLBACK,
} from './cores_tema_helpers'

describe('normalizeHexTema', () => {
  it('normaliza para minúsculo com hash', () => {
    expect(normalizeHexTema('#3B82F6')).toBe('#3b82f6')
    expect(normalizeHexTema('ef4444')).toBe('#ef4444')
    expect(normalizeHexTema('#abc')).toBe('#aabbcc')
  })

  it('ignora valor inválido', () => {
    expect(normalizeHexTema('')).toBe('')
    expect(normalizeHexTema(null)).toBe('')
    expect(normalizeHexTema('azul')).toBe('')
  })
})

describe('corCategoria', () => {
  it('categoria cadastrada usa a cor salva', () => {
    expect(corCategoria({ cor: '#3b82f6', categoria_id: 2 })).toBe('#3b82f6')
  })

  it('categoria cadastrada sem cor (legado) fica preta, não cinza', () => {
    expect(corCategoria({ cor: null, categoria_id: 2 })).toBe(COR_TEMA_PADRAO)
    expect(corCategoria({ categoria_id: 7 })).toBe(COR_TEMA_PADRAO)
  })

  it('sem categoria fica cinza', () => {
    expect(corCategoria({ cor: null, categoria_id: null })).toBe(COR_SEM_CATEGORIA)
    expect(corCategoria({ categoria_id: null })).toBe(COR_SEM_CATEGORIA)
    expect(corCategoria({ categoria_id: 0 })).toBe(COR_SEM_CATEGORIA)
    expect(corCategoria({ cor: '#9ca3af' })).toBe('#9ca3af')
  })

  it('string vazia ou null (cadastro) cai no preto', () => {
    expect(corCategoria(null)).toBe(COR_TEMA_PADRAO)
    expect(corCategoria('')).toBe(COR_TEMA_PADRAO)
    expect(corCategoria('#22C55E')).toBe('#22c55e')
  })
})

describe('corSubcategoria', () => {
  it('prefere a cor da sub e cai na pai / preto', () => {
    expect(corSubcategoria({ cor: '#93c5fd', categoria_cor: '#3b82f6' })).toBe('#93c5fd')
    expect(corSubcategoria({ cor: null, categoria_cor: '#3b82f6' })).toBe('#3b82f6')
    expect(corSubcategoria({ cor: null, categoria_cor: null })).toBe(COR_TEMA_PADRAO)
  })
})

describe('resolverTemasCategoria', () => {
  it('usa temas da API quando existem', () => {
    const temas = resolverTemasCategoria({
      temas: [{ chave: 'azul', label: 'Azul', hex: '#3B82F6', padrao: false, variacoes: [] }],
    })
    expect(temas).toEqual([
      { chave: 'azul', label: 'Azul', hex: '#3b82f6', padrao: false, variacoes: [] },
    ])
  })

  it('monta a grade a partir de cores[] se temas ainda não veio', () => {
    const temas = resolverTemasCategoria({
      cores: ['#000000', '#EF4444'],
    })
    expect(temas.map((t) => t.hex)).toEqual(['#000000', '#ef4444'])
    expect(temas[0].label).toBe('Preto')
    expect(temas[0].padrao).toBe(true)
    expect(temas[1].label).toBe('Vermelho')
  })

  it('cai na paleta local sem lookups', () => {
    expect(resolverTemasCategoria().map((t) => t.hex)).toEqual(
      TEMAS_CATEGORIA_FALLBACK.map((t) => t.hex)
    )
  })
})

describe('corTemaPadrao / legado', () => {
  it('usa cor_padrao da API ou preto', () => {
    expect(corTemaPadrao({ cor_padrao: '#000000' })).toBe('#000000')
    expect(corTemaPadrao()).toBe(COR_TEMA_PADRAO)
  })

  it('expõe hex legado fora da paleta', () => {
    expect(corHexLegadoForaDaPaleta('#1a2b3c', TEMAS_CATEGORIA_FALLBACK)).toBe('#1a2b3c')
    expect(corHexLegadoForaDaPaleta('#3b82f6', TEMAS_CATEGORIA_FALLBACK)).toBeNull()
    expect(hexesTemaIguais('#3B82F6', '#3b82f6')).toBe(true)
  })
})

describe('constantes visuais', () => {
  it('não mistura Outros com Sem categoria', () => {
    expect(COR_FATIA_OUTROS).toBe('#d1d5db')
    expect(COR_SEM_CATEGORIA).toBe('#9ca3af')
    expect(COR_TEMA_PADRAO).toBe('#000000')
  })
})
