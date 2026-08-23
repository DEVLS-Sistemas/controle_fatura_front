import axios from 'axios'
import { RANKING_SEARCH_STORAGE_KEY } from 'interfaces/RankingParceladas/RankingParceladasInterface'

type SessionUser = {
  id: number
  name: string
  email: string
}

type SessionPayload = {
  token: string
  user: SessionUser
}

export const AUTH_SESSION_KEY = 'authUser'

/** Chave da etapa 4. Logout / 401 não apagam o e-mail lembrado. */
export const AUTH_LEMBRAR_EMAIL_KEY = 'auth.lembrar_email'

const PUBLIC_AUTH_PATH =
  /(?:^|\/)auth\/(login|register|recuperar-senha|verificar-codigo|redefinir-senha)(?:\?|$|\/)/i

const GUEST_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/recuperar-senha',
  '/logout',
]

/** Filtros/IDs de entidade que não podem atravessar de uma conta para outra. */
const USER_SCOPED_SESSION_KEYS = [RANKING_SEARCH_STORAGE_KEY]

let handlingUnauthorized = false
let validatedToken: string | null = null

/** Primeira carga da área logada com este token: vale um `GET /me`. */
export const shouldValidateSession = (token: string): boolean => {
  if (!token || validatedToken === token) return false
  validatedToken = token
  return true
}

export type StoredAuthSession = {
  token: string
  email: string
  username: string
  first_name: string
  last_name: string
  data: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  user: SessionUser
}

export const isPublicAuthUrl = (url?: string): boolean => {
  if (!url) return false
  return PUBLIC_AUTH_PATH.test(url)
}

export const isGuestPath = (pathname: string): boolean => {
  return GUEST_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export const getAuthSession = (): StoredAuthSession | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token) return null
    return parsed
  } catch {
    return null
  }
}

export const getAuthToken = (): string | null => {
  return getAuthSession()?.token ?? null
}

export const clearUserScopedStorage = (): void => {
  USER_SCOPED_SESSION_KEYS.forEach((key) => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  })
}

const clearAxiosAuthorization = (): void => {
  try {
    delete axios.defaults.headers.common.Authorization
  } catch {
    // ignore
  }
}

export const persistAuthSession = (payload: SessionPayload): StoredAuthSession => {
  clearUserScopedStorage()
  const stored: StoredAuthSession = {
    token: payload.token,
    email: payload.user.email,
    username: payload.user.name,
    first_name: payload.user.name,
    last_name: '',
    data: {
      id: payload.user.id,
      first_name: payload.user.name,
      last_name: '',
      email: payload.user.email,
    },
    user: payload.user,
  }
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(stored))
  handlingUnauthorized = false
  validatedToken = null
  return stored
}

export const clearAuthSession = (): void => {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
  } catch {
    // ignore
  }
  clearUserScopedStorage()
  clearAxiosAuthorization()
  validatedToken = null
}

/** 401 em rota autenticada: zera sessão e vai ao login (sem loop nas telas públicas). */
export const handleUnauthorizedSession = (): void => {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  clearAuthSession()

  if (typeof window === 'undefined') {
    handlingUnauthorized = false
    return
  }

  if (isGuestPath(window.location.pathname)) {
    handlingUnauthorized = false
    return
  }

  window.location.assign('/login')
}
