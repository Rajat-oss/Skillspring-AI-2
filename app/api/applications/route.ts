import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GmailService } from '@/lib/gmail-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gmailService = new GmailService(session.accessToken as string);
    const applications = await gmailService.fetchApplicationEmails();

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gmailService = new GmailService(session.accessToken as string);
    const applications = await gmailService.fetchApplicationEmails();

    return NextResponse.json({ applications, message: 'Applications refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing applications:', error);
    return NextResponse.json({ error: 'Failed to refresh applications' }, { status: 500 });
  }
}