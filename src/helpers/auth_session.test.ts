jest.mock('axios', () => ({
  __esModule: true,
  default: { defaults: { headers: { common: {} } } },
}))

import {
  AUTH_SESSION_KEY,
  clearAuthSession,
  getAuthSession,
  getAuthToken,
  persistAuthSession,
} from './auth_session'

const user = { id: 1, name: 'Leo', email: 'leo@devls.com' }

describe('sessão compartilhada entre abas', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.pushState({}, '', '/faturas')
  })

  it('grava o token no localStorage para outra aba ler', () => {
    persistAuthSession({ token: 'tok-1', user })

    expect(getAuthToken()).toBe('tok-1')
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toContain('tok-1')
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
  })

  it('uma aba nova lê a sessão só pelo localStorage', () => {
    persistAuthSession({ token: 'tok-aba', user })
    sessionStorage.clear()

    expect(getAuthSession()?.token).toBe('tok-aba')
  })

  it('promove a sessão antiga do sessionStorage para as outras abas', () => {
    sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ token: 'tok-legado', user })
    )

    expect(getAuthToken()).toBe('tok-legado')
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toContain('tok-legado')
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
  })

  it('logout apaga a sessão compartilhada', () => {
    persistAuthSession({ token: 'tok-1', user })
    sessionStorage.setItem(AUTH_SESSION_KEY, 'resto')

    clearAuthSession()

    expect(getAuthToken()).toBeNull()
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
  })

  it('a outra aba vai ao login quando a sessão some', () => {
    const assign = jest.fn()
    const location = window.location
    // jsdom deixa `location.assign` somente leitura
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/faturas', assign },
    })

    window.dispatchEvent(new StorageEvent('storage', {
      key: AUTH_SESSION_KEY,
      newValue: null,
      storageArea: localStorage,
    }))

    expect(assign).toHaveBeenCalledWith('/login')
    Object.defineProperty(window, 'location', { configurable: true, value: location })
  })

  it('na tela de login, a outra aba não redireciona de novo', () => {
    const assign = jest.fn()
    const location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/login', assign },
    })

    window.dispatchEvent(new StorageEvent('storage', {
      key: AUTH_SESSION_KEY,
      newValue: null,
      storageArea: localStorage,
    }))

    expect(assign).not.toHaveBeenCalled()
    Object.defineProperty(window, 'location', { configurable: true, value: location })
  })
})
