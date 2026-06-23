import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export function useWallet() {
  const { isAuthenticated } = useAuth()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setBalance(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/wallet/me')
      setBalance(data.balance)
    } catch {
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { balance, loading, refetch }
}
