"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, ArrowRight, Bot, MessageCircle, Briefcase, LogOut, User, Clock, X, Sparkles, Zap, Target } from "lucide-react"
import Link from "next/link"
import { UserProfileDisplay } from "@/components/user-profile-display"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [emailCount, setEmailCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-green-900/20 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Card */}
        <div className="glass-card rounded-2xl p-6 mb-8 glow-blue">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center pulse-glow">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="welcome-text font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Welcome, {username || userEmail?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-gray-300 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-2" />
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            {/* User Profile & Logout Section */}
            <div className="profile-container flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <UserProfileDisplay 
                size="md" 
                className="w-full sm:w-auto min-w-[200px]" 
              />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all duration-300 w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Gmail Card */}
          <div className="glass-card rounded-2xl p-6 glow-blue hover:glow-blue cursor-pointer transition-all duration-500 group"
               onClick={() => setExpandedPanel(expandedPanel === 'gmail' ? null : 'gmail')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-3 pulse-glow">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Gmail</h3>
                  <p className="text-blue-300 text-sm">Email Management</p>
                </div>
              </div>
              {isRefreshing && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400 animate-count">{emailCount}</div>
                <div className="text-xs text-blue-300">Total</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400 animate-count">{unreadCount}</div>
                <div className="text-xs text-red-300">Unread</div>
              </div>
            </div>
            
            <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              {expandedPanel === 'gmail' ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          
          {/* AI Assistant Card */}
          <div className="glass-card rounded-2xl p-6 glow-violet hover:glow-violet cursor-pointer transition-all duration-500 group"
               onClick={() => setExpandedPanel(expandedPanel === 'ai' ? null : 'ai')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mr-3">
                  <Bot className="w-6 h-6 text-purple-400" />
                  <div className="flex space-x-1 ml-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full typing-dot"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full typing-dot"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full typing-dot"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">AI Assistant</h3>
                  <p className="text-purple-300 text-sm">Powered by Gemini</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 rounded-lg p-4 mb-4">
              <p className="text-purple-300 text-sm">Ready to help with insights, analysis, and career guidance</p>
            </div>
            
            <Button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 transition-all duration-300">
              <Zap className="w-4 h-4 mr-2" />
              {expandedPanel === 'ai' ? 'Collapse' : 'Chat Now'}
            </Button>
          </div>
          
          {/* Application Tracker Card */}
          <div className="glass-card rounded-2xl p-6 glow-green hover:glow-green cursor-pointer transition-all duration-500 group"
               onClick={() => setExpandedPanel(expandedPanel === 'tracker' ? null : 'tracker')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mr-3 pulse-glow">
                  <Briefcase className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Tracker</h3>
                  <p className="text-green-300 text-sm">Applications & Jobs</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-green-300 text-sm">Active Applications</span>
                <Badge className="bg-green-500/20 text-green-400">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300 text-sm">Interviews Scheduled</span>
                <Badge className="bg-yellow-500/20 text-yellow-400">3</Badge>
              </div>
            </div>
            
            <Button className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 transition-all duration-300">
              <Target className="w-4 h-4 mr-2" />
              {expandedPanel === 'tracker' ? 'Collapse' : 'View Details'}
            </Button>
          </div>
        </div>
        {/* Expanded Panels */}
        {expandedPanel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
               onClick={() => setExpandedPanel(null)}>
            <div className="glass-card rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">
                  {expandedPanel === 'gmail' && 'Gmail Management'}
                  {expandedPanel === 'ai' && 'AI Assistant'}
                  {expandedPanel === 'tracker' && 'Application Tracker'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setExpandedPanel(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {expandedPanel === 'gmail' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-400">{emailCount}</div>
                        <div className="text-blue-300">Total Emails</div>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-400">{unreadCount}</div>
                        <div className="text-red-300">Unread</div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-400">85%</div>
                        <div className="text-green-300">Organized</div>
                      </div>
                    </div>
                    <Link href="/gmail">
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        Open Gmail Inbox
                      </Button>
                    </Link>
                  </div>
                )}
                
                {expandedPanel === 'ai' && (
                  <div className="space-y-4">
                    <div className="bg-purple-500/10 rounded-lg p-4">
                      <p className="text-purple-300 mb-4">AI Assistant is ready to help you with:</p>
                      <ul className="space-y-2 text-purple-200">
                        <li>• Career guidance and advice</li>
                        <li>• Email analysis and insights</li>
                        <li>• Application tracking assistance</li>
                        <li>• Interview preparation</li>
                      </ul>
                    </div>
                    <Link href="/ai-chat">
                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start AI Chat
                      </Button>
                    </Link>
                  </div>
                )}
                
                {expandedPanel === 'tracker' && (
                  <div className="space-y-4">
                    <Tabs defaultValue="internships" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                        <TabsTrigger value="internships">Internships</TabsTrigger>
                        <TabsTrigger value="jobs">Jobs</TabsTrigger>
                        <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
                      </TabsList>
                      <TabsContent value="internships" className="space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="bg-green-500/10 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">Software Engineering Intern</h4>
                              <p className="text-green-300 text-sm">Tech Company {i}</p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">Applied</Badge>
                          </div>
                        ))}
                      </TabsContent>
                      <TabsContent value="jobs" className="space-y-3">
                        {[1,2].map(i => (
                          <div key={i} className="bg-blue-500/10 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">Full Stack Developer</h4>
                              <p className="text-blue-300 text-sm">Startup {i}</p>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-400">Interview</Badge>
                          </div>
                        ))}
                      </TabsContent>
                      <TabsContent value="hackathons" className="space-y-3">
                        <div className="bg-purple-500/10 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-white">AI Hackathon 2024</h4>
                            <p className="text-purple-300 text-sm">TechCorp</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Registered</Badge>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <Link href="/applications">
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                        <Briefcase className="w-4 h-4 mr-2" />
                        View Full Tracker
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}