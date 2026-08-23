import axios from 'axios'
import { RANKING_SEARCH_STORAGE_KEY } from 'interfaces/RankingParceladas/RankingParceladasInterface'

export interface SessionUser {
  id: number
  name: string
  email: string
  sobrenome?: string | null
  cpf_cnpj?: string | null
}

type SessionPayload = {
  token: string
  user: SessionUser
}

export const AUTH_SESSION_KEY = 'authUser'
export const AUTH_SESSION_UPDATED_EVENT = 'auth-session-updated'

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

const emitAuthSessionUpdated = (): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT))
}

export const normalizeAuthUser = (
  user: Partial<SessionUser> & { id: number; name: string; email: string }
): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  sobrenome: user.sobrenome ?? null,
  cpf_cnpj: user.cpf_cnpj ?? null,
})

export const getUserDisplayName = (
  user?: Pick<SessionUser, 'name' | 'sobrenome'> | null
): string => {
  if (!user) return ''
  return [user.name, user.sobrenome]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
}

export const getUserInitials = (
  user?: Pick<SessionUser, 'name' | 'sobrenome'> | null
): string => {
  const name = user?.name?.trim() || ''
  const last = user?.sobrenome?.trim() || ''
  if (name && last) return `${name[0]}${last[0]}`.toUpperCase()
  const letters = name.replace(/\s+/g, '').slice(0, 2)
  return (letters || '?').toUpperCase()
}

export const getAuthUser = (): SessionUser | null => {
  const session = getAuthSession()
  if (session?.user?.id && session.user.name && session.user.email) {
    return normalizeAuthUser(session.user)
  }
  if (session?.data?.id && session.email) {
    return normalizeAuthUser({
      id: session.data.id,
      name: session.first_name || session.username || '',
      email: session.email,
      sobrenome: session.last_name || null,
    })
  }
  return null
}

const buildStoredSession = (token: string, user: SessionUser): StoredAuthSession => {
  const normalized = normalizeAuthUser(user)
  const displayName = getUserDisplayName(normalized)
  return {
    token,
    email: normalized.email,
    username: displayName || normalized.name,
    first_name: normalized.name,
    last_name: normalized.sobrenome ?? '',
    data: {
      id: normalized.id,
      first_name: normalized.name,
      last_name: normalized.sobrenome ?? '',
      email: normalized.email,
    },
    user: normalized,
  }
}

/** Atualiza só o `user` (ex.: GET /me, PUT /perfil). Não troca o token nem limpa caches. */
export const persistAuthUser = (user: SessionUser): StoredAuthSession | null => {
  const current = getAuthSession()
  if (!current?.token) return null
  const stored = buildStoredSession(current.token, user)
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(stored))
  emitAuthSessionUpdated()
  return stored
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
  const stored = buildStoredSession(payload.token, payload.user)
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(stored))
  handlingUnauthorized = false
  validatedToken = null
  emitAuthSessionUpdated()
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
