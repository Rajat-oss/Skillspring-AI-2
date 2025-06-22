import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ verified: false });
    }

    const verifiedDoc = doc(db, 'verified_gmails', email);
    const docSnap = await getDoc(verifiedDoc);
    
    const isVerified = docSnap.exists() && docSnap.data()?.isVerified === true;

    return NextResponse.json({ 
      verified: isVerified,
      email: email
    });
    
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json({ verified: false });
  }
}