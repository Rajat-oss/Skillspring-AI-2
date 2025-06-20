
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  GraduationCap, 
  Briefcase, 
  Star, 
  TrendingUp, 
  Users, 
  Zap,
  BookOpen,
  Target,
  Award,
  Brain,
  Rocket,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export function LandingPage() {
  const router = useRouter()
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const features = [
    {
      id: "learning",
      icon: BookOpen,
      title: "Smart Learning Paths",
      description: "AI-curated courses tailored to your career goals",
      color: "text-blue-400",
      bgColor: "bg-blue-900/20"
    },
    {
      id: "jobs",
      icon: Briefcase,
      title: "Job Recommendations",
      description: "Real-time job matching based on your skills",
      color: "text-purple-400",
      bgColor: "bg-purple-900/20"
    },
    {
      id: "ai",
      icon: Brain,
      title: "AI Career Assistant",
      description: "24/7 career guidance powered by AI",
      color: "text-green-400",
      bgColor: "bg-green-900/20"
    },
    {
      id: "progress",
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your growth with detailed analytics",
      color: "text-orange-400",
      bgColor: "bg-orange-900/20"
    }
  ]

  const stats = [
    { label: "Students Empowered", value: "10,000+", icon: Users },
    { label: "Course Completions", value: "50,000+", icon: GraduationCap },
    { label: "Job Placements", value: "2,500+", icon: Briefcase },
    { label: "Career Score Avg", value: "85%", icon: Star }
  ]

  const successStories = [
    {
      name: "Sarah Chen",
      role: "Frontend Developer",
      company: "TechCorp",
      story: "From zero coding experience to landing my dream job in 6 months!",
      avatar: "🧑‍💻"
    },
    {
      name: "Alex Rodriguez",
      role: "Data Scientist",
      company: "DataInc",
      story: "The AI assistant helped me pivot from marketing to data science.",
      avatar: "👩‍💼"
    },
    {
      name: "Mike Johnson",
      role: "Full-Stack Engineer",
      company: "StartupXYZ",
      story: "Got 3 job offers after completing the learning paths here!",
      avatar: "👨‍🔬"
    }
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
              🚀 Welcome to Your Future
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Start Your Learning Journey
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Transform your career with AI-powered learning, personalized job recommendations, 
              and expert guidance. Your dream job is just a learning path away.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => router.push('/auth/signup')}
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Begin Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              onClick={() => router.push('/auth/login')}
              variant="outline" 
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg rounded-xl"
            >
              Continue Learning
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700 text-center">
              <CardContent className="p-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our AI-powered platform provides personalized learning experiences designed to fast-track your career growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.id}
                className={`bg-gray-900/50 border-gray-700 hover:border-green-500 transition-all duration-300 cursor-pointer ${
                  hoveredFeature === feature.id ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Learning Path Preview */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Popular Learning Paths
            </h2>
            <p className="text-gray-400 text-lg">
              Choose from industry-validated learning paths designed by experts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Full-Stack Web Development",
                duration: "12 weeks",
                difficulty: "Intermediate",
                skills: ["React", "Node.js", "MongoDB", "TypeScript"],
                students: "2,400+",
                rating: 4.9
              },
              {
                title: "Data Science & AI",
                duration: "16 weeks",
                difficulty: "Advanced",
                skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
                students: "1,800+",
                rating: 4.8
              },
              {
                title: "Mobile App Development",
                duration: "10 weeks",
                difficulty: "Beginner",
                skills: ["React Native", "Flutter", "iOS", "Android"],
                students: "1,200+",
                rating: 4.7
              }
            ].map((path, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-blue-500 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <Badge variant={path.difficulty === 'Beginner' ? 'secondary' : path.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                      {path.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>⏱️ {path.duration}</span>
                    <span>👥 {path.students}</span>
                    <span>⭐ {path.rating}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {path.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {path.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{path.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Student Success Stories
            </h2>
            <p className="text-gray-400 text-lg">
              Join thousands of students who transformed their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{story.avatar}</div>
                    <div>
                      <h3 className="font-semibold">{story.name}</h3>
                      <p className="text-sm text-gray-400">{story.role} at {story.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{story.story}"</p>
                  <div className="flex items-center mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-700">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our community of learners and start building the skills that will land you your dream job. 
                Your future self will thank you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-6 text-lg font-semibold rounded-xl"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Start Learning Today
                </Button>
                <p className="text-sm text-gray-400">
                  Free to start • No credit card required
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
