"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession, signIn } from "next-auth/react"
import { RefreshCw, Mail, Calendar, Building, Briefcase, Code, Trophy, Brain } from "lucide-react"
import { RealOTPVerification } from "@/components/real-otp-verification"
import { GmailVerificationService } from "@/lib/gmail-verification-service"

interface ApplicationData {
  id: string;
  platform: string;
  company: string;
  role: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  applicationDate: Date;
  emailSubject: string;
  emailFrom: string;
  type: 'job' | 'internship' | 'hackathon';
  confidence: number;
}

interface ConnectedPlatform {
  name: string;
  domain: string;
  count: number;
}

export function RealTimeApplicationTracker() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<ApplicationData[]>([])
  const [internships, setInternships] = useState<ApplicationData[]>([])
  const [hackathons, setHackathons] = useState<ApplicationData[]>([])
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([])
  const [insights, setInsights] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [checkingVerification, setCheckingVerification] = useState(true)

  useEffect(() => {
    if (session?.accessToken) {
      fetchCategorizedApplications()
    }
    fetchPlatforms()
  }, [session])

  const fetchCategorizedApplications = async () => {
    if (!session?.user?.email) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/gmail-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userEmail: session.user.email,
          accessToken: session.accessToken 
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setJobs(data.jobs || [])
        setInternships(data.internships || [])
        setHackathons(data.hackathons || [])
        setInsights(data.insights || "AI has analyzed your applications and found patterns in your job search activity.")
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    // Mock platforms data
    setPlatforms([
      { name: 'LinkedIn', domain: 'linkedin.com', count: 0 },
      { name: 'Indeed', domain: 'indeed.com', count: 0 },
      { name: 'Naukri', domain: 'naukri.com', count: 0 }
    ])
  }

  const refreshApplications = async () => {
    setRefreshing(true)
    await fetchCategorizedApplications()
    await fetchPlatforms()
    setRefreshing(false)
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

  const renderApplications = (applications: ApplicationData[], icon: any) => (
    <div className="space-y-4">
      {applications.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No applications found in the last month</p>
      ) : (
        applications.map((app) => (
          <div key={app.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {icon}
                <div>
                  <h4 className="font-semibold text-lg">{app.role}</h4>
                  <p className="text-gray-400 flex items-center mt-1">
                    <Building className="w-4 h-4 mr-1" />
                    {app.company} • {app.platform}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(app.status)}>
                  {getStatusText(app.status)}
                </Badge>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(app.confidence * 100)}% confidence
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Calendar className="w-4 h-4 mr-1" />
              Applied on {app.applicationDate.toLocaleDateString()}
            </div>
            
            <p className="text-sm text-gray-300 truncate">
              {app.emailSubject}
            </p>
          </div>
        ))
      )}
    </div>
  )

  const handleEmailVerified = async (email: string) => {
    setVerifiedEmail(email)
    
    // Save verification status permanently
    try {
      await fetch('/api/save-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verified: true })
      })
      console.log('Verification saved permanently for:', email)
    } catch (error) {
      console.error('Error saving verification:', error)
    }
    
    // Fetch applications
    fetchCategorizedApplications()
  }

  // Check verification status on load and set up real-time updates
  useEffect(() => {
    const checkVerification = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/check-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          })
          const data = await response.json()
          
          if (data.verified) {
            setVerifiedEmail(session.user.email)
            fetchCategorizedApplications()
          }
        } catch (error) {
          console.error('Error checking verification:', error)
        }
      }
      setCheckingVerification(false)
    }

    checkVerification()
    
    // Set up periodic check for verification status
    const interval = setInterval(() => {
      if (session?.user?.email && !verifiedEmail) {
        checkVerification()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [session, verifiedEmail])

  if (checkingVerification) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Checking Gmail verification status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verifiedEmail) {
    return (
      <div className="space-y-6">
        <RealOTPVerification onVerified={handleEmailVerified} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <Mail className="w-6 h-6 mr-2" />
              Complete Gmail Connection
            </CardTitle>
            <CardDescription>
              Email verified: {verifiedEmail}. Now authorize Gmail access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Mail className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-gray-400 mb-4">
                ✅ Email verified. Click below to authorize Gmail access.
              </p>
              <Button 
                onClick={() => signIn('google')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Authorize Gmail Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {insights && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-400">
              <Brain className="w-6 h-6 mr-2" />
              AI Career Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{insights}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Applications (Last Month)</h2>
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

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="jobs" className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Jobs ({jobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="internships" className="flex items-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Internships ({internships.length})</span>
          </TabsTrigger>
          <TabsTrigger value="hackathons" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Hackathons ({hackathons.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-green-400">
                <Briefcase className="w-6 h-6 mr-2" />
                Job Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading job applications...</p>
                </div>
              ) : (
                renderApplications(jobs, <Briefcase className="w-5 h-5 text-green-400 mt-1" />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internships">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-400">
                <Code className="w-6 h-6 mr-2" />
                Internship Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading internship applications...</p>
                </div>
              ) : (
                renderApplications(internships, <Code className="w-5 h-5 text-blue-400 mt-1" />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hackathons">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-400">
                <Trophy className="w-6 h-6 mr-2" />
                Hackathon Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading hackathon applications...</p>
                </div>
              ) : (
                renderApplications(hackathons, <Trophy className="w-5 h-5 text-purple-400 mt-1" />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle>Connected Platforms ({platforms.length})</CardTitle>
          <CardDescription>Platforms detected from your Gmail</CardDescription>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <p className="text-gray-400">No platforms detected</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="border border-gray-700 rounded-lg p-3 text-center hover:border-gray-600 transition-colors">
                  <h4 className="font-medium">{platform.name}</h4>
                  <p className="text-sm text-gray-400">{platform.count} apps</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}