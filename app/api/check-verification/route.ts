import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/lib/user-verification-db';

export async function POST(request: NextRequest) {
  try {
    let email;
    try {
      const body = await request.json();
      email = body.email;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ verified: false });
    }
    
    if (!email) {
      return NextResponse.json({ verified: false });
    }

    const isVerified = userDB.isVerified(email);
    const isGmailConnected = userDB.isGmailConnected(email);

    return NextResponse.json({ 
      verified: isVerified,
      gmailConnected: isGmailConnected,
      email: email
    });
    
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json({ verified: false });
  }
}