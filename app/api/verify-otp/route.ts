import { NextRequest, NextResponse } from 'next/server';
import { otpManager } from '@/lib/otp-manager';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Verify OTP API Called ===');
    
    const body = await request.json();
    const { email, otp } = body;
    
    console.log('Email:', email, 'OTP:', otp);
    console.log('Storage info:', otpManager.getStorageInfo());
    
    if (!email || !otp) {
      return NextResponse.json({ 
        error: 'Email and OTP required' 
      }, { status: 400 });
    }

    // Clean expired OTPs first
    otpManager.cleanExpiredOTPs();
    
    // Verify OTP
    const result = otpManager.verifyOTP(email, otp);
    
    console.log('Verification result:', result);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }

    // Save verified Gmail permanently in Firebase
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      await setDoc(verifiedDoc, {
        email,
        verifiedAt: new Date(),
        isVerified: true,
        needsGmailAuth: true,
        status: 'verified'
      });
      console.log('Gmail verification saved to Firebase');
    } catch (firebaseError) {
      console.error('Firebase save error:', firebaseError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      email: email,
      verified: true
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 });
  }
}