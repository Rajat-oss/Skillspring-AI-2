"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, ArrowRight, Bot, MessageCircle, Briefcase, Building } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailCount, setEmailCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    if (!email) {
      router.push('/auth/login')
      return
    }
    setUserEmail(email)
    loadGmailData(email)
    setLoading(false)
  }, [router])

  const loadGmailData = (email: string) => {
    const cachedEmails = localStorage.getItem(`gmail_emails_${email}`)
    const cachedUnreadCount = localStorage.getItem(`gmail_unread_${email}`)
    const cachedLastSync = localStorage.getItem(`gmail_last_sync_${email}`)
    
    if (cachedEmails) {
      const emails = JSON.parse(cachedEmails)
      setEmailCount(emails.length)
    }
    
    if (cachedUnreadCount) {
      setUnreadCount(parseInt(cachedUnreadCount))
    }
    
    if (cachedLastSync) {
      setLastSync(cachedLastSync)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userEmail) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen gradient-bg">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-400">Here's your personalized dashboard</p>
        </div>
        
        {/* Gmail Inbox Card */}
        <Card className="bg-gray-900/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Gmail Inbox
            </CardTitle>
            <CardDescription>
              Access your Gmail emails and manage your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gmail Stats */}
            {emailCount > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{emailCount}</p>
                  <p className="text-sm text-gray-400">Total Emails</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{unreadCount}</p>
                  <p className="text-sm text-gray-400">Unread</p>
                </div>
              </div>
            )}
            
            {lastSync && (
              <p className="text-xs text-gray-500 mb-4">
                Last synced: {new Date(lastSync).toLocaleString()}
              </p>
            )}
            
            <Link href="/gmail">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                <Mail className="w-4 h-4 mr-2" />
                Open Gmail Inbox
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Chat Card */}
        <Card className="bg-gray-900/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Chat with AI powered by Gemini for instant help and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ai-chat">
              <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Start AI Chat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Application Tracker Card */}
        <Card className="bg-gray-900/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Application Tracker
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your job applications, internships, and hackathons from Gmail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/applications">
              <Button className="bg-green-600 hover:bg-green-700 w-full">
                <Building className="w-4 h-4 mr-2" />
                View Application Tracker
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
