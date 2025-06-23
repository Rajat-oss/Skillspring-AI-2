"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Briefcase, GraduationCap, Code, ArrowLeft, RefreshCw, Search, Calendar, Building, TrendingUp, Filter } from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  type: 'job' | 'internship' | 'hackathon'
  company: string
  position: string
  status: 'applied' | 'interview' | 'selected' | 'rejected'
  date: Date
  emailSubject: string
}

export default function ApplicationsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [applications, setApplications] = useState<{
    jobs: Application[]
    internships: Application[]
    hackathons: Application[]
  }>({ jobs: [], internships: [], hackathons: [] })
  const [filteredApplications, setFilteredApplications] = useState<{
    jobs: Application[]
    internships: Application[]
    hackathons: Application[]
  }>({ jobs: [], internships: [], hackathons: [] })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    if (!email) {
      router.push('/auth/login')
      return
    }
    setUserEmail(email)
    loadApplications(email)
  }, [router])

  useEffect(() => {
    filterApplications()
  }, [searchTerm, statusFilter, applications])

  const loadApplications = (email: string) => {
    const cachedApplications = localStorage.getItem(`applications_${email}`)
    if (cachedApplications) {
      const parsed = JSON.parse(cachedApplications)
      setApplications(parsed)
    }
  }

  const analyzeApplications = async () => {
    if (!userEmail) return
    
    setLoading(true)
    try {
      const cachedEmails = localStorage.getItem(`gmail_emails_${userEmail}`)
      if (!cachedEmails) {
        setLoading(false)
        return
      }
      
      const emails = JSON.parse(cachedEmails)
      const analyzedApplications = {
        jobs: [] as Application[],
        internships: [] as Application[],
        hackathons: [] as Application[]
      }
      
      emails.forEach((email: any) => {
        const subject = email.subject.toLowerCase()
        const from = email.from.toLowerCase()
        const snippet = email.snippet?.toLowerCase() || ''
        
        // Enhanced job application detection
        if (subject.includes('job') || subject.includes('position') || subject.includes('career') || 
            subject.includes('application received') || subject.includes('thank you for applying') ||
            from.includes('careers') || from.includes('jobs') || from.includes('hr') ||
            snippet.includes('job application') || snippet.includes('position') ||
            subject.includes('software engineer') || subject.includes('developer') ||
            subject.includes('analyst') || subject.includes('manager')) {
          
          let status: Application['status'] = 'applied'
          if (subject.includes('interview') || subject.includes('selected for interview') || snippet.includes('interview')) status = 'interview'
          if (subject.includes('congratulations') || subject.includes('offer') || subject.includes('selected') || subject.includes('hired')) status = 'selected'
          if (subject.includes('rejected') || subject.includes('not selected') || subject.includes('unsuccessful') || subject.includes('regret')) status = 'rejected'
          
          analyzedApplications.jobs.push({
            id: email.id,
            type: 'job',
            company: extractCompany(email.from),
            position: extractPosition(email.subject),
            status,
            date: new Date(email.date),
            emailSubject: email.subject
          })
        }
        
        // Enhanced internship detection
        else if (subject.includes('internship') || subject.includes('intern') || 
                 subject.includes('summer program') || subject.includes('training program') ||
                 snippet.includes('internship') || snippet.includes('intern program')) {
          
          let status: Application['status'] = 'applied'
          if (subject.includes('interview') || snippet.includes('interview')) status = 'interview'
          if (subject.includes('congratulations') || subject.includes('offer') || subject.includes('selected')) status = 'selected'
          if (subject.includes('rejected') || subject.includes('not selected')) status = 'rejected'
          
          analyzedApplications.internships.push({
            id: email.id,
            type: 'internship',
            company: extractCompany(email.from),
            position: extractPosition(email.subject),
            status,
            date: new Date(email.date),
            emailSubject: email.subject
          })
        }
        
        // Enhanced hackathon detection
        else if (subject.includes('hackathon') || subject.includes('hack') || 
                 subject.includes('coding competition') || subject.includes('dev fest') ||
                 subject.includes('registration confirmed') && (from.includes('hack') || from.includes('dev')) ||
                 snippet.includes('hackathon') || snippet.includes('coding competition')) {
          
          let status: Application['status'] = 'applied'
          if (subject.includes('selected') || subject.includes('accepted')) status = 'selected'
          
          analyzedApplications.hackathons.push({
            id: email.id,
            type: 'hackathon',
            company: extractCompany(email.from),
            position: extractHackathonName(email.subject),
            status,
            date: new Date(email.date),
            emailSubject: email.subject
          })
        }
      })
      
      setApplications(analyzedApplications)
      localStorage.setItem(`applications_${userEmail}`, JSON.stringify(analyzedApplications))
      
    } catch (error) {
      console.error('Error analyzing applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    const filterBySearchAndStatus = (apps: Application[]) => {
      return apps.filter(app => {
        const matchesSearch = searchTerm === "" || 
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.emailSubject.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = statusFilter === "all" || app.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
    }

    setFilteredApplications({
      jobs: filterBySearchAndStatus(applications.jobs),
      internships: filterBySearchAndStatus(applications.internships),
      hackathons: filterBySearchAndStatus(applications.hackathons)
    })
  }

  const extractCompany = (from: string): string => {
    const email = from.match(/<(.+)>/)?.[1] || from
    const domain = email.split('@')[1]?.split('.')[0] || 'Unknown'
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  
  const extractPosition = (subject: string): string => {
    const match = subject.match(/(software engineer|developer|analyst|manager|intern|position|role)/i)
    return match ? match[0] : 'Position'
  }
  
  const extractHackathonName = (subject: string): string => {
    const match = subject.match(/(\\w+\\s*hackathon|\\w+\\s*hack|dev\\s*fest)/i)
    return match ? match[0] : 'Hackathon'
  }

  const getTotalApplications = () => {
    return applications.jobs.length + applications.internships.length + applications.hackathons.length
  }

  const getSelectedCount = () => {
    return applications.jobs.filter(j => j.status === 'selected').length + 
           applications.internships.filter(i => i.status === 'selected').length + 
           applications.hackathons.filter(h => h.status === 'selected').length
  }

  const getInterviewCount = () => {
    return applications.jobs.filter(j => j.status === 'interview').length + 
           applications.internships.filter(i => i.status === 'interview').length
  }

  if (!userEmail) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Application Tracker
                </h1>
                <p className="text-gray-400">AI-powered analysis of your applications from Gmail</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={analyzeApplications}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Analyze Applications'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Total Applications</span>
              </div>
              <p className="text-2xl font-bold mt-2">{getTotalApplications()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Selected</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-400">{getSelectedCount()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Interviews</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-400">{getInterviewCount()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-purple-400">
                {getTotalApplications() > 0 ? Math.round((getSelectedCount() / getTotalApplications()) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-600/50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600/50 rounded-md px-3 py-2 text-white"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs */}
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-gray-700/50">
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                Job Applications ({filteredApplications.jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredApplications.jobs.map((job) => (
                  <div key={job.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">{job.position}</h4>
                        <p className="text-sm text-gray-400">{job.company}</p>
                      </div>
                      <Badge className={`text-xs ${
                        job.status === 'selected' ? 'bg-green-600' :
                        job.status === 'interview' ? 'bg-blue-600' :
                        job.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{job.date.toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{job.emailSubject}</p>
                  </div>
                ))}
                {filteredApplications.jobs.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No job applications found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internships */}
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-700/50">
              <CardTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-purple-400" />
                Internships ({filteredApplications.internships.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredApplications.internships.map((internship) => (
                  <div key={internship.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">{internship.position}</h4>
                        <p className="text-sm text-gray-400">{internship.company}</p>
                      </div>
                      <Badge className={`text-xs ${
                        internship.status === 'selected' ? 'bg-green-600' :
                        internship.status === 'interview' ? 'bg-blue-600' :
                        internship.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {internship.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{internship.date.toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{internship.emailSubject}</p>
                  </div>
                ))}
                {filteredApplications.internships.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No internship applications found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hackathons */}
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
            <CardHeader className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-gray-700/50">
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-green-400" />
                Hackathons ({filteredApplications.hackathons.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredApplications.hackathons.map((hackathon) => (
                  <div key={hackathon.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">{hackathon.position}</h4>
                        <p className="text-sm text-gray-400">{hackathon.company}</p>
                      </div>
                      <Badge className={`text-xs ${
                        hackathon.status === 'selected' ? 'bg-green-600' :
                        hackathon.status === 'applied' ? 'bg-gray-600' : 'bg-blue-600'
                      }`}>
                        {hackathon.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{hackathon.date.toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{hackathon.emailSubject}</p>
                  </div>
                ))}
                {filteredApplications.hackathons.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No hackathon applications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}