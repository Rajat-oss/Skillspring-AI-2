"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: "individual" | "startup"
  profile?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "individual" | "startup") => Promise<void>
  signup: (email: string, password: string, role: "individual" | "startup") => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function hashPassword(password: string): string {
  // Simple hash function for demo purposes (not secure)
  let hash = 0, i, chr
  if (password.length === 0) return hash.toString()
  for (i = 0; i < password.length; i++) {
    chr = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return hash.toString()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("skillspring_user");
    const savedPasswordHash = localStorage.getItem("skillspring_password_hash");
    if (savedUser && savedPasswordHash) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [])

  const login = async (email: string, password: string, role: "individual" | "startup") => {
    const usersStr = localStorage.getItem("skillspring_users");
    const users = usersStr ? JSON.parse(usersStr) : [];
    const passwordHash = hashPassword(password);

    const foundUser = users.find((u: any) => u.email === email && u.password_hash === passwordHash && u.role === role);
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    setUser({
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
    });
    localStorage.setItem("skillspring_user", JSON.stringify({
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
    }));
    localStorage.setItem("skillspring_password_hash", passwordHash);
  }

  const signup = async (email: string, password: string, role: "individual" | "startup") => {
    const usersStr = localStorage.getItem("skillspring_users");
    const users = usersStr ? JSON.parse(usersStr) : [];

    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const id = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    const newUser = {
      id,
      email,
      password_hash: passwordHash,
      role,
    };

    users.push(newUser);
    localStorage.setItem("skillspring_users", JSON.stringify(users));
    localStorage.setItem("skillspring_user", JSON.stringify({
      id,
      email,
      role,
    }));
    localStorage.setItem("skillspring_password_hash", passwordHash);

    setUser({
      id,
      email,
      role,
    });
  }

  const logout = () => {
    setUser(null);
    localStorage.removeItem("skillspring_user");
    localStorage.removeItem("skillspring_password_hash");
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
