'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import { getToken, getUser, removeToken, setToken, setUser } from '@/lib/auth'
import type { JWTPayload } from '@/lib/auth'

interface AuthContextValue {
  patient: JWTPayload | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => void
}

interface RegisterData {
  name: string
  email: string
  mobile: string
  password: string
}

const AuthContext = createContext<AuthContextValue>({
  patient: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<JWTPayload | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = getToken()
    const storedUser = getUser()
    if (storedToken && storedUser) {
      setTokenState(storedToken)
      setPatient(storedUser)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    // The backend returns { token, patient } directly in response.data
    const { token: newToken, patient: user } = response.data as any
    setToken(newToken)
    const decodedUser = getUser()
    if (decodedUser) {
      setUser(decodedUser)
      setPatient(decodedUser)
    } else {
      // Fallback: use user from response
      const fallback = user as JWTPayload
      setPatient(fallback)
    }
    setTokenState(newToken)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data)
    const { token: newToken } = response.data as any
    setToken(newToken)
    const decodedUser = getUser()
    if (decodedUser) {
      setUser(decodedUser)
      setPatient(decodedUser)
    }
    setTokenState(newToken)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setPatient(null)
    setTokenState(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [])

  const refreshUser = useCallback(() => {
    const storedUser = getUser()
    if (storedUser) {
      setPatient(storedUser)
    } else {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        patient,
        token,
        isLoading,
        isAuthenticated: !!patient && !!token,
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
