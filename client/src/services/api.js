import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let accessToken = null
let csrfToken = null

const SESSION_KEY = 'svbbs_session'

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setCsrfToken(token) {
  csrfToken = token
}

export function saveSession(token, user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      accessToken: token,
      user,
      expiresAt: Date.now() + 14 * 60 * 1000,
    }))
  } catch {}
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (res) => {
    if (res.data?.data?.csrfToken) {
      setCsrfToken(res.data.data.csrfToken)
    }
    return res
  },
  async (error) => {
    const { config, response } = error
    const isAuthRoute =
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/refresh')

    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true
      try {
        refreshPromise = refreshPromise || api.post('/auth/refresh')
        const { data } = await refreshPromise
        refreshPromise = null
        setAccessToken(data.accessToken)
        if (data.csrfToken) setCsrfToken(data.csrfToken)
        if (data.user) saveSession(data.accessToken, data.user)
        config.headers.Authorization = `Bearer ${data.accessToken}`
        return api(config)
      } catch (refreshErr) {
        refreshPromise = null
        setAccessToken(null)
        setCsrfToken(null)
        clearSession()
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  }
)

export default api