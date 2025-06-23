import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Check if the email exists in localStorage verification records
    const isVerified = typeof window !== 'undefined' && 
      localStorage.getItem('gmail_verified') === email;
    
    return NextResponse.json({ 
      verified: isVerified,
      email
    });
    
  } catch (error) {
    console.error('Check email verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to check email verification status' 
    }, { status: 500 });
  }
}