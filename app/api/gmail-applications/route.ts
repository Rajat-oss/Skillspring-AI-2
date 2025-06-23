import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail-service';
import { MockApplicationsService } from '@/lib/mock-applications-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  let requestBody: any;
  
  try {
    const session = await getServerSession(authOptions);
    
    // Use session data if available
    const userEmail = session?.user?.email;
    const accessToken = (session as any)?.accessToken;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Please sign in to access your applications' }, { status: 401 });
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
      if (requestBody?.userEmail) {
        const gmailService = new GmailService(requestBody.userEmail);
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
      insights: 'No applications found. Gmail data will be analyzed for job applications, internships, and hackathons.'
    });
  }
}