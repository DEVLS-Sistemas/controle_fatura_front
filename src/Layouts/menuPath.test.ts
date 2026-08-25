import { findMatchingMenuItem, pathIn } from './menuPath'

describe('pathIn', () => {
  it('casa rota exata e filha', () => {
    expect(pathIn('/faturas', ['/faturas'])).toBe(true)
    expect(pathIn('/faturas/add', ['/faturas'])).toBe(true)
    expect(pathIn('/faturas/edit/1', ['/faturas'])).toBe(true)
  })

  it('nao casa prefixo parcial', () => {
    expect(pathIn('/faturas-antigas', ['/faturas'])).toBe(false)
    expect(pathIn('/dashboard', ['/faturas'])).toBe(false)
  })
})

describe('findMatchingMenuItem', () => {
  const anchors = [
    { pathname: '/' },
    { pathname: '/dashboard' },
    { pathname: '/projecao-faturas' },
    { pathname: '/faturas' },
    { pathname: '/transacoes' },
  ]

  it('prioriza match exato', () => {
    expect(findMatchingMenuItem(anchors, '/faturas')?.pathname).toBe('/faturas')
  })

  it('casa rotas aninhadas no item pai do menu', () => {
    expect(findMatchingMenuItem(anchors, '/faturas/add')?.pathname).toBe('/faturas')
    expect(findMatchingMenuItem(anchors, '/faturas/edit/12')?.pathname).toBe('/faturas')
  })

  it('ignora links de grupo com pathname /', () => {
    expect(findMatchingMenuItem(anchors, '/dashboard')?.pathname).toBe('/dashboard')
    expect(findMatchingMenuItem(anchors, '/')?.pathname).toBeUndefined()
  })
})
