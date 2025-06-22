import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { GmailService } from '@/lib/gmail-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken || !session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gmailService = new GmailService(session.accessToken as string);
    const categorizedApps = await gmailService.getCategorizedApplications();
    const insights = await gmailService.getAIInsights();
    const platforms = await gmailService.getConnectedPlatforms();

    // Store user's application data in Firebase
    const userEmail = session.user.email;
    const userDoc = doc(db, 'user_applications', userEmail);
    
    await setDoc(userDoc, {
      email: userEmail,
      lastUpdated: new Date(),
      totalApplications: categorizedApps.jobs.length + categorizedApps.internships.length + categorizedApps.hackathons.length,
      jobs: categorizedApps.jobs,
      internships: categorizedApps.internships,
      hackathons: categorizedApps.hackathons,
      platforms,
      aiInsights: insights,
      syncedAt: new Date()
    });

    // Store individual applications for analytics
    const allApps = [...categorizedApps.jobs, ...categorizedApps.internships, ...categorizedApps.hackathons];
    
    for (const app of allApps) {
      await addDoc(collection(db, 'applications'), {
        ...app,
        userEmail,
        storedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Applications stored successfully',
      count: allApps.length
    });
  } catch (error) {
    console.error('Error storing applications:', error);
    return NextResponse.json({ error: 'Failed to store applications' }, { status: 500 });
  }
}