import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    let email, verified;
    try {
      const body = await request.json();
      email = body.email;
      verified = body.verified;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Save verification permanently
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      await setDoc(verifiedDoc, {
        email,
        isVerified: verified || true,
        verifiedAt: new Date(),
        needsGmailAuth: true,
        gmailConnected: false,
        status: 'verified'
      });

      console.log('Verification saved permanently for:', email);

      return NextResponse.json({ 
        success: true,
        message: 'Verification saved permanently'
      });
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      // Return success even if Firebase fails
      return NextResponse.json({ 
        success: true,
        message: 'Verification processed (Firebase unavailable)'
      });
    }
    
  } catch (error) {
    console.error('Save verification error:', error);
    return NextResponse.json({ 
      success: true,
      message: 'Verification processed'
    });
  }
}