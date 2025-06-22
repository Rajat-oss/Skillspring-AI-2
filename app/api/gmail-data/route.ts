import { NextRequest, NextResponse } from 'next/server';
import { GmailRealtimeService } from '@/lib/gmail-realtime-service';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, accessToken, action, query } = await request.json();
    
    if (!userEmail || !accessToken) {
      return NextResponse.json({ error: 'Email and access token required' }, { status: 400 });
    }

    console.log('Gmail API request for user:', userEmail);
    const gmailService = new GmailRealtimeService(accessToken, userEmail);
    
    let data;
    switch (action) {
      case 'recent':
        data = await gmailService.getRecentEmails(20);
        break;
      case 'unread':
        data = await gmailService.getUnreadCount();
        break;
      case 'search':
        data = await gmailService.searchEmails(query || '');
        break;
      default:
        data = await gmailService.getRecentEmails(10);
    }

    return NextResponse.json({
      success: true,
      data,
      userEmail: userEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gmail data error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Gmail data',
      success: false 
    }, { status: 500 });
  }
}