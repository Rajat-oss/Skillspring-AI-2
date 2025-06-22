"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  signup as firebaseSignup,
  login as firebaseLogin,
  logout as firebaseLogout,
  onAuthStateChangedListener,
  FirebaseUser,
} from "@/lib/firebase"

interface User {
  id: string
  email: string
  role: "individual"
  profile?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "individual") => Promise<void>
  signup: (email: string, password: string, role: "individual") => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapFirebaseUserToUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    role: "individual",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
      setUser(mapFirebaseUserToUser(firebaseUser))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string, role: "individual") => {
    setLoading(true)
    try {
      const userCredential = await firebaseLogin(email, password)
      const userData = mapFirebaseUserToUser(userCredential.user)
      const token = await userCredential.user.getIdToken()

      if (userData) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('loginTime', new Date().toISOString())
        setUser(userData)
        setLoading(false)
      }


    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, role: "individual") => {
    setLoading(true)
    try {
      const userCredential = await firebaseSignup(email, password)
      setUser(mapFirebaseUserToUser(userCredential.user))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await firebaseLogout()
      setUser(null)
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