"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Briefcase,
  Users,
  MessageSquare,
  LogOut,
  Bot,
  Send,
  GraduationCap,
  Zap,
  Trophy,
  Activity,
  MapPin,
  DollarSign,
  Brain,
  FileText,
  ThumbsUp,
  Plus
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { RealTimeApplicationTracker } from "@/components/real-time-application-tracker"
import { GmailAuthStatus } from "@/components/gmail-auth-status"
import { GmailRealtimeViewer } from "@/components/gmail-realtime-viewer"
import { SmartSearch } from "@/components/smart-search"
import { ResumeUpload } from "@/components/resume-upload"
import { CertificateTracker } from "@/components/certificate-tracker"
import { AppliedApplicationsTracker } from "@/components/applied-applications-tracker"
import { UserProfileDisplay } from "@/components/user-profile-display"
import { useToast } from "@/hooks/use-toast"

interface LearningPath {
  id: string
  title: string
  description: string
  progress: number
  estimatedTime: string
  difficulty: string
  skills: string[]
  status: 'not_started' | 'in_progress' | 'completed'
  lastAccessed?: string
}

interface JobRecommendation {
  id: string
  title: string
  company: string
  location: string
  salary: string
  match: number
  skills: string[]
  platform: string
  type: 'job' | 'internship'
  applied?: boolean
  appliedAt?: string
}

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ActivityLog {
  id: string
  type: 'course_completed' | 'job_applied' | 'certificate_earned' | 'ai_interaction' | 'login'
  title: string
  description: string
  timestamp: Date
  icon: any
  color: string
}

export function IndividualDashboard() {
  const { user, logout } = useAuth()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [careerScore, setCareerScore] = useState(85)
  const [averageProgress, setAverageProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fallback to mock data
        const fallbackPaths: LearningPath[] = [
          {
            id: '1',
            title: 'Full-Stack Web Development',
            description: 'Master React, Node.js, and modern web technologies',
            progress: 35,
            estimatedTime: '12 weeks',
            difficulty: 'Intermediate',
            skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
            status: 'in_progress',
            lastAccessed: '2024-01-20T10:30:00Z'
          }
        ]
        setLearningPaths(fallbackPaths)
        setAverageProgress(35)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your learning journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 space-y-4 lg:space-y-0">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Welcome, {localStorage.getItem('user_username') || user?.email?.split('@')[0] || 'User'}! 🚀
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">Continue your learning journey with SkillSpring AI</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <UserProfileDisplay 
              size="md" 
              className="w-full sm:w-auto min-w-[200px]" 
            />
            <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="learn">Learn & Upskill</TabsTrigger>
            <TabsTrigger value="jobs">Get Hired</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="gmail">Gmail Data</TabsTrigger>
            <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Your activity will appear here</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <GmailAuthStatus />
            <RealTimeApplicationTracker />
          </TabsContent>

          <TabsContent value="gmail" className="space-y-6">
            <GmailRealtimeViewer />
          </TabsContent>

          <TabsContent value="ai-chat" className="space-y-6">
            <SmartSearch />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Profile settings will be available here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}