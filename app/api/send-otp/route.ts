import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/otp-service';
import { otpManager } from '@/lib/otp-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Send OTP API Called ===');
    
    const body = await request.json();
    const { email } = body;
    
    console.log('Request body:', body);
    console.log('Email:', email);
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required and must be a string' 
      }, { status: 400 });
    }
    
    if (!email.includes('@gmail.com')) {
      return NextResponse.json({ 
        error: 'Please provide a valid Gmail address' 
      }, { status: 400 });
    }

    // Generate and store OTP
    const otp = otpManager.generateOTP();
    otpManager.storeOTP(email, otp);
    
    console.log('Storage info:', otpManager.getStorageInfo());

    // Send OTP email
    const otpService = new OTPService();
    const emailSent = await otpService.sendOTP(email, otp);
    
    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send OTP email. Please try again.' 
      }, { status: 500 });
    }

    console.log(`OTP ${otp} sent successfully to ${email}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent to your Gmail address. Please check your inbox and spam folder.',
      expiresIn: '5 minutes'
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 });
  }
}