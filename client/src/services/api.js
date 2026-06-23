import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the HttpOnly refresh-token cookie
})

// Access token lives only in this module-level variable — never
// localStorage/sessionStorage, which are readable by any injected script
// (spec §9.4). It's lost on a hard page reload, which is why
// AuthContext silently calls /auth/refresh on mount.
let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

function readCsrfCookie() {
  const match = document.cookie.match(/(?:^|;\s*)svbbs_csrf=([^;]+)/)
  return match ? match[1] : null
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // CSRF header required on cookie-authenticated endpoints (refresh/logout)
  const csrf = readCsrfCookie()
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error
    const isAuthRoute = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh')

    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true
      try {
        // Coalesce concurrent 401s into a single refresh call
        refreshPromise = refreshPromise || api.post('/auth/refresh')
        const { data } = await refreshPromise
        refreshPromise = null
        setAccessToken(data.accessToken)
        config.headers.Authorization = `Bearer ${data.accessToken}`
        return api(config)
      } catch (refreshErr) {
        refreshPromise = null
        setAccessToken(null)
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  }
)

export default api
