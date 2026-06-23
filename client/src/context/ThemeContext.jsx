import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(undefined)
const STORAGE_KEY = 'svbbs-theme'

function getSystemPreference() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyResolvedTheme(resolved) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }) {
  // theme = the user's chosen mode: 'light' | 'dark' | 'system'
  const [theme, setThemeState] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return stored || 'system'
  })

  // resolvedTheme = the actual applied theme: 'light' | 'dark'
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === 'system' ? getSystemPreference() : theme
  )

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemPreference() : theme
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
  }, [theme])

  // Listen for OS-level changes only while in "system" mode
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const resolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyResolvedTheme(resolved)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
