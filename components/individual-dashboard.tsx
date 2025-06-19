
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  MessageSquare
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ResumeUpload } from "@/components/resume-upload"
import { CertificateTracker } from "@/components/certificate-tracker"

interface LearningPath {
  id: string
  title: string
  description: string
  progress: number
  estimatedTime: string
  difficulty: string
  skills: string[]
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
}

interface CareerInsight {
  trend: string
  impact: string
  recommendation: string
}

export function IndividualDashboard() {
  const { user } = useAuth()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [careerInsights, setCareerInsights] = useState<CareerInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch learning paths
        const pathsResponse = await fetch('/api/learning/paths', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (pathsResponse.ok) {
          const pathsData = await pathsResponse.json()
          setLearningPaths(pathsData.paths)
        }

        // Fetch job recommendations
        const jobsResponse = await fetch('/api/jobs/recommendations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setJobRecommendations(jobsData.jobs)
        }

        // Fetch career insights
        const insightsResponse = await fetch('/api/ai/career-insights', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          setCareerInsights(insightsData.insights)
        }

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
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400">
            Continue your learning journey and discover new opportunities
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900/50 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="learning" className="data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-purple-600">
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="resume" className="data-[state=active]:bg-orange-600">
              <Award className="w-4 h-4 mr-2" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-red-600">
              <Target className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Learning Paths</p>
                      <p className="text-2xl font-bold text-green-400">{learningPaths.length}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Job Matches</p>
                      <p className="text-2xl font-bold text-blue-400">{jobRecommendations.length}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Avg Progress</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {Math.round(learningPaths.reduce((acc, path) => acc + path.progress, 0) / learningPaths.length || 0)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Career Score</p>
                      <p className="text-2xl font-bold text-orange-400">85</p>
                    </div>
                    <Star className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm">Completed React Fundamentals module</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm">New job recommendation: Frontend Developer at TechCorp</p>
                      <p className="text-xs text-gray-400">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm">Started Data Science Fundamentals</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{path.title}</CardTitle>
                      <Badge variant={path.difficulty === 'Beginner' ? 'secondary' : path.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                        {path.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {path.estimatedTime}
                      </div>
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

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      {path.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobRecommendations.map((job) => (
                <Card key={job.id} className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge className="bg-green-600">
                        {job.match}% Match
                      </Badge>
                    </div>
                    <CardDescription>
                      {job.company} • {job.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-lg font-semibold text-green-400">
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
                      <span className="text-sm text-gray-400">
                        Via {job.platform}
                      </span>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        View Details
                      </Button>
                    </div>
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
        </Tabs>
      </div>
    </div>
  )
}
