import { NextRequest, NextResponse } from 'next/server';
import { MockGmailService } from '@/lib/mock-gmail-service';
import { MockApplicationsService } from '@/lib/mock-applications-service';

export async function GET(request: NextRequest) {
  try {
    const userEmail = 'test@example.com';
    
    // Test mock Gmail service
    const mockGmail = new MockGmailService(userEmail);
    const emails = await mockGmail.getRecentEmails();
    const unreadCount = await mockGmail.getUnreadCount();
    
    // Test mock applications service
    const applications = MockApplicationsService.getMockApplications();
    
    return NextResponse.json({
      success: true,
      message: 'Mock services working correctly',
      data: {
        emails,
        unreadCount,
        applications,
        totalEmails: emails.length,
        totalApplications: applications.jobs.length + applications.internships.length + applications.hackathons.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}