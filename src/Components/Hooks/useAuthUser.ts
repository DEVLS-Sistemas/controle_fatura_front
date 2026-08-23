import { useCallback, useEffect, useState } from 'react'
import {
  AUTH_SESSION_UPDATED_EVENT,
  getAuthUser,
  getUserDisplayName,
  getUserInitials,
  SessionUser,
} from 'helpers/auth_session'

export const useAuthUser = () => {
  const [user, setUser] = useState<SessionUser | null>(() => getAuthUser())

  const refresh = useCallback(() => {
    setUser(getAuthUser())
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, refresh)
  }, [refresh])

  return {
    user,
    displayName: getUserDisplayName(user),
    initials: getUserInitials(user),
    refresh,
  }
}
