
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Brain, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResumeAnalysis {
  skills: string[]
  experience_level: string
  career_suggestions: string[]
  skill_gaps: string[]
  learning_recommendations: string[]
  ats_score: number
}

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setAnalysis(null)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      })
    }
  }

  const analyzeResume = async () => {
    if (!file) return

    setIsAnalyzing(true)
    try {
      // Simulate resume analysis - in real implementation, send file to backend
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock analysis results
      const mockAnalysis: ResumeAnalysis = {
        skills: ["React", "JavaScript", "Node.js", "Python", "SQL", "AWS"],
        experience_level: "Mid-level (3-5 years)",
        career_suggestions: [
          "Full-Stack Developer",
          "Frontend Developer", 
          "Software Engineer",
          "Cloud Developer"
        ],
        skill_gaps: ["TypeScript", "Docker", "System Design", "Leadership"],
        learning_recommendations: [
          "Advanced React Patterns",
          "System Design Fundamentals",
          "AWS Certification",
          "Leadership in Tech"
        ],
        ats_score: 85
      }
      
      setAnalysis(mockAnalysis)
      toast({
        title: "Resume analyzed successfully",
        description: "Your resume has been analyzed and career insights are ready.",
      })
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-400">
            <Upload className="w-6 h-6 mr-2" />
            Resume Upload & Analysis
          </CardTitle>
          <CardDescription>
            Upload your resume to get AI-powered career insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
            >
              <FileText className="w-4 h-4" />
              <span>Choose PDF File</span>
            </label>
            {file && (
              <span className="text-sm text-gray-400">
                {file.name}
              </span>
            )}
          </div>
          
          {file && (
            <Button 
              onClick={analyzeResume} 
              disabled={isAnalyzing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
            </Button>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-green-400">
                <Brain className="w-5 h-5 mr-2" />
                Skills Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((skill) => (
                  <Badge key={skill} className="bg-green-600">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Experience Level: {analysis.experience_level}
              </p>
              <p className="text-sm text-gray-400">
                ATS Score: <span className="text-green-400 font-semibold">{analysis.ats_score}/100</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-400">
                <TrendingUp className="w-5 h-5 mr-2" />
                Career Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.career_suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-400">Skill Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.skill_gaps.map((gap) => (
                  <Badge key={gap} variant="destructive">
                    {gap}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-purple-400">Learning Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.learning_recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    • {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
