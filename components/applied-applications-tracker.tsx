
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  Mail,
  Building,
  Trophy,
  Briefcase,
  Users,
  MapPin,
  Sync
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface Application {
  id: string
  title: string
  company: string
  platform: string
  type: 'job' | 'internship' | 'hackathon'
  status: 'applied' | 'selected' | 'rejected' | 'pending' | 'shortlisted' | 'interview_scheduled'
  applied_date: string
  last_updated: string
  email_subject: string
  location?: string
  salary?: string
  deadline?: string
  description?: string
  application_url?: string
}

interface ApplicationStats {
  total: number
  applied: number
  selected: number
  rejected: number
  pending: number
  response_rate: number
}

export function AppliedApplicationsTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
    response_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [gmailConnected, setGmailConnected] = useState(false)

  const statusColors = {
    'applied': 'bg-blue-500',
    'selected': 'bg-green-500',
    'rejected': 'bg-red-500',
    'pending': 'bg-yellow-500',
    'shortlisted': 'bg-purple-500',
    'interview_scheduled': 'bg-indigo-500'
  }

  const typeIcons = {
    'job': Briefcase,
    'internship': Users,
    'hackathon': Trophy
  }

  const platformLogos = {
    'unstop': '/platforms/unstop.png',
    'internshala': '/platforms/internshala.png',
    'devfolio': '/platforms/devfolio.png',
    'dare2compete': '/platforms/dare2compete.png',
    'linkedin': '/platforms/linkedin.png',
    'naukri': '/platforms/naukri.png'
  }

  useEffect(() => {
    if (user) {
      fetchApplications()
      checkGmailConnection()
    }
  }, [user])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/applications/tracked', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const checkGmailConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/gmail/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGmailConnected(data.connected)
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error)
    }
  }

  const connectGmail = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/gmail/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.auth_url, '_blank')
        
        toast({
          title: "Gmail Authorization",
          description: "Please complete the authorization in the new window.",
        })
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      toast({
        title: "Error",
        description: "Failed to connect Gmail. Please try again.",
        variant: "destructive"
      })
    }
  }

  const syncApplications = async () => {
    setSyncing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/applications/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sync Complete",
          description: `Found ${data.new_applications} new applications.`,
        })
        
        fetchApplications()
      }
    } catch (error) {
      console.error('Error syncing applications:', error)
      toast({
        title: "Error",
        description: "Failed to sync applications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.platform.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === '' || app.type === selectedType
    const matchesStatus = selectedStatus === '' || app.status === selectedStatus
    const matchesPlatform = selectedPlatform === '' || app.platform === selectedPlatform

    return matchesSearch && matchesType && matchesStatus && matchesPlatform
  })

  const ApplicationCard = ({ application }: { application: Application }) => {
    const TypeIcon = typeIcons[application.type] || Briefcase
    const statusColor = statusColors[application.status] || 'bg-gray-500'

    return (
      <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-500 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <TypeIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight">{application.title}</CardTitle>
                <CardDescription className="text-sm mt-1 flex items-center">
                  <Building className="w-3 h-3 mr-1" />
                  {application.company} • {application.platform}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${statusColor} text-white text-xs capitalize`}>
                {application.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {application.type}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {application.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{application.description}</p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Applied: {new Date(application.applied_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Updated: {new Date(application.last_updated).toLocaleDateString()}
            </div>
            {application.location && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {application.location}
              </div>
            )}
            {application.deadline && (
              <div className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Deadline: {new Date(application.deadline).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            {application.application_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(application.application_url, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Application
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              title="Email Subject"
            >
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-400 flex items-center">
            <Briefcase className="w-8 h-8 mr-3" />
            Applied Applications
          </h2>
          <p className="text-gray-400 mt-2">
            Track all your job, internship, and hackathon applications automatically
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!gmailConnected ? (
            <Button onClick={connectGmail} className="bg-red-600 hover:bg-red-700">
              <Mail className="w-4 h-4 mr-2" />
              Connect Gmail
            </Button>
          ) : (
            <Button 
              onClick={syncApplications} 
              disabled={syncing}
              variant="outline"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sync className="w-4 h-4 mr-2" />
              )}
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Applied</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Selected</p>
                <p className="text-2xl font-bold text-green-400">{stats.selected}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Response Rate</p>
                <p className="text-2xl font-bold text-purple-400">{stats.response_rate}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center">
                <span className="text-purple-400 font-bold text-sm">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600"
                />
              </div>
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="hackathon">Hackathons</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Platforms</SelectItem>
                <SelectItem value="unstop">Unstop</SelectItem>
                <SelectItem value="internshala">Internshala</SelectItem>
                <SelectItem value="devfolio">Devfolio</SelectItem>
                <SelectItem value="dare2compete">Dare2Compete</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="naukri">Naukri</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="text-center py-12">
            {!gmailConnected ? (
              <>
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Gmail to Get Started</h3>
                <p className="text-gray-400 mb-4">
                  Connect your Gmail account to automatically track applications from your email
                </p>
                <Button onClick={connectGmail} className="bg-red-600 hover:bg-red-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail
                </Button>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                <p className="text-gray-400">Try adjusting your search or sync your emails</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
