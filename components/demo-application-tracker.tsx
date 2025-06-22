"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Mail, ExternalLink, Calendar, Building, Globe } from "lucide-react"

const demoApplications = [
  {
    id: '1',
    platform: 'LinkedIn',
    company: 'Google',
    role: 'Software Engineer Intern',
    status: 'interview' as const,
    applicationDate: new Date('2024-01-15'),
    emailSubject: 'Interview scheduled for Software Engineer Intern position at Google',
    emailFrom: 'noreply@linkedin.com'
  },
  {
    id: '2',
    platform: 'Unstop',
    company: 'Microsoft',
    role: 'Product Manager',
    status: 'applied' as const,
    applicationDate: new Date('2024-01-10'),
    emailSubject: 'Application received for Product Manager role at Microsoft',
    emailFrom: 'noreply@unstop.com'
  },
  {
    id: '3',
    platform: 'Internshala',
    company: 'Flipkart',
    role: 'Data Analyst',
    status: 'selected' as const,
    applicationDate: new Date('2024-01-08'),
    emailSubject: 'Congratulations! You have been selected for Data Analyst position',
    emailFrom: 'noreply@internshala.com'
  },
  {
    id: '4',
    platform: 'Devfolio',
    company: 'Zomato',
    role: 'Frontend Developer',
    status: 'rejected' as const,
    applicationDate: new Date('2024-01-05'),
    emailSubject: 'Update on your Frontend Developer application',
    emailFrom: 'noreply@devfolio.co'
  }
]

const demoPlatforms = [
  { name: 'LinkedIn', domain: 'linkedin.com', count: 5 },
  { name: 'Unstop', domain: 'unstop.com', count: 3 },
  { name: 'Internshala', domain: 'internshala.com', count: 4 },
  { name: 'Devfolio', domain: 'devfolio.co', count: 2 },
  { name: 'Naukri', domain: 'naukri.com', count: 1 }
]

export function DemoApplicationTracker() {
  const [showDemo, setShowDemo] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-blue-400">
                <Mail className="w-6 h-6 mr-2" />
                Smart Application Tracker
              </CardTitle>
              <CardDescription>
                Connect your Gmail to automatically track all your job applications
              </CardDescription>
            </div>
            {showDemo && (
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!showDemo ? (
            <div className="text-center py-8">
              <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400 mb-4">
                Connect your Gmail account to automatically track your applications
              </p>
              <Button 
                onClick={() => setShowDemo(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Applied Applications ({demoApplications.length})</h3>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Gmail Connected
                </Badge>
              </div>
              
              {demoApplications.map((app) => (
                <div key={app.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{app.role}</h4>
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
          <CardTitle>Connected Apps ({showDemo ? demoPlatforms.length : 0})</CardTitle>
          <CardDescription>Platforms where you have activity</CardDescription>
        </CardHeader>
        <CardContent>
          {!showDemo ? (
            <p className="text-gray-400">Connect your Gmail to see your connected platforms</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {demoPlatforms.map((platform) => (
                <div key={platform.name} className="border border-gray-700 rounded-lg p-3 text-center hover:border-gray-600 transition-colors">
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