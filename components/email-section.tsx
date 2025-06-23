"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Search, RefreshCw, Calendar, User, ExternalLink } from "lucide-react"

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

export function EmailSection() {
  const [emails, setEmails] = useState<Email[]>([])
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  useEffect(() => {
    fetchEmails()
    fetchUnreadCount()
  }, [])

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

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gmail-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recent' })
      })
      
      const result = await response.json()
      if (result.success) {
        setEmails(result.data || [])
      } else {
        console.error('Failed to fetch emails:', result.error)
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/gmail-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unread' })
      })
      
      const result = await response.json()
      if (result.success) {
        setUnreadCount(result.data || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

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

  const getEmailPreview = (snippet: string) => {
    return snippet.length > 100 ? snippet.substring(0, 100) + '...' : snippet
  }

  return (
    <div className="space-y-6">
      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Your Gmail Inbox
            </CardTitle>
            <Button 
              onClick={fetchEmails} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            All emails from your Gmail account
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

          {/* Email List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your emails...</p>
              </div>
            ) : filteredEmails.length > 0 ? (
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
                        {getEmailPreview(email.snippet)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {email.labelIds.includes('UNREAD') && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'No emails match your search' : 'No emails found'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <Card className="bg-gray-900/50 border-gray-700">
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
  )
}