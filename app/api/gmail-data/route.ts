import { NextRequest, NextResponse } from 'next/server';
import { GmailRealtimeService } from '@/lib/gmail-realtime-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { action, query, messageId } = await request.json();
    
    // Use session data if available, otherwise use request data
    const userEmail = session?.user?.email;
    const accessToken = (session as any)?.accessToken;
    
    console.log('Gmail API request:', { userEmail, action, hasToken: !!accessToken, hasSession: !!session });
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Please sign in to access Gmail data' }, { status: 401 });
    }

    // Initialize service with session data
    const gmailService = new GmailRealtimeService(accessToken || '', userEmail);
    
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
      timestamp: new Date().toISOString(),
      message: 'Live Gmail data'
    });

  } catch (error) {
    console.error('Gmail data error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Gmail data',
      message: 'Please check your Gmail connection and try again',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}