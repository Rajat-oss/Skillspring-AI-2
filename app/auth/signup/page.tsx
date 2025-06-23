"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Mail, Shield, CheckCircle, KeyRound } from "lucide-react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { signup, auth } from "@/lib/firebase"
import { sendEmailVerification } from "firebase/auth"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'signup' | 'otp-verification' | 'complete'>('signup')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [userCredential, setUserCredential] = useState<any>(null)
  
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    if (session?.user) {
      setStep('complete')
      // Store user data and redirect
      localStorage.setItem('gmail_verified', session.user.email!)
      localStorage.setItem('gmail_verified_at', new Date().toISOString())
      localStorage.setItem('gmail_connected', session.user.email!)
      localStorage.setItem('gmail_connected_at', new Date().toISOString())
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }, [session, router])

  const validateEmail = (email: string) => {
    const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleEmailSignup = async () => {
    setError(null)
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    try {
      // Create user in Firebase
      const userCred = await signup(email, password)
      setUserCredential(userCred)
      
      // Send OTP for verification
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      // Move to OTP verification step
      setStep('otp-verification')
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
        variant: "default",
      })
    } catch (error: any) {
      setError(error.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setOtpError(null)
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP.")
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }
      
      // OTP verified successfully
      setStep('complete')
      
      // Store user data
      localStorage.setItem('user_email', email)
      localStorage.setItem('gmail_verified', email)
      localStorage.setItem('gmail_verified_at', new Date().toISOString())
      
      toast({
        title: "Account Verified",
        description: "Your account has been verified successfully!",
        variant: "default",
      })
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setOtpError(error.message || "OTP verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async () => {
    setOtpError(null)
    setLoading(true)
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }
      
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
        variant: "default",
      })
    } catch (error: any) {
      setOtpError(error.message || "Failed to resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGmailSignup = async () => {
    setLoading(true)
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
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
            <p className="text-gray-400 mb-4">Your account has been verified successfully.</p>
            <p className="text-sm text-green-400">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'otp-verification') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/50 border-gray-700">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                disabled={loading}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
              
              <Button
                onClick={handleVerifyOTP}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 mt-2"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              
              <div className="text-center mt-4">
                <Button
                  variant="link"
                  onClick={resendOTP}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Didn't receive the code? Resend
                </Button>
              </div>
              
              <div className="text-center mt-2">
                <Button
                  variant="link"
                  onClick={() => setStep('signup')}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ← Back to signup
                </Button>
              </div>
            </div>
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
          <CardTitle className="text-2xl">Join SkillSpring</CardTitle>
          <CardDescription>Sign up with email or Gmail for instant access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Signup Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              onClick={handleEmailSignup}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up with Email"}
            </Button>
          </div>

          {/* Divider */}
          <div className="text-center text-gray-400 my-4">or</div>

          {/* Gmail Signup Button */}
          <Button
            onClick={handleGmailSignup}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3"
            disabled={loading}
          >
            <Mail className="w-5 h-5 mr-2" />
            {loading ? "Setting up account..." : "Sign Up with Gmail"}
          </Button>

          {/* Login Button */}
          <Button
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full border-gray-600 hover:bg-gray-800"
            disabled={loading}
          >
            Already have an account? Sign In
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your data is processed securely and never shared.
          </div>

          <div className="mt-4 text-center text-sm text-gray-400 space-y-2">
            <div>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-green-400 hover:underline">
                Sign in
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
