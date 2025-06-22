"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession, signIn } from "next-auth/react"
import { RefreshCw, Mail, ExternalLink, Calendar, Building } from "lucide-react"

interface ApplicationData {
  id: string;
  platform: string;
  company: string;
  role: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  applicationDate: Date;
  emailSubject: string;
  emailFrom: string;
}

interface ConnectedPlatform {
  name: string;
  domain: string;
  count: number;
}

export function ApplicationTracker() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      fetchApplications()
      fetchPlatforms()
    }
  }, [session])

  const fetchApplications = async () => {
    if (!session?.accessToken) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/applications')
      const data = await response.json()
      if (data.applications) {
        setApplications(data.applications.map((app: any) => ({
          ...app,
          applicationDate: new Date(app.applicationDate)
        })))
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    if (!session?.accessToken) return
    
    try {
      const response = await fetch('/api/platforms')
      const data = await response.json()
      if (data.platforms) {
        setPlatforms(data.platforms)
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
    }
  }

  const refreshApplications = async () => {
    if (!session?.accessToken) return
    
    setRefreshing(true)
    try {
      const response = await fetch('/api/applications', { method: 'POST' })
      const data = await response.json()
      if (data.applications) {
        setApplications(data.applications.map((app: any) => ({
          ...app,
          applicationDate: new Date(app.applicationDate)
        })))
      }
      await fetchPlatforms()
    } catch (error) {
      console.error('Error refreshing applications:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-green-600'
      case 'interview': return 'bg-blue-600'
      case 'rejected': return 'bg-red-600'
      case 'applied': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selected': return 'Selected'
      case 'interview': return 'Interview'
      case 'rejected': return 'Rejected'
      case 'applied': return 'Applied'
      default: return 'Pending'
    }
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <Mail className="w-6 h-6 mr-2" />
              Smart Application Tracker
            </CardTitle>
            <CardDescription>
              Connect your Gmail to automatically track all your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Connect Gmail Account
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle>Connected Apps</CardTitle>
            <CardDescription>Platforms where you have activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Connect your Gmail to see your connected platforms</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-blue-400">
                <Mail className="w-6 h-6 mr-2" />
                Applied Applications ({applications.length})
              </CardTitle>
              <CardDescription>
                Automatically detected from your Gmail
              </CardDescription>
            </div>
            <Button 
              onClick={refreshApplications}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No applications found. Try refreshing or check your Gmail for application emails.
            </p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{app.role}</h3>
                      <p className="text-gray-400 flex items-center mt-1">
                        <Building className="w-4 h-4 mr-1" />
                        {app.company} • {app.platform}
                      </p>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {getStatusText(app.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    Applied on {app.applicationDate.toLocaleDateString()}
                  </div>
                  
                  <p className="text-sm text-gray-300 truncate">
                    {app.emailSubject}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle>Connected Apps ({platforms.length})</CardTitle>
          <CardDescription>Platforms where you have activity</CardDescription>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <p className="text-gray-400">No connected platforms found</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="border border-gray-700 rounded-lg p-3 text-center">
                  <h4 className="font-medium">{platform.name}</h4>
                  <p className="text-sm text-gray-400">{platform.count} applications</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}