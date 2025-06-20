
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
  ThumbsUp
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ResumeUpload } from "@/components/resume-upload"
import { CertificateTracker } from "@/components/certificate-tracker"
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
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi ${user?.email?.split('@')[0]}! 👋 I'm your AI Career Assistant. I can help you with career advice, job recommendations, interview prep, and skill development. What would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      // Log activity
      const logActivity = {
        id: Date.now().toString(),
        type: 'login' as const,
        title: 'Logged out',
        description: 'Successfully logged out of your account',
        timestamp: new Date(),
        icon: LogOut,
        color: 'text-gray-400'
      }
      setActivityLogs(prev => [logActivity, ...prev])
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    }

    setAiMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setAiLoading(true)

    // Log AI interaction
    const logActivity = {
      id: Date.now().toString(),
      type: 'ai_interaction' as const,
      title: 'AI Career Assistant',
      description: `Asked: "${newMessage.trim().substring(0, 50)}${newMessage.trim().length > 50 ? '...' : ''}"`,
      timestamp: new Date(),
      icon: Bot,
      color: 'text-purple-400'
    }
    setActivityLogs(prev => [logActivity, ...prev])

    try {
      // Simulate AI response based on user query
      let response = ''
      const query = newMessage.toLowerCase()

      if (query.includes('career') && query.includes('suit')) {
        response = `Based on your current skills and interests in ${user?.profession}, I'd recommend exploring these career paths:

🚀 **Tech Leadership**: With your growing expertise, consider roles like Technical Lead or Engineering Manager
💡 **Product Development**: Your skills could translate well into Product Manager roles
🌐 **Full-Stack Development**: Continue building both frontend and backend expertise
📊 **Data-Driven Roles**: Consider roles that combine tech skills with analytics

Your current career score of ${careerScore} shows strong potential. Focus on completing your React and Node.js learning paths to boost your marketability!`
      } else if (query.includes('job') || query.includes('recommend')) {
        response = `Here are personalized job recommendations based on your profile:

🎯 **Top Matches** (90%+ compatibility):
• Senior Frontend Developer at TechCorp - $85K-$120K
• Full-Stack Engineer at StartupXYZ - $80K-$115K
• React Developer at InnovateLab - $75K-$110K

💼 **Growth Opportunities**:
• Technical Lead positions (average 25% salary increase)
• Remote opportunities (60% more options available)

🔥 **Hot Skills to Add**: TypeScript, AWS, Docker
These could increase your match rate by 15-20%!

Would you like me to help you prepare for applications to any of these roles?`
      } else if (query.includes('interview') || query.includes('prepare')) {
        response = `Great question! Here's your personalized interview prep strategy:

🎯 **Technical Preparation**:
• Practice coding problems on LeetCode (focus on React patterns)
• Review system design basics
• Prepare to explain your projects in detail

💼 **Behavioral Questions**:
• Use the STAR method (Situation, Task, Action, Result)
• Prepare examples of problem-solving and teamwork
• Practice your "tell me about yourself" story

📚 **Company Research**:
• Study the company's tech stack and recent projects
• Prepare thoughtful questions about their engineering culture
• Understand their product and market position

🚀 **Quick Win**: Complete the "Advanced React Patterns" course in your learning path - many interviewers ask about hooks and state management!`
      } else if (query.includes('skill') || query.includes('learn')) {
        response = `Perfect timing! Based on your current progress, here's your personalized learning roadmap:

📈 **Priority Skills** (High Impact):
1. **TypeScript** - 40% of jobs require this
2. **AWS/Cloud Services** - Growing demand (+35% this year)
3. **Testing (Jest/Cypress)** - Shows professional readiness

🎯 **Recommended Learning Path**:
• Complete your current React fundamentals (35% done)
• Start Node.js backend development
• Add database skills (MongoDB/PostgreSQL)

⏰ **Time Investment**: 2-3 hours/week for 12 weeks
🎖️ **Expected Outcome**: +20% salary potential, +40% more job matches

Your current learning streak: 5 days! Keep it up! 🔥`
      } else {
        response = `I'm here to help with your career journey! I can assist with:

🎯 **Career Guidance**:
• "What career path suits me?"
• "How to advance in my field?"
• "Should I switch to a different role?"

💼 **Job Search Support**:
• "Suggest jobs based on my skills"
• "How to improve my resume?"
• "What's my market value?"

📚 **Learning & Skills**:
• "What skills should I learn next?"
• "Recommend courses for my career goals"
• "How to stay competitive?"

🎤 **Interview Preparation**:
• "How to prepare for technical interviews?"
• "Common questions for my role?"
• "How to negotiate salary?"

Just ask me anything about your career development! 🚀`
      }

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setTimeout(() => {
        setAiMessages(prev => [...prev, assistantMessage])
        setAiLoading(false)
      }, 1500)

    } catch (error) {
      setAiLoading(false)
      toast({
        title: "AI Assistant Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleJobApply = (jobId: string) => {
    setJobRecommendations(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, applied: true, appliedAt: new Date().toISOString() }
        : job
    ))

    const job = jobRecommendations.find(j => j.id === jobId)
    if (job) {
      const logActivity = {
        id: Date.now().toString(),
        type: 'job_applied' as const,
        title: 'Job Application',
        description: `Applied to ${job.title} at ${job.company}`,
        timestamp: new Date(),
        icon: Briefcase,
        color: 'text-blue-400'
      }
      setActivityLogs(prev => [logActivity, ...prev])

      toast({
        title: "Application Submitted!",
        description: `Applied to ${job.title} at ${job.company}`,
      })
    }
  }

  const handleContinueLearning = (pathId: string) => {
    setLearningPaths(prev => prev.map(path => {
      if (path.id === pathId) {
        const newProgress = Math.min(path.progress + 10, 100)
        const newStatus = newProgress === 100 ? 'completed' : 'in_progress'
        
        if (newProgress === 100) {
          const logActivity = {
            id: Date.now().toString(),
            type: 'course_completed' as const,
            title: 'Course Completed!',
            description: `Finished ${path.title}`,
            timestamp: new Date(),
            icon: GraduationCap,
            color: 'text-green-400'
          }
          setActivityLogs(prevLogs => [logActivity, ...prevLogs])
        }

        return {
          ...path,
          progress: newProgress,
          status: newStatus,
          lastAccessed: new Date().toISOString()
        }
      }
      return path
    }))

    toast({
      title: "Progress Updated!",
      description: "Keep up the great work!",
    })
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock enhanced data for student platform
        const mockLearningPaths: LearningPath[] = [
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
          },
          {
            id: '2',
            title: 'Data Science Fundamentals',
            description: 'Learn Python, statistics, and machine learning basics',
            progress: 0,
            estimatedTime: '16 weeks',
            difficulty: 'Beginner',
            skills: ['Python', 'Pandas', 'Scikit-learn', 'Statistics'],
            status: 'not_started'
          },
          {
            id: '3',
            title: 'AI/ML Engineering',
            description: 'Deep dive into artificial intelligence and machine learning',
            progress: 100,
            estimatedTime: '20 weeks',
            difficulty: 'Advanced',
            skills: ['Python', 'TensorFlow', 'PyTorch', 'Deep Learning'],
            status: 'completed'
          }
        ]

        const mockJobs: JobRecommendation[] = [
          {
            id: '1',
            title: 'Frontend Developer',
            company: 'TechCorp Inc.',
            location: 'Remote',
            salary: '$70,000 - $90,000',
            match: 92,
            skills: ['React', 'TypeScript', 'CSS'],
            platform: 'LinkedIn',
            type: 'job'
          },
          {
            id: '2',
            title: 'Full-Stack Engineer Intern',
            company: 'StartupXYZ',
            location: 'San Francisco, CA',
            salary: '$4,000/month',
            match: 87,
            skills: ['React', 'Node.js', 'MongoDB'],
            platform: 'AngelList',
            type: 'internship'
          },
          {
            id: '3',
            title: 'Junior Software Developer',
            company: 'InnovateLab',
            location: 'Remote',
            salary: '$60,000 - $75,000',
            match: 89,
            skills: ['JavaScript', 'React', 'Express'],
            platform: 'Indeed',
            type: 'job'
          }
        ]

        const mockActivityLogs: ActivityLog[] = [
          {
            id: '1',
            type: 'course_completed',
            title: 'Course Completed',
            description: 'Finished React Fundamentals module',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            icon: GraduationCap,
            color: 'text-green-400'
          },
          {
            id: '2',
            type: 'job_applied',
            title: 'Job Application',
            description: 'Applied to Frontend Developer at TechCorp',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            icon: Briefcase,
            color: 'text-blue-400'
          },
          {
            id: '3',
            type: 'ai_interaction',
            title: 'AI Career Assistant',
            description: 'Asked about interview preparation tips',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            icon: Bot,
            color: 'text-purple-400'
          }
        ]

        setLearningPaths(mockLearningPaths)
        setJobRecommendations(mockJobs)
        setActivityLogs(mockActivityLogs)
        
        // Calculate average progress
        const avgProgress = Math.round(
          mockLearningPaths.reduce((acc, path) => acc + path.progress, 0) / mockLearningPaths.length
        )
        setAverageProgress(avgProgress)

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
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              🚀 Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-gray-400">
              Ready to level up your skills and land your dream job?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Sheet open={showAIAssistant} onOpenChange={setShowAIAssistant}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-purple-600/20 border-purple-500 hover:bg-purple-600/30">
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] bg-gray-900 border-gray-700">
                <SheetHeader>
                  <SheetTitle className="flex items-center text-green-400">
                    <Bot className="w-5 h-5 mr-2" />
                    AI Career Assistant
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Get personalized career advice, job recommendations, and learning guidance
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-120px)] mt-6">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {aiMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-200 border border-gray-700'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-700">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask about careers, jobs, skills..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-gray-800 border-gray-600"
                      disabled={aiLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={aiLoading || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Learning Paths</p>
                  <p className="text-2xl font-bold text-green-400">{learningPaths.length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Job Matches</p>
                  <p className="text-2xl font-bold text-blue-400">{jobRecommendations.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Avg Progress</p>
                  <p className="text-2xl font-bold text-purple-400">{averageProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-300">Career Score</p>
                  <p className="text-2xl font-bold text-orange-400">{careerScore}</p>
                </div>
                <Star className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border-pink-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-300">AI Interactions</p>
                  <p className="text-2xl font-bold text-pink-400">{aiMessages.length - 1}</p>
                </div>
                <Brain className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-900/50 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="learning" className="data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-purple-600">
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs & Internships
            </TabsTrigger>
            <TabsTrigger value="resume" className="data-[state=active]:bg-orange-600">
              <FileText className="w-4 h-4 mr-2" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-red-600">
              <Trophy className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-600">
              <Zap className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-800/50">
                          <log.icon className={`w-5 h-5 ${log.color}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.title}</p>
                            <p className="text-xs text-gray-400">{log.description}</p>
                            <p className="text-xs text-gray-500">{log.timestamp.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learningPaths.map((path) => (
                      <div key={path.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{path.title}</span>
                          <span className="text-xs text-gray-400">{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          <Badge variant={path.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {path.status.replace('_', ' ')}
                          </Badge>
                          {path.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={() => handleContinueLearning(path.id)}>
                              Continue
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Learning Tab */}
          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="bg-gray-900/50 border-gray-700 hover:border-blue-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{path.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={path.difficulty === 'Beginner' ? 'secondary' : path.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                          {path.difficulty}
                        </Badge>
                        {path.status === 'completed' && (
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-3" />
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {path.estimatedTime}
                      </div>
                      {path.lastAccessed && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(path.lastAccessed).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {path.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {path.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{path.skills.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleContinueLearning(path.id)}
                      disabled={path.status === 'completed'}
                    >
                      {path.progress === 0 ? 'Start Learning' : 
                       path.status === 'completed' ? 'Completed' : 'Continue Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Enhanced Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Jobs & Internships</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {jobRecommendations.filter(j => j.type === 'job').length} Jobs
                </Badge>
                <Badge variant="outline">
                  {jobRecommendations.filter(j => j.type === 'internship').length} Internships
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobRecommendations.map((job) => (
                <Card key={job.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <Badge variant={job.type === 'internship' ? 'secondary' : 'default'}>
                          {job.type}
                        </Badge>
                      </div>
                      <Badge className="bg-green-600">
                        {job.match}% Match
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center space-x-4">
                      <span>{job.company}</span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.location}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-lg font-semibold text-green-400">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.salary}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 flex items-center">
                        Via {job.platform}
                        {job.applied && (
                          <span className="ml-2 text-green-400 flex items-center">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Applied
                          </span>
                        )}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleJobApply(job.id)}
                          disabled={job.applied}
                        >
                          {job.applied ? 'Applied' : 'Apply Now'}
                        </Button>
                      </div>
                    </div>

                    {job.applied && job.appliedAt && (
                      <p className="text-xs text-gray-500">
                        Applied on {new Date(job.appliedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resume Tab */}
          <TabsContent value="resume">
            <ResumeUpload />
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates">
            <CertificateTracker />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  All Activity
                </CardTitle>
                <CardDescription>
                  Complete history of your learning journey and career actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <log.icon className={`w-6 h-6 ${log.color}`} />
                        <div className="flex-1">
                          <p className="font-medium">{log.title}</p>
                          <p className="text-sm text-gray-400">{log.description}</p>
                          <p className="text-xs text-gray-500">{log.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
