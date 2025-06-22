import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '../../../../lib/gmail-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify the notification is from Gmail (optional: implement verification)
    // The body contains message data with email IDs to fetch

    // Extract email IDs from the notification
    // Gmail push notifications provide historyId, so you may need to fetch history to get new message IDs
    // For simplicity, assume messageIds are sent in the body (adjust as per actual notification format)
    const messageIds: string[] = body.messageIds || [];

    if (!messageIds.length) {
      return NextResponse.json({ message: 'No message IDs provided' }, { status: 400 });
    }

    // You need to identify the userEmail associated with this notification
    // This can be done via authentication or mapping topic/user in your system
    // For demo, assume userEmail is sent in the body (adjust as needed)
    const userEmail = body.userEmail;
    if (!userEmail) {
      return NextResponse.json({ message: 'User email not provided' }, { status: 400 });
    }

    const gmailService = new GmailService(userEmail);
    await gmailService.fetchNewEmails(messageIds);

    return NextResponse.json({ message: 'Emails processed' });
  } catch (error) {
    console.error('Error in Gmail webhook:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
