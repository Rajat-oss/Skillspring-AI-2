"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Sparkles, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">SkillSpring Launchpad</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-green-600 hover:bg-green-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-purple-600/20 text-purple-300 border-purple-600/30">
            AI-Powered Growth Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            From Skill to Success
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-Powered Growth for Everyone. Join the ecosystem where individuals upskill and grow their careers.
          </p>

          {/* Individual Role Card */}
          <Card className="max-w-md mx-auto border-2 border-green-500 ai-glow bg-green-950/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">I'm an Individual</CardTitle>
              <CardDescription className="text-gray-400">
                Student, Freelancer, Job Seeker, or Professional looking to upskill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-green-500" /> Personalized Learning Paths
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 mr-2 inline-block text-green-500">★</span> AI Career Guidance
                </li>
                <li className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" /> Job Matching & Placement
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Powered by Advanced AI</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-green-400">
                  <Sparkles className="w-6 h-6 mr-2" />
                  LearnBuddyGPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  AI mentor that creates personalized learning roadmaps with curated resources and project suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-400">
                  <Target className="w-6 h-6 mr-2" />
                  CareerPathGPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Scans job markets in real-time and prepares job readiness profiles with resume optimization.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-400">
                  <span className="w-6 h-6 mr-2 inline-block text-purple-400">★</span>
                  HireScanGPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Helps startups discover talent, filter candidates, and manage the entire hiring process intelligently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Our Vision</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl font-bold text-green-400 mb-2">10M+</div>
              <p className="text-gray-300">People Upskilled</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-400 mb-2">1M+</div>
              <p className="text-gray-300">Micro-Startups Enabled</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-2">1B+</div>
              <p className="text-gray-300">Next Generation Builders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; 2024 SkillSpring Launchpad. Empowering the next billion learners and builders.</p>
        </div>
      </footer>
    </div>
  )
}