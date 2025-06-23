"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw, User, Calendar, Building } from "lucide-react"
import { EmailSection } from "@/components/email-section"

export function UserGmailDashboard() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState({ jobs: [], internships: [], hackathons: [] })
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchApplications()
    }
  }, [session])

  const fetchApplications = async () => {
    if (!session?.user?.email) return
    
    setLoading(true)
    try {
      const appResponse = await fetch('/api/gmail-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const appData = await appResponse.json()
      
      setApplications(appData)
      setLastSync(new Date().toISOString())
      
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please sign in to view your Gmail data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600">Connected</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Job Applications</span>
            </div>
            <p className="text-2xl font-bold mt-2">{applications.jobs?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Internships</span>
            </div>
            <p className="text-2xl font-bold mt-2">{applications.internships?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium">Hackathons</span>
            </div>
            <p className="text-2xl font-bold mt-2">{applications.hackathons?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gmail Email Section */}
      <EmailSection />

      {/* Applications Summary */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Application Insights</CardTitle>
            <Button 
              onClick={fetchApplications} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>{applications.insights || 'Your application tracking summary'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {applications.jobs?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-400">Recent Job Applications</h4>
                {applications.jobs.slice(0, 3).map((job: any, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-800/50 rounded">
                    <p className="font-medium">{job.role}</p>
                    <p className="text-gray-400">{job.company}</p>
                    <Badge size="sm" className={
                      job.status === 'selected' ? 'bg-green-600' :
                      job.status === 'interview' ? 'bg-blue-600' :
                      job.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}