"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, RefreshCw, Mail } from "lucide-react"
import { useSession, signIn } from "next-auth/react"

export function GmailAuthStatus() {
  const { data: session } = useSession()
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'not_authorized'>('checking')
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    checkAuthStatus()
    
    // Real-time status updates
    const interval = setInterval(() => {
      checkAuthStatus()
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [session])

  const checkAuthStatus = async () => {
    if (!session?.user?.email) {
      setAuthStatus('not_authorized')
      return
    }

    try {
      // Check localStorage for verification
      const savedEmail = localStorage.getItem('gmail_verified')
      const savedAt = localStorage.getItem('gmail_verified_at')
      
      if (savedEmail === session.user.email && savedAt) {
        const verifiedDate = new Date(savedAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setIsVerified(true)
        } else {
          localStorage.removeItem('gmail_verified')
          localStorage.removeItem('gmail_verified_at')
          setIsVerified(false)
        }
      } else {
        setIsVerified(false)
      }

      // Check Gmail connection status
      const gmailConnected = localStorage.getItem('gmail_connected')
      if (gmailConnected === session.user.email) {
        setAuthStatus('authorized')
        setLastSync(localStorage.getItem('gmail_connected_at'))
      } else {
        setAuthStatus('not_authorized')
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setAuthStatus('not_authorized')
    }
  }

  const handleAuthorize = async () => {
    try {
      const result = await signIn('google', { 
        redirect: false,
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly'
      })
      
      if (result?.ok && session?.user?.email) {
        // Save Gmail connection in localStorage
        localStorage.setItem('gmail_connected', session.user.email)
        localStorage.setItem('gmail_connected_at', new Date().toISOString())
        
        setTimeout(() => {
          checkAuthStatus()
        }, 1000)
      }
    } catch (error) {
      console.error('Authorization error:', error)
    }
  }

  if (authStatus === 'checking') {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking Gmail authorization...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Gmail Integration
          </CardTitle>
          <Badge 
            className={authStatus === 'authorized' ? 'bg-green-600' : 'bg-red-600'}
          >
            {authStatus === 'authorized' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Verification Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              Email {isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>

          {/* Gmail Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${authStatus === 'authorized' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              Gmail {authStatus === 'authorized' ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {authStatus === 'authorized' ? (
            <div>
              <p className="text-sm text-green-400">
                ✅ Gmail is connected and authorized
              </p>
              {lastSync && (
                <p className="text-xs text-gray-400">
                  Last synced: {new Date(lastSync).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400">
                {isVerified ? 'Email verified. Connect Gmail to fetch applications.' : 'Verify email first, then connect Gmail.'}
              </p>
              {isVerified && (
                <Button 
                  onClick={handleAuthorize}
                  className="bg-blue-600 hover:bg-blue-700 mt-2"
                  size="sm"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Connect Gmail
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}