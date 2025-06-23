"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import Link from "next/link"

export function DashboardNav() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setUserEmail(localStorage.getItem('user_email'))
  }, [])

  const handleSignOut = () => {
    const email = localStorage.getItem('user_email')
    if (email) {
      // Clear Gmail data for this user
      localStorage.removeItem(`gmail_emails_${email}`)
      localStorage.removeItem(`gmail_unread_${email}`)
      localStorage.removeItem(`gmail_last_sync_${email}`)
    }
    localStorage.clear()
    router.push('/')
  }

  return (
    <nav className="bg-gray-900/50 border-b border-gray-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Home className="w-5 h-5" />
          <span className="font-semibold">SkillSpring Dashboard</span>
        </Link>
        
        {userEmail && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {userEmail}
            </span>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}