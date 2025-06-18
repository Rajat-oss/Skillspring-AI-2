"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import {
  Briefcase,
  Target,
  TrendingUp,
  Filter,
  Send,
  Eye,
  MessageSquare,
  Sparkles,
  Rocket,
  Brain,
  Zap,
} from "lucide-react"
import { AIService } from "@/lib/ai-service"

interface Candidate {
  id: string
  name: string
  title: string
  skills: string[]
  experience: string
  location: string
  match: number
  avatar: string
  status: "available" | "busy" | "interviewing"
}

interface JobPosting {
  id: string
  title: string
  department: string
  type: "Full-time" | "Part-time" | "Contract"
  applicants: number
  status: "active" | "paused" | "closed"
  postedDate: string
}

export function StartupDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [aiInsights, setAiInsights] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const fetchCandidates = async () => {
    // Placeholder for real API call to fetch candidates
    // Return empty array for now
    return []
  }

  const fetchJobPostings = async () => {
    // Placeholder for real API call to fetch job postings
    // Return empty array for now
    return []
  }

  const fetchAiInsights = async () => {
    // Placeholder for real API call to fetch AI startup insights
    // Return empty string for now
    return ""
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch real-time data (currently placeholders)
      const candidatesData = await fetchCandidates()
      const jobPostingsData = await fetchJobPostings()
      const aiInsightsData = await fetchAiInsights()

      setCandidates(candidatesData)
      setJobPostings(jobPostingsData)
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Startup Dashboard</h1>
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
            <TabsTrigger value="talent">Talent Discovery</TabsTrigger>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Insights */}
            <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-400">
                  <Brain className="w-6 h-6 mr-2" />
                  StartMateGPT Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{aiInsights || "No insights available yet."}</p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{candidates.length}</div>
                  <p className="text-sm text-gray-400">Matched Candidates</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{jobPostings.length}</div>
                  <p className="text-sm text-gray-400">Active Jobs</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <p className="text-sm text-gray-400">Total Applicants</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">0</div>
                  <p className="text-sm text-gray-400">Interviews Scheduled</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="talent" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Talent Discovery</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Zap className="w-4 h-4 mr-2" />
                  AI Match
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {candidates.length === 0 ? (
                <p className="text-gray-400">No candidates available yet.</p>
              ) : (
                candidates.map((candidate) => (
                  <Card key={candidate.id} className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img
                            src={candidate.avatar || "/placeholder.svg"}
                            alt={candidate.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="text-lg font-semibold">{candidate.name}</h3>
                            <p className="text-gray-400">{candidate.title}</p>
                            <p className="text-sm text-gray-500">
                              {candidate.location} • {candidate.experience}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-purple-600 mb-2">{candidate.match}% Match</Badge>
                          <div className="flex items-center space-x-1">
                            <div
                            className={`w-2 h-2 rounded-full ${
                              candidate.status === "available"
                                ? "bg-green-500"
                                : candidate.status === "busy"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                            }`}
                            ></div>
                            <span className="text-xs text-gray-400 capitalize">{candidate.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {candidate.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Send className="w-4 h-4 mr-2" />
                          Send Interview Request
                        </Button>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        <Button variant="outline">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Job Postings</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Briefcase className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            </div>

            <div className="grid gap-6">
              {jobPostings.length === 0 ? (
                <p className="text-gray-400">No job postings available yet.</p>
              ) : (
                jobPostings.map((job) => (
                  <Card key={job.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <CardDescription>
                            {job.department} • {job.type}
                          </CardDescription>
                        </div>
                        <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <span>{job.applicants} applicants</span>
                          <span>Posted {job.postedDate}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <h2 className="text-2xl font-bold">AI Business Tools</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400">
                    <Sparkles className="w-6 h-6 mr-2" />
                    Business Model Generator
                  </CardTitle>
                  <CardDescription>AI-powered business model canvas creation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Generate Business Model</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400 mr-2" />
                  MVP Scaffolding
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Build MVP Plan</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-400 mr-2" />
                  GTM Strategy
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Create GTM Strategy</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-400 mr-2" />
                  Market Analysis
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">Analyze Market</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
