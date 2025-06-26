import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setAuth } from '@/lib/api'

type User = { id: string; email: string }

interface AuthCtx {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('br_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('br_token'))

  /* reaplica token no axios após refresh */
  useEffect(() => {
    if (token) setAuth(token)
  }, [token])

  /* helpers -------------------------------------------------- */
  const saveSession = (u: User, t: string) => {
    setUser(u)
    setToken(t)
    setAuth(t)
    localStorage.setItem('br_user', JSON.stringify(u))
    localStorage.setItem('br_token', t)
  }

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string }>('/auth/login', {}, { auth: { username: email, password } })
    const { token } = res.data
    // opcionalmente decodificar JWT para pegar o id/email
    saveSession({ id: 'me', email }, token)
  }

  const register = async (email: string, password: string) => {
    const res = await api.post<{ token: string }>('/auth/register', { email, password })
    saveSession({ id: 'me', email }, res.data.token)
  }

  const logout = () => {
    localStorage.removeItem('br_user')
    localStorage.removeItem('br_token')
    setUser(null)
    setToken(null)
    setAuth('') // limpa header
  }

  return <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>
}

/* hook prático */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
