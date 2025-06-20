"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { IndividualDashboard } from "@/components/individual-dashboard"

export default function IndividualDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log('IndividualDashboardPage user:', user)
  console.log('IndividualDashboardPage loading:', loading)

  useEffect(() => {
    if (!loading && !user) {
      console.log('Redirecting to login - no user found')
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <IndividualDashboard />
}