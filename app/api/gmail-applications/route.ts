import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail-service';
import { MockApplicationsService } from '@/lib/mock-applications-service';

export async function POST(request: NextRequest) {
  let requestBody: any;
  
  try {
    // Parse request body once and store it
    requestBody = await request.json();
    const { userEmail, accessToken } = requestBody;
    
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
    
    // Return mock data instead of empty arrays
    const mockData = MockApplicationsService.getMockApplications();
    return NextResponse.json({ 
      success: true,
      ...mockData,
      insights: `Demo data: Found ${mockData.jobs.length} job applications, ${mockData.internships.length} internships, and ${mockData.hackathons.length} hackathons. Connect Gmail for real data.`,
      usingMockData: true
    });
  }
}