"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient, type User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      console.log("[v0] Initializing auth state")
      if (apiClient.isAuthenticated()) {
        try {
          const profile = await apiClient.getProfile()
          setUser(profile)
          console.log("[v0] User authenticated:", profile.email)
        } catch (error) {
          console.error("[v0] Failed to get user profile:", error)
          apiClient.logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const signin = async (email: string, password: string) => {
    console.log("[v0] Auth hook: signing in")
    setLoading(true)
    try {
      const response = await apiClient.signin(email, password)
      setUser(response.user)
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    console.log("[v0] Auth hook: signing up")
    setLoading(true)
    try {
      const response = await apiClient.signup(email, password, name)
      setUser(response.user)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log("[v0] Auth hook: logging out")
    apiClient.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signin,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
