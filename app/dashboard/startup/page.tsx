"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { StartupDashboard } from "@/components/startup-dashboard"

export default function StartupDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("StartupDashboardPage user:", user)
    console.log("StartupDashboardPage loading:", loading)
    if (!loading && (!user || user.role !== "startup")) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "startup") {
    return null
  }

  return <StartupDashboard />
}
