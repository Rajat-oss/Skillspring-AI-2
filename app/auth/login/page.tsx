"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Mail } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    // Store user session data (demo login - any email works)
    localStorage.setItem('user_email', email)
    localStorage.setItem('gmail_verified', email)
    localStorage.setItem('gmail_verified_at', new Date().toISOString())
    localStorage.setItem('gmail_connected', email)
    localStorage.setItem('gmail_connected_at', new Date().toISOString())
    
    toast({
      title: "Login Successful",
      description: "Welcome back!",
    })
    
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-700">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your SkillSpring account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Gmail Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Any password (demo)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Demo mode: Enter any email to login
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700"
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-400 space-y-2">
            <div>
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-green-400 hover:underline">
                Sign up
              </Link>
            </div>
            <div>
              <Link href="/" className="text-blue-400 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
