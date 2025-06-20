"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  RefreshCw, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Calendar,
  Building,
  MapPin,
  Trophy,
  DollarSign,
  Users,
  Briefcase,
  Code,
  Award,
  Plus,
  FileText,
  Database
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface TrackedApplication {
  id: string
  title: string
  company: string
  platform: string
  type: 'job' | 'internship' | 'hackathon'
  status: 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'selected' | 'pending'
  applied_date: string
  last_updated: string
  application_url: string
  deadline?: string
  location: string
  salary?: string
  prize_money?: string
  description: string
  tags: string[]
  notes?: string
}

export function AppliedApplicationsTracker() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [applications, setApplications] = useState<TrackedApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const statusColors = {
    'applied': 'bg-blue-500',
    'under_review': 'bg-yellow-500',
    'shortlisted': 'bg-green-500',
    'rejected': 'bg-red-500',
    'selected': 'bg-purple-500',
    'pending': 'bg-gray-500'
  }

  const statusIcons = {
    'applied': Clock,
    'under_review': AlertCircle,
    'shortlisted': CheckCircle,
    'rejected': XCircle,
    'selected': Trophy,
    'pending': Clock
  }

  const typeIcons = {
    'job': Briefcase,
    'internship': Users,
    'hackathon': Code
  }

  useEffect(() => {
    if (user) {
      fetchTrackedApplications()
    }
  }, [user])

  const fetchTrackedApplications = async () => {
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
        setApplications(data.applications || [])
      } else {
        // Show sample data if no applications found
        setApplications(getSampleApplications())
        toast({
          title: "Sample Data",
          description: "Showing sample applications. Add your Unstop profile to sync real data.",
        })
      }
    } catch (error) {
      console.error('Error fetching tracked applications:', error)
      setApplications(getSampleApplications())
      toast({
        title: "Demo Mode",
        description: "Showing sample data. Connect your profiles to see real applications.",
      })
    } finally {
      setLoading(false)
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
        setApplications(data.applications || [])
        toast({
          title: "Sync Complete",
          description: `Found ${data.applications?.length || 0} applications from connected platforms.`,
        })
      } else {
        toast({
          title: "Sync Failed",
          description: "Please connect your Unstop profile to sync applications.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error syncing applications:', error)
      toast({
        title: "Sync Error",
        description: "Failed to sync applications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  const getSampleApplications = (): TrackedApplication[] => {
    return [
      {
        id: "sample_1",
        title: "Frontend Developer Internship",
        company: "Zomato",
        platform: "Unstop",
        type: "internship",
        status: "under_review",
        applied_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        application_url: "https://unstop.com/internships/frontend-developer",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Bangalore, Remote",
        salary: "₹25,000/month",
        description: "Build responsive web applications using React.js and modern frontend technologies.",
        tags: ["React", "JavaScript", "Frontend", "Remote"],
        notes: "Completed coding round, waiting for interview"
      },
      {
        id: "sample_2",
        title: "Smart India Hackathon 2024",
        company: "Ministry of Education",
        platform: "Unstop",
        type: "hackathon",
        status: "applied",
        applied_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        application_url: "https://unstop.com/hackathons/smart-india-hackathon",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Pan India",
        prize_money: "₹1,00,000",
        description: "National level hackathon to solve real-world problems faced by ministries.",
        tags: ["Government", "Innovation", "Social Impact"],
        notes: "Team formation in progress"
      },
      {
        id: "sample_3",
        title: "Data Scientist",
        company: "Paytm",
        platform: "LinkedIn",
        type: "job",
        status: "shortlisted",
        applied_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        application_url: "https://linkedin.com/jobs/view/12345",
        location: "Bangalore, Hybrid",
        salary: "₹8-15 LPA",
        description: "Analyze user behavior and business metrics to drive data-driven decisions.",
        tags: ["Data Science", "Python", "Machine Learning", "Fintech"],
        notes: "Technical interview scheduled for next week"
      },
      {
        id: "sample_4",
        title: "EthIndia 2024",
        company: "Ethereum India",
        platform: "Devfolio",
        type: "hackathon",
        status: "selected",
        applied_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        application_url: "https://devfolio.co/hackathons/ethindia",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Bangalore, On-site",
        prize_money: "$50,000",
        description: "Build innovative solutions on Ethereum blockchain with global developers.",
        tags: ["Blockchain", "Ethereum", "Web3", "DeFi"],
        notes: "Selected for final round! Excited to participate."
      },
      {
        id: "sample_5",
        title: "Mobile App Development Internship",
        company: "BYJU'S",
        platform: "Internshala",
        type: "internship",
        status: "rejected",
        applied_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        application_url: "https://internshala.com/internship/detail/mobile-app",
        location: "Bangalore, On-site",
        salary: "₹20,000/month",
        description: "Develop mobile applications for educational platform using React Native.",
        tags: ["React Native", "Mobile", "Education"],
        notes: "Received feedback to improve React Native skills"
      }
    ]
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === '' || app.status === statusFilter
    const matchesType = typeFilter === '' || app.type === typeFilter
    const matchesPlatform = platformFilter === '' || app.platform === platformFilter

    return matchesSearch && matchesStatus && matchesType && matchesPlatform
  })

  const getApplicationsByTab = () => {
    switch (activeTab) {
      case 'active':
        return filteredApplications.filter(app => 
          ['applied', 'under_review', 'shortlisted'].includes(app.status)
        )
      case 'completed':
        return filteredApplications.filter(app => 
          ['selected', 'rejected'].includes(app.status)
        )
      case 'upcoming':
        return filteredApplications.filter(app => {
          if (!app.deadline) return false
          const deadline = new Date(app.deadline)
          const now = new Date()
          const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          return daysUntilDeadline > 0 && daysUntilDeadline <= 7
        })
      default:
        return filteredApplications
    }
  }

  const getStatusMessage = () => {
    const stats = {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      selected: applications.filter(app => app.status === 'selected').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    }

    return `${stats.total} total applications • ${stats.under_review + stats.shortlisted} active • ${stats.selected} selected`
  }

  const ApplicationCard = ({ application }: { application: TrackedApplication }) => {
    const StatusIcon = statusIcons[application.status]
    const TypeIcon = typeIcons[application.type]
    const daysAgo = Math.floor((Date.now() - new Date(application.applied_date).getTime()) / (1000 * 60 * 60 * 24))

    const deadlineDays = application.deadline ? 
      Math.ceil((new Date(application.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    return (
      <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-500 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <TypeIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{application.title}</CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-1">
                  <Building className="w-3 h-3" />
                  <span>{application.company}</span>
                  <Badge variant="outline" className="text-xs">{application.platform}</Badge>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${statusColors[application.status]} text-white text-xs`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {application.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300 line-clamp-2">{application.description}</p>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-400">
              <MapPin className="w-3 h-3 mr-1" />
              {application.location}
            </div>
            <div className="flex items-center text-gray-400">
              <Calendar className="w-3 h-3 mr-1" />
              Applied {daysAgo} days ago
            </div>
            {application.salary && (
              <div className="flex items-center text-green-400">
                <DollarSign className="w-3 h-3 mr-1" />
                {application.salary}
              </div>
            )}
            {application.prize_money && (
              <div className="flex items-center text-yellow-400">
                <Trophy className="w-3 h-3 mr-1" />
                {application.prize_money}
              </div>
            )}
          </div>

          {/* Deadline warning */}
          {deadlineDays && deadlineDays <= 7 && deadlineDays > 0 && (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 flex items-center">
              <AlertCircle className="w-4 h-4 text-orange-400 mr-2" />
              <span className="text-sm text-orange-300">
                Deadline in {deadlineDays} day{deadlineDays > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {application.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {application.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{application.tags.length - 4}
              </Badge>
            )}
          </div>

          {/* Notes */}
          {application.notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-sm text-blue-300">{application.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(application.application_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Application
            </Button>

            <Select 
              value={application.status}
              onValueChange={(value) => {
                // Update status logic would go here
                toast({
                  title: "Status Updated",
                  description: `Application status changed to ${value.replace('_', ' ')}`,
                })
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
          <p className="text-gray-400">Loading your applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-purple-400 flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            Applied Applications
          </h2>
          <p className="text-gray-400 mt-2">{getStatusMessage()}</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={syncApplications}
            disabled={syncing}
            className="flex items-center"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync Applications'}
          </Button>

          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Platform
          </Button>
        </div>
      </div>

      {/* Filters */}
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
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

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Platforms</SelectItem>
                <SelectItem value="Unstop">Unstop</SelectItem>
                <SelectItem value="Internshala">Internshala</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Devfolio">Devfolio</SelectItem>
                <SelectItem value="Dare2Compete">Dare2Compete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
            All ({filteredApplications.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">
            Active ({getApplicationsByTab().length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-orange-600">
            Deadlines ({getApplicationsByTab().length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-gray-600">
            Completed ({getApplicationsByTab().length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getApplicationsByTab().map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>

          {getApplicationsByTab().length === 0 && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                <p className="text-gray-400 mb-4">Connect your platform profiles to automatically track your applications</p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Platform
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}