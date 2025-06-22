import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, verified } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Save verification permanently
    const verifiedDoc = doc(db, 'verified_gmails', email);
    await setDoc(verifiedDoc, {
      email,
      isVerified: verified,
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
    
  } catch (error) {
    console.error('Save verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to save verification' 
    }, { status: 500 });
  }
}