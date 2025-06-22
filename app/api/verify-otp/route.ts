import { NextRequest, NextResponse } from 'next/server';
import { otpManager } from '@/lib/otp-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Verify OTP API Called ===');
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    
    let body;
    try {
      body = await request.json();
      console.log('Raw body:', body);
      console.log('Body type:', typeof body);
      console.log('Body keys:', Object.keys(body));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON format in request body' 
      }, { status: 400 });
    }
    
    const { email, otp } = body;
    
    console.log('Extracted email:', email, 'type:', typeof email);
    console.log('Extracted otp:', otp, 'type:', typeof otp);
    console.log('Email length:', email?.length);
    console.log('OTP length:', otp?.length);
    console.log('Storage info before verification:', otpManager.getStorageInfo());
    
    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required and must be a string' 
      }, { status: 400 });
    }
    
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ 
        error: 'OTP is required and must be a string' 
      }, { status: 400 });
    }
    
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ 
        error: 'OTP must be a 6-digit number' 
      }, { status: 400 });
    }

    // Clean expired OTPs first
    otpManager.cleanExpiredOTPs();
    
    // Verify OTP
    const result = otpManager.verifyOTP(email, otp);
    
    console.log('Verification result:', result);
    console.log('Storage info after verification:', otpManager.getStorageInfo());
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      email: email
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 });
  }
}