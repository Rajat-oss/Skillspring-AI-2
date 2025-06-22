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
    const categorizedApps = await gmailService.getCategorizedApplications();
    const insights = await gmailService.getAIInsights();

    return NextResponse.json({ 
      ...categorizedApps,
      insights 
    });
  } catch (error) {
    console.error('Error fetching categorized applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}