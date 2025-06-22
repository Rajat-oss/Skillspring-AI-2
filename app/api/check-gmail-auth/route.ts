import { NextRequest, NextResponse } from 'next/server';
import { GmailAuthService } from '@/lib/gmail-auth-service';

export async function POST(request: NextRequest) {
  try {
    let userEmail;
    try {
      const body = await request.json();
      userEmail = body.userEmail;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ authorized: false, lastSync: null });
    }
    
    if (!userEmail) {
      return NextResponse.json({ authorized: false, lastSync: null });
    }

    const authService = new GmailAuthService();
    const isAuthorized = await authService.isGmailAuthorized(userEmail);
    const authData = await authService.getGmailAuth(userEmail);

    return NextResponse.json({
      authorized: isAuthorized,
      lastSync: authData?.authorizedAt?.toISOString() || null
    });
    
  } catch (error) {
    console.error('Check Gmail auth error:', error);
    return NextResponse.json({ 
      authorized: false,
      lastSync: null
    });
  }
}