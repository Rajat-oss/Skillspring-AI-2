"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Mail, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [step, setStep] = useState<'auth' | 'verifying' | 'complete'>('auth')
  
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      setStep('complete')
      localStorage.setItem('gmail_verified', session.user.email!)
      localStorage.setItem('gmail_verified_at', new Date().toISOString())
      localStorage.setItem('gmail_connected', session.user.email!)
      localStorage.setItem('gmail_connected_at', new Date().toISOString())
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }, [session, router])

  const handleGmailAuth = async () => {
    setLoading(true)
    setStep('verifying')
    
    try {
      await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      })
    } catch (error) {
      setStep('auth')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to SkillSpring!</h2>
            <p className="text-gray-400 mb-4">Your account is ready and Gmail is connected.</p>
            <p className="text-sm text-green-400">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'verifying') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
            <p className="text-gray-400">Please complete the authorization in the popup window.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-700">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'signup' ? 'Join SkillSpring' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {mode === 'signup' ? 'Sign up with Gmail for instant access' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits - only show for signup */}
          {mode === 'signup' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Auto-sync your job applications from Gmail</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Secure OAuth - we never see your password</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Instant verification - no OTP needed</span>
              </div>
            </div>
          )}

          {/* Gmail Auth Button */}
          <Button
            onClick={handleGmailAuth}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3"
            disabled={loading}
          >
            <Mail className="w-5 h-5 mr-2" />
            {loading ? "Please wait..." : `${mode === 'signup' ? 'Sign Up' : 'Sign In'} with Gmail`}
          </Button>

          {/* Mode Toggle */}
          <div className="text-center">
            <Button
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              variant="ghost"
              className="text-sm text-gray-400 hover:text-white"
            >
              {mode === 'signup' 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your Gmail data is processed securely and never shared.
          </div>

          <div className="text-center">
            <Link href="/" className="text-blue-400 hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}