"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight, Bot, MessageCircle, Briefcase, LogOut, User } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [emailCount, setEmailCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const fetchGmailData = useCallback(async (email: string) => {
    setIsRefreshing(true)
    try {
      const [emailsResponse, unreadResponse] = await Promise.all([
        fetch('/api/gmail-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'recent',
            userEmail: email,
            accessToken: 'demo_access_token_for_' + email
          })
        }),
        fetch('/api/gmail-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'unread',
            userEmail: email,
            accessToken: 'demo_access_token_for_' + email
          })
        })
      ])

      const [emailsResult, unreadResult] = await Promise.all([
        emailsResponse.json(),
        unreadResponse.json()
      ])

      if (emailsResult.success) {
        const emailData = emailsResult.data || []
        setEmailCount(emailData.length)
        localStorage.setItem(`gmail_emails_${email}`, JSON.stringify(emailData))
        localStorage.setItem(`gmail_last_sync_${email}`, new Date().toISOString())
        localStorage.setItem(`gmail_fetched_${email}`, 'true') // Mark as fetched
        setLastSync(new Date().toISOString())
      }

      if (unreadResult.success) {
        const count = unreadResult.data || 0
        setUnreadCount(count)
        localStorage.setItem(`gmail_unread_${email}`, count.toString())
      }
    } catch (error) {
      console.error('Gmail fetch error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const loadCachedData = useCallback((email: string) => {
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
  }, [])

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    const username = localStorage.getItem('user_username')
    
    if (email) {
      setUserEmail(email)
      setUsername(username)
      loadCachedData(email)
      
      // Check if data has been fetched for this session
      const alreadyFetched = localStorage.getItem(`gmail_fetched_${email}`)
      
      if (!alreadyFetched) {
        // Only fetch if not already fetched in this session
        fetchGmailData(email)
      }
    }
    
    setLoading(false)
  }, [fetchGmailData, loadCachedData])

  const handleLogout = () => {
    const email = localStorage.getItem('user_email')
    if (email) {
      // Clear all data including fetch flag
      localStorage.removeItem(`gmail_emails_${email}`)
      localStorage.removeItem(`gmail_unread_${email}`)
      localStorage.removeItem(`gmail_last_sync_${email}`)
      localStorage.removeItem(`gmail_fetched_${email}`)
      localStorage.removeItem(`applications_${email}`)
    }
    
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_username')
    localStorage.removeItem('gmail_verified')
    localStorage.removeItem('gmail_verified_at')
    localStorage.removeItem('user_session_start')
    
    document.cookie = 'user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with User Info and Logout */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {username || userEmail}!</h1>
          <p className="text-gray-400">Here's your personalized dashboard</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            <div>
              <span className="text-sm font-medium">{username || userEmail}</span>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-red-600/50 text-red-400 hover:bg-red-600/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Gmail Inbox Card */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Gmail Inbox
            </div>
            {isRefreshing && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </CardTitle>
          <CardDescription>
            Access your Gmail emails (fetched once per session)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gmail Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg transition-all duration-300">
              <p className="text-2xl font-bold text-blue-400">{emailCount}</p>
              <p className="text-sm text-gray-400">Total Emails</p>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg transition-all duration-300">
              <p className="text-2xl font-bold text-red-400">{unreadCount}</p>
              <p className="text-sm text-gray-400">Unread</p>
            </div>
          </div>
          
          {lastSync && (
            <p className="text-xs text-gray-500 mb-4">
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}
          
          <Link href="/gmail">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full transition-colors duration-200">
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
            <Button className="bg-purple-600 hover:bg-purple-700 w-full transition-colors duration-200">
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
            <Button className="bg-green-600 hover:bg-green-700 w-full transition-colors duration-200">
              <Briefcase className="w-4 h-4 mr-2" />
              View Application Tracker
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}