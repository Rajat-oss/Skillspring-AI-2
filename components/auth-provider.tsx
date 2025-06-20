
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: "individual" | "startup"
  profession: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "individual" | "startup") => Promise<void>
  signup: (email: string, password: string, role: "individual" | "startup", profession: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token and verify it
    const token = localStorage.getItem('token')
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      // Try multiple backend URLs in case of network issues
      const backendUrls = [
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://0.0.0.0:8000',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
      ]

      let response: Response | null = null

      for (const url of backendUrls) {
        try {
          response = await fetch(`${url}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            break
          }
        } catch (err) {
          console.warn(`Failed to verify token with ${url}:`, err)
          continue
        }
      }

      if (response && response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, role: "individual" | "startup") => {
    setLoading(true)
    try {
      // Try multiple backend URLs in case of network issues
      const backendUrls = [
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://0.0.0.0:8000',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
      ]

      let response: Response | null = null
      let lastError: Error | null = null

      for (const url of backendUrls) {
        try {
          console.log(`Attempting to connect to: ${url}/auth/login`)
          response = await fetch(`${url}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })
          
          if (response.ok) {
            console.log(`Successfully connected to: ${url}`)
            break
          }
        } catch (err) {
          console.warn(`Failed to connect to ${url}:`, err)
          lastError = err as Error
          continue
        }
      }

      if (!response) {
        throw new Error(`Cannot connect to backend. Last error: ${lastError?.message}`)
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }

      const data = await response.json()
      
      // Store token and user data
      localStorage.setItem('token', data.access_token)
      setUser(data.user)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, role: "individual" | "startup", profession: string) => {
    setLoading(true)
    try {
      // Try multiple backend URLs in case of network issues
      const backendUrls = [
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://0.0.0.0:8000',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
      ]

      let response: Response | null = null
      let lastError: Error | null = null

      for (const url of backendUrls) {
        try {
          console.log(`Attempting to connect to: ${url}/auth/signup`)
          response = await fetch(`${url}/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role, profession }),
          })
          
          if (response.ok) {
            console.log(`Successfully connected to: ${url}`)
            break
          }
        } catch (err) {
          console.warn(`Failed to connect to ${url}:`, err)
          lastError = err as Error
          continue
        }
      }

      if (!response) {
        throw new Error(`Cannot connect to backend. Last error: ${lastError?.message}`)
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Signup failed')
      }

      const data = await response.json()
      
      // Store token and user data
      localStorage.setItem('token', data.access_token)
      setUser(data.user)
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // Clear local storage and state
      localStorage.removeItem('token')
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
