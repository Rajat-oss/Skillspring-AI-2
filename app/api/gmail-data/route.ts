import { NextRequest, NextResponse } from 'next/server';
import { GmailRealtimeService } from '@/lib/gmail-realtime-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { action, query, messageId, userEmail: requestUserEmail } = await request.json();
    
    // Get user email from session or request
    let userEmail = session?.user?.email || requestUserEmail;
    let accessToken = (session as any)?.accessToken;
    
    // If no session, try to get user email from localStorage (passed in request)
    if (!userEmail) {
      // Check if user is logged in via our custom auth system
      const storedEmail = requestUserEmail;
      if (storedEmail) {
        // Verify user exists in our database
        const userDoc = await getDoc(doc(db, 'users', storedEmail.replace(/[.#$[\]]/g, '_')));
        if (userDoc.exists() && userDoc.data().isVerified) {
          userEmail = storedEmail;
        }
      }
    }
    
    console.log('Gmail API request:', { userEmail, action, hasToken: !!accessToken, hasSession: !!session });
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Please sign in to access Gmail data' }, { status: 401 });
    }

    // Initialize service with available data
    const gmailService = new GmailRealtimeService(accessToken || '', userEmail);
    
    let data;
    
    try {
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
    } catch (error) {
      console.error(`Error in Gmail service (${action}):`, error);
      // If we get an error, we'll return a successful response with empty data
      // This allows the frontend to continue working with mock data
      return NextResponse.json({
        success: true,
        data: action === 'unread' ? 0 : [],
        userEmail: userEmail,
        timestamp: new Date().toISOString(),
        message: 'Using fallback data due to Gmail API error',
        usingMockData: true
      });
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
    
    // If it's an auth error, return specific message
    if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
      return NextResponse.json({
        success: false,
        error: 'Gmail authorization required',
        message: 'Please connect your Gmail account to view real-time data',
        authRequired: true,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Gmail data',
      message: 'Please check your Gmail connection and try again',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}