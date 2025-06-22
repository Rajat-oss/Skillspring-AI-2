import { NextRequest, NextResponse } from 'next/server';
import { GmailAuthService } from '@/lib/gmail-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
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