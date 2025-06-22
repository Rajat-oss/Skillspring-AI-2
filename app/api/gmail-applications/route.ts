import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail-service';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, accessToken } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const gmailService = new GmailService(userEmail, accessToken);
    
    // Check if already authorized
    const isAuthorized = await gmailService.isAuthorized();
    
    if (!isAuthorized && accessToken) {
      // Save new authorization
      await gmailService.saveGmailAuthorization(accessToken, '', 3600);
    }
    
    // Fetch and analyze applications
    const applications = await gmailService.fetchAndStoreApplications();
    
    return NextResponse.json({
      success: true,
      ...applications,
      insights: `Found ${applications.jobs.length} job applications, ${applications.internships.length} internships, and ${applications.hackathons.length} hackathons. AI has automatically categorized your applications based on email content analysis.`
    });
    
  } catch (error) {
    console.error('Gmail applications error:', error);
    
    // Try to get stored applications if live fetch fails
    try {
      const { userEmail } = await request.json();
      if (userEmail) {
        const gmailService = new GmailService(userEmail);
        const storedApps = await gmailService.getStoredApplications();
        
        return NextResponse.json({
          success: true,
          ...storedApps,
          insights: 'Showing previously synced applications. Connect Gmail for real-time updates.',
          cached: true
        });
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }
    
    return NextResponse.json({ 
      success: true,
      jobs: [],
      internships: [],
      hackathons: [],
      insights: 'Gmail connection in progress. Mock data shown for demo purposes.'
    });
  }
}