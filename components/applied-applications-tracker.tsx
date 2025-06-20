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
  RotateCcw
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Plus } from 'lucide-react'

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
  const [showAddDialog, setShowAddDialog] = useState(false) // State for add dialog
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
    }
  }, [user])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      // Mock applications data - in real implementation, this would fetch from backend
      const mockApplications: Application[] = [
        {
          id: '1',
          title: 'Software Development Intern',
          company: 'TechCorp',
          platform: 'unstop',
          type: 'internship',
          status: 'applied',
          applied_date: '2024-01-15T10:00:00Z',
          last_updated: '2024-01-15T10:00:00Z',
          email_subject: 'Application Confirmation - Software Development Intern',
          location: 'Bangalore, India',
          salary: '₹15,000/month',
          deadline: '2024-01-30T23:59:59Z',
          description: 'Work on cutting-edge web applications using React and Node.js',
          application_url: 'https://unstop.com/internship/123'
        },
        {
          id: '2',
          title: 'AI/ML Hackathon 2024',
          company: 'Unstop',
          platform: 'unstop',
          type: 'hackathon',
          status: 'shortlisted',
          applied_date: '2024-01-10T14:30:00Z',
          last_updated: '2024-01-20T09:15:00Z',
          email_subject: 'Congratulations! You have been shortlisted',
          location: 'Online',
          deadline: '2024-02-15T23:59:59Z',
          description: 'Build innovative AI solutions for real-world problems',
          application_url: 'https://unstop.com/hackathon/456'
        },
        {
          id: '3',
          title: 'Frontend Developer',
          company: 'StartupXYZ',
          platform: 'internshala',
          type: 'job',
          status: 'interview_scheduled',
          applied_date: '2024-01-05T16:20:00Z',
          last_updated: '2024-01-25T11:30:00Z',
          email_subject: 'Interview Scheduled - Frontend Developer Position',
          location: 'Remote',
          salary: '₹6,00,000/year',
          description: 'Create responsive web interfaces using modern frameworks',
          application_url: 'https://internshala.com/job/789'
        }
      ]

      // Calculate stats
      const mockStats: ApplicationStats = {
        total: mockApplications.length,
        applied: mockApplications.filter(app => app.status === 'applied').length,
        selected: mockApplications.filter(app => app.status === 'selected').length,
        rejected: mockApplications.filter(app => app.status === 'rejected').length,
        pending: mockApplications.filter(app => ['applied', 'pending', 'shortlisted', 'interview_scheduled'].includes(app.status)).length,
        response_rate: Math.round((mockApplications.filter(app => ['selected', 'rejected', 'shortlisted', 'interview_scheduled'].includes(app.status)).length / mockApplications.length) * 100)
      }

      setApplications(mockApplications)
      setStats(mockStats)

      toast({
        title: "Applications Loaded",
        description: `Found ${mockApplications.length} applications from your profiles`,
      })
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

  const syncApplications = async () => {
    setSyncing(true)
    try {
      // Simulate syncing from platforms like Unstop
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "Sync Complete",
        description: "Refreshed applications from your linked profiles.",
      })

      fetchApplications()
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

  const addUnstopProfile = () => {
    toast({
      title: "Coming Soon",
      description: "Unstop profile integration will be available soon. For now, manually add your applications.",
    })
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

  // Add Application Dialog
  const AddApplicationDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Application</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
          <DialogDescription>
            Fill in the details of the application to track it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right">
              Title
            </label>
            <Input id="title" value="" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="company" className="text-right">
              Company
            </label>
            <Input id="company" value="" className="col-span-3" />
          </div>
          {/* Add more fields as necessary */}
        </div>
        {/*<DialogFooter>
          <Button type="submit">Add Application</Button>
        </DialogFooter>*/}
      </DialogContent>
    </Dialog>
  );

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
          <Button onClick={addUnstopProfile} variant="outline">
            <Building className="w-4 h-4 mr-2" />
            Add Unstop Profile
          </Button>
          <Button 
            onClick={syncApplications} 
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync Applications'}
          </Button>
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

            <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="hackathon">Hackathons</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPlatform || "all"} onValueChange={(value) => setSelectedPlatform(value === "all" ? "" : value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold">Applied Applications</h2>
          <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
            <p className="text-gray-400 mb-4">
              Add your Unstop profile or sync manually to track your applications automatically
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={addUnstopProfile} variant="outline">
                <Building className="w-4 h-4 mr-2" />
                Add Unstop Profile
              </Button>
              <Button onClick={syncApplications} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Sync Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <AddApplicationDialog />
    </div>
  )
}