/**
 * AuthProvider — central authentication state provider.
 */
import { useCallback, useEffect, useState } from 'react'
import authService from '../services/authService'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile whenever the token changes
  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    authService
      .getMe()
      .then((profile) => setUser(profile))
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    return data
  }, [])

  const register = useCallback(async (credentials) => {
    const data = await authService.register(credentials)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    return data
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const profile = await authService.getMe()
    setUser(profile)
    return profile
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
