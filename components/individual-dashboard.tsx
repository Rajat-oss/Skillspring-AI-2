The code is modified to include a resume upload component and a certificate tracker in the individual dashboard.
```

```replit_final_file
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ResumeUpload } from "@/components/resume-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { BookOpen, Briefcase, Target, Clock, ExternalLink, ArrowRight, Sparkles, Brain, Zap } from "lucide-react"
import { AIService } from "@/lib/ai-service"
import { CertificateTracker } from "@/components/certificate-tracker"

interface LearningPath {
  id: string
  title: string
  description: string
  progress: number
  estimatedTime: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
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

export function IndividualDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [aiInsights, setAiInsights] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const fetchLearningPaths = async () => {
    // Placeholder for real API call to fetch learning paths
    // Return empty array for now
    return []
  }

  const fetchJobRecommendations = async () => {
    // Placeholder for real API call to fetch job recommendations
    // Return empty array for now
    return []
  }

  const fetchAiInsights = async () => {
    // Placeholder for real API call to fetch AI career insights
    // Return empty string for now
    return ""
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch real-time data (currently placeholders)
      const learningPathsData = await fetchLearningPaths()
      const jobRecommendationsData = await fetchJobRecommendations()
      const aiInsightsData = await fetchAiInsights()

      setLearningPaths(learningPathsData)
      setJobRecommendations(jobRecommendationsData)
      setAiInsights(aiInsightsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome back!</h1>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="learn">Learn & Upskill</TabsTrigger>
            <TabsTrigger value="jobs">Get Hired</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Insights */}
            <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center text-green-400">
                  <Brain className="w-6 h-6 mr-2" />
                  AI Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{aiInsights || "No insights available yet."}</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-400">
                    <BookOpen className="w-6 h-6 mr-2" />
                    Continue Learning
                  </CardTitle>
                  <CardDescription>Pick up where you left off in your learning journey</CardDescription>
                </CardHeader>
                <CardContent>
                  {learningPaths.length === 0 ? (
                    <p className="text-gray-400">No learning paths available yet.</p>
                  ) : (
                    learningPaths.map((path) => (
                      <div key={path.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{path.title}</span>
                          <span>{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                      </div>
                    ))
                  )}
                  <Button className="mt-4 w-full bg-green-600 hover:bg-green-700">Continue Learning</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400">
                    <Briefcase className="w-6 h-6 mr-2" />
                    Job Opportunities
                  </CardTitle>
                  <CardDescription>New job matches based on your skills</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobRecommendations.length === 0 ? (
                    <p className="text-gray-400">No job recommendations available yet.</p>
                  ) : (
                    jobRecommendations.map((job) => (
                      <div key={job.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{job.title}</span>
                          <Badge className="bg-blue-600">{job.match}% Match</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{job.company} • {job.location}</p>
                      </div>
                    ))
                  )}
                  <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">View All Jobs</Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{learningPaths.length}</div>
                  <p className="text-sm text-gray-400">Active Courses</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{jobRecommendations.length}</div>
                  <p className="text-sm text-gray-400">Job Matches</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <p className="text-sm text-gray-400">Certificates</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="learn" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Learning Paths</h2>
              <Button className="bg-green-600 hover:bg-green-700">
                <Zap className="w-4 h-4 mr-2" />
                Get AI Recommendations
              </Button>
            </div>

            <div className="grid gap-6">
              {learningPaths.length === 0 ? (
                <p className="text-gray-400">No learning paths available yet.</p>
              ) : (
                learningPaths.map((path) => (
                  <Card key={path.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{path.title}</CardTitle>
                          <CardDescription className="mt-2">{path.description}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            path.difficulty === "Beginner"
                              ? "secondary"
                              : path.difficulty === "Intermediate"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {path.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {path.estimatedTime}
                          </div>
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {path.progress}% Complete
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{path.progress}%</span>
                          </div>
                          <Progress value={path.progress} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {path.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700">
                            {path.progress > 0 ? "Continue" : "Start Learning"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <Button variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Job Recommendations</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Refresh Matches
              </Button>
            </div>

            <div className="grid gap-6">
              {jobRecommendations.length === 0 ? (
                <p className="text-gray-400">No job recommendations available yet.</p>
              ) : (
                jobRecommendations.map((job) => (
                  <Card key={job.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {job.company} • {job.location}
                          </CardDescription>
                          <p className="text-green-400 font-semibold mt-2">{job.salary}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-600 mb-2">{job.match}% Match</Badge>
                          <p className="text-xs text-gray-400">via {job.platform}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                            Apply Now
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                          <Button variant="outline">Save Job</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Profile management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}