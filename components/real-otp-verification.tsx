"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Shield, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface RealOTPVerificationProps {
  onVerified: (email: string) => void;
}

export function RealOTPVerification({ onVerified }: RealOTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'verified'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

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
        setStep('otp')
        setCountdown(600) // 10 minutes countdown
        startCountdown()
        // Show demo OTP if provided
        if (data.demoOTP) {
          console.log('Demo OTP:', data.demoOTP)
        }
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const verifyOTP = async () => {
    console.log('=== Frontend Verify OTP Called ===');
    console.log('Email:', email, 'Type:', typeof email);
    console.log('OTP:', otp, 'Type:', typeof otp, 'Length:', otp.length);
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must contain only numbers')
      return
    }

    setLoading(true)
    setError('')

    try {
      const requestBody = { 
        email: String(email).trim(), 
        otp: String(otp).trim() 
      };
      
      console.log('Sending request body:', requestBody);
      console.log('JSON string:', JSON.stringify(requestBody));
      
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setStep('verified')
        onVerified(email)
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            Your Gmail account has been verified and is ready for secure connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-300">
            ✅ {email} is now verified and trusted
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
            : 'Check your Gmail inbox and enter the 6-digit verification code'
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
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-400" />
                  <p className="text-blue-300 text-sm">
                    OTP sent to: <strong>{email}</strong> - Check your inbox!
                  </p>
                </div>
                {countdown > 0 && (
                  <div className="flex items-center text-blue-400">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">{formatTime(countdown)}</span>
                  </div>
                )}
              </div>
            </div>
            
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
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button 
                onClick={() => {setStep('email'); setOtp(''); setError('')}}
                variant="outline"
                className="flex-1"
              >
                Change Email
              </Button>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug-otp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, otp, test: 'debug' })
                    });
                    const data = await response.json();
                    console.log('Debug response:', data);
                  } catch (error) {
                    console.error('Debug error:', error);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300"
              >
                Debug Test
              </Button>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={sendOTP}
                variant="ghost"
                size="sm"
                disabled={loading || countdown > 540}
                className="text-blue-400 hover:text-blue-300"
              >
                {countdown > 540 ? `Resend in ${formatTime(countdown - 540)}` : 'Resend OTP'}
              </Button>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                📧 <strong>Check your email:</strong> The OTP has been sent to your Gmail inbox. 
                If you don't see it, please check your spam/junk folder.
              </p>
            </div>
          </div>
        )}

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-300 text-sm">
            🔒 <strong>Real-time verification:</strong> We'll send a secure OTP to your Gmail inbox. 
            Check your email and enter the code to verify ownership.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}