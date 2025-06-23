"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Search, RefreshCw, Calendar, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Email {
  id: string
  subject: string
  from: string
  to: string
  date: Date
  snippet: string
  threadId: string
  labelIds: string[]
  userEmail: string
}

export default function GmailInboxPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    if (!email) {
      router.push('/auth/login')
      return
    }
    setUserEmail(email)
    // Only load cached data, no automatic refresh
    loadCachedData(email)
  }, [router])

  const loadCachedData = (email: string) => {
    const cachedEmails = localStorage.getItem(`gmail_emails_${email}`)
    const cachedUnreadCount = localStorage.getItem(`gmail_unread_${email}`)
    const cachedLastSync = localStorage.getItem(`gmail_last_sync_${email}`)
    
    if (cachedEmails) {
      const parsedEmails = JSON.parse(cachedEmails)
      setEmails(parsedEmails)
      setFilteredEmails(parsedEmails)
    }
    
    if (cachedUnreadCount) {
      setUnreadCount(parseInt(cachedUnreadCount))
    }
    
    if (cachedLastSync) {
      setLastSync(cachedLastSync)
    }
  }

  const manualRefresh = async () => {
    if (!userEmail) return
    
    setLoading(true)
    try {
      const [emailsResponse, unreadResponse] = await Promise.all([
        fetch('/api/gmail-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'recent',
            userEmail: userEmail,
            accessToken: 'demo_access_token_for_' + userEmail
          })
        }),
        fetch('/api/gmail-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'unread',
            userEmail: userEmail,
            accessToken: 'demo_access_token_for_' + userEmail
          })
        })
      ])
      
      const [emailsResult, unreadResult] = await Promise.all([
        emailsResponse.json(),
        unreadResponse.json()
      ])

      if (emailsResult.success) {
        const emailData = emailsResult.data || []
        setEmails(emailData)
        setFilteredEmails(emailData)
        localStorage.setItem(`gmail_emails_${userEmail}`, JSON.stringify(emailData))
        localStorage.setItem(`gmail_last_sync_${userEmail}`, new Date().toISOString())
        setLastSync(new Date().toISOString())
      }

      if (unreadResult.success) {
        const count = unreadResult.data || 0
        setUnreadCount(count)
        localStorage.setItem(`gmail_unread_${userEmail}`, count.toString())
      }
    } catch (error) {
      console.error('Error refreshing emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = emails.filter(email => 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredEmails(filtered)
    } else {
      setFilteredEmails(emails)
    }
  }, [searchTerm, emails])

  const formatDate = (date: Date) => {
    const now = new Date()
    const emailDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - emailDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return emailDate.toLocaleDateString()
  }

  if (!userEmail) {
    return null
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gmail Inbox</h1>
              <p className="text-gray-400">{userEmail}</p>
            </div>
          </div>
          <Button onClick={manualRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Total Emails</span>
              </div>
              <p className="text-2xl font-bold mt-2">{emails.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="w-4 h-4 bg-red-500" />
                <span className="text-sm font-medium">Unread</span>
              </div>
              <p className="text-2xl font-bold mt-2">{unreadCount}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Filtered</span>
              </div>
              <p className="text-2xl font-bold mt-2">{filteredEmails.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Gmail Inbox
            </CardTitle>
            <CardDescription>
              {emails.length > 0 ? 'Your cached Gmail emails - click Refresh for latest data' : 'No emails found - click Refresh to load'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>

            {/* Last Sync Info */}
            {lastSync && (
              <div className="text-xs text-gray-500 bg-gray-800/30 p-2 rounded">
                Last synced: {new Date(lastSync).toLocaleString()}
              </div>
            )}

            {/* Email List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmails.length > 0 ? (
                filteredEmails.map((email) => (
                  <div 
                    key={email.id} 
                    className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 cursor-pointer transition-colors"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-400 truncate">
                            {email.from.replace(/<.*?>/, '').trim()}
                          </span>
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        <h4 className="font-medium text-white mb-1 truncate">
                          {email.subject}
                        </h4>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {email.snippet}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {email.labelIds.includes('UNREAD') && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchTerm ? 'No emails match your search' : 'No emails found. Click Refresh to load your emails.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Detail Modal */}
        {selectedEmail && (
          <Card className="bg-gray-900/50 border-gray-700 mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Email Details</CardTitle>
                <Button 
                  onClick={() => setSelectedEmail(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedEmail.subject}</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <p><strong>From:</strong> {selectedEmail.from}</p>
                  <p><strong>To:</strong> {selectedEmail.to}</p>
                  <p><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedEmail.snippet}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}