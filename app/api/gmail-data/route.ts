import { NextRequest, NextResponse } from 'next/server';
import { GmailRealtimeService } from '@/lib/gmail-realtime-service';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, accessToken, action, query, messageId } = await request.json();
    
    console.log('Gmail API request:', { userEmail, action, hasToken: !!accessToken });
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    // Initialize service even without token (will use mock data)
    const gmailService = new GmailRealtimeService(accessToken || '', userEmail);
    
    let data;
    let usingMockData = !accessToken || accessToken === 'undefined';
    
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
      usingMockData,
      message: usingMockData ? 'Using demo data - connect Gmail for real emails' : 'Live Gmail data'
    });

  } catch (error) {
    console.error('Gmail data error:', error);
    
    // Return mock data as fallback
    const { userEmail } = await request.json().catch(() => ({ userEmail: 'demo@example.com' }));
    const { MockGmailService } = await import('@/lib/mock-gmail-service');
    const mockService = new MockGmailService(userEmail);
    
    return NextResponse.json({
      success: true,
      data: await mockService.getRecentEmails(),
      userEmail,
      timestamp: new Date().toISOString(),
      usingMockData: true,
      message: 'Using demo data due to connection issues'
    });
  }
}