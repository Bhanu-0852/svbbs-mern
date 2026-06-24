import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import api, { setAccessToken, getAccessToken, setCsrfToken } from '../services/api'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    async function tryRestoreSession() {
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.accessToken)
        if (data.csrfToken) setCsrfToken(data.csrfToken)
        setUser(data.user)
      } catch {
        setAccessToken(null)
        setCsrfToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    tryRestoreSession()
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    const { data } = await api.post('/auth/register', { name, email, password, role })
    return data
  }, [])

  const login = useCallback(async ({ email, password, mfaCode, backupCode }) => {
    const { data } = await api.post('/auth/login', { email, password, mfaCode, backupCode })
    setAccessToken(data.accessToken)
    if (data.csrfToken) setCsrfToken(data.csrfToken)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setCsrfToken(null)
      setUser(null)
    }
  }, [])

  const logoutAllDevices = useCallback(async () => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      setAccessToken(null)
      setCsrfToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    setUser(data.user)
    return data.user
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        logoutAllDevices,
        refreshUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}