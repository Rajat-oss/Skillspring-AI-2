"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Mail, Search, Clock, User, X, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  to?: string;
  date: Date;
  snippet: string;
  body?: string;
}

interface FullEmail extends GmailEmail {
  body: string;
  to: string;
}

export function GmailRealtimeViewer() {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<GmailEmail[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<FullEmail | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)

  const fetchGmailData = async (action: string = 'recent', query?: string) => {
    if (!session?.user?.email || !session?.accessToken) {
      console.log('No valid session or token')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/gmail-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: session.user.email,
          accessToken: session.accessToken,
          action,
          query
        })
      })

      const data = await response.json()
      if (data.success) {
        if (action === 'recent' || action === 'search') {
          setEmails(data.data.map((email: any) => ({
            ...email,
            date: new Date(email.date)
          })))
        } else if (action === 'unread') {
          setUnreadCount(data.data)
        }
        setLastUpdate(new Date())
      } else {
        console.log('Failed to fetch Gmail data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching Gmail data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchGmailData('search', searchQuery)
    } else {
      fetchGmailData('recent')
    }
  }

  const fetchFullEmail = async (messageId: string) => {
    if (!session?.user?.email || !session?.accessToken) return
    
    setLoadingEmail(true)
    try {
      const response = await fetch('/api/gmail-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          accessToken: session.accessToken,
          action: 'fullEmail',
          messageId
        })
      })

      const data = await response.json()
      if (data.success && data.data) {
        setSelectedEmail({
          ...data.data,
          date: new Date(data.data.date)
        })
      }
    } catch (error) {
      console.error('Error fetching full email:', error)
    } finally {
      setLoadingEmail(false)
    }
  }

  useEffect(() => {
    // Initial load
    fetchGmailData('recent')
    fetchGmailData('unread')

    // Auto-refresh every 10 seconds for real-time
    const interval = setInterval(() => {
      fetchGmailData('recent')
      fetchGmailData('unread')
    }, 10000)

    return () => clearInterval(interval)
  }, [session])

  if (!session?.user?.email) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400">Please log in to view Gmail data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Mail className="w-6 h-6 mr-2 text-blue-400" />
            Gmail Real-Time Data
          </h2>
          <p className="text-gray-400 text-sm">
            {session.user.email} • {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-red-600">
            {unreadCount} Unread
          </Badge>
          <Button 
            onClick={() => {
              fetchGmailData('recent')
              fetchGmailData('unread')
            }}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search emails (e.g., from:company.com, subject:interview)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-gray-800 border-gray-600"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emails List */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Recent Emails ({emails.length})
          </CardTitle>
          <CardDescription>
            All Gmail data from the last month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && emails.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Gmail data...</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => fetchFullEmail(email.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg line-clamp-1 hover:text-blue-400">{email.subject}</h4>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {email.date.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <User className="w-4 h-4 mr-1" />
                      {email.from}
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {email.snippet}
                    </p>
                  </div>
                ))}
                
                {emails.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">No emails found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Viewer Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedEmail(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Email Details</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedEmail(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Email Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingEmail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading email...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email Headers */}
                  <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">From:</span>
                        <p className="text-gray-200">{selectedEmail.from}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">To:</span>
                        <p className="text-gray-200">{selectedEmail.to}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Date:</span>
                        <p className="text-gray-200">{selectedEmail.date.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Message</h3>
                    <div className="prose prose-invert max-w-none">
                      {selectedEmail.body.includes('<') ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                          className="text-gray-200 leading-relaxed"
                        />
                      ) : (
                        <pre className="text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                          {selectedEmail.body}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}