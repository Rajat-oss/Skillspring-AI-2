"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Shield, CheckCircle, Info } from "lucide-react"

interface DemoOTPVerificationProps {
  onVerified: (email: string) => void;
}

export function DemoOTPVerification({ onVerified }: DemoOTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'verified'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOTP, setGeneratedOTP] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOTP = async () => {
    if (!email.includes('@gmail.com')) {
      setError('Please enter a valid Gmail address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        // Use OTP from API response
        setGeneratedOTP(data.demoOTP || '123456')
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (data.success) {
        setStep('verified')
        onVerified(email)
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verified') {
    return (
      <Card className="bg-green-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center text-green-400">
            <CheckCircle className="w-6 h-6 mr-2" />
            Gmail Verified Successfully
          </CardTitle>
          <CardDescription>
            Your Gmail account has been verified and connected securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-300">
            ✅ {email} is now connected to SkillSpring
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-400">
          <Shield className="w-6 h-6 mr-2" />
          Secure Gmail Verification
        </CardTitle>
        <CardDescription>
          {step === 'email' 
            ? 'Enter your Gmail address to receive a verification code'
            : 'Enter the 6-digit code sent to your Gmail'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Gmail Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <Button 
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {generatedOTP && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  <p className="text-blue-300 text-sm">
                    Demo Mode: Your OTP is <strong>{generatedOTP}</strong>
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-gray-800 border-gray-600 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={verifyOTP}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button 
                onClick={() => setStep('email')}
                variant="outline"
                className="flex-1"
              >
                Change Email
              </Button>
            </div>
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            🔒 We use secure OTP verification to ensure only you can access your Gmail data.
            Your privacy and security are our top priority.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}