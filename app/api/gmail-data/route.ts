import { NextRequest, NextResponse } from 'next/server';
import { GmailRealtimeService } from '@/lib/gmail-realtime-service';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, accessToken, action, query, messageId } = await request.json();
    
    console.log('Gmail API request:', { userEmail, action, hasToken: !!accessToken });
    
    if (!userEmail || !accessToken) {
      console.log('Missing credentials:', { userEmail: !!userEmail, accessToken: !!accessToken });
      return NextResponse.json({ error: 'Email and access token required' }, { status: 400 });
    }

    const gmailService = new GmailRealtimeService(accessToken, userEmail);
    
    let data;
    switch (action) {
      case 'recent':
        console.log('Fetching recent emails...');
        data = await gmailService.getRecentEmails();
        console.log(`Fetched ${data?.length || 0} emails`);
        break;
      case 'unread':
        data = await gmailService.getUnreadCount();
        break;
      case 'search':
        data = await gmailService.searchEmails(query || '');
        break;
      case 'fullEmail':
        data = await gmailService.getFullEmail(messageId);
        break;
      default:
        data = await gmailService.getRecentEmails();
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