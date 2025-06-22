import { google } from 'googleapis';
import { MockGmailService } from './mock-gmail-service';

export class GmailRealtimeService {
  private gmail: any;
  private userEmail: string;
  private accessToken: string;

  constructor(accessToken: string, userEmail: string) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
    
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      console.warn('Invalid access token provided, will use mock data');
      return;
    }
    
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ access_token: accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });
      console.log(`Gmail service initialized for user: ${userEmail}`);
    } catch (error) {
      console.error('Failed to initialize Gmail service:', error);
    }
  }

  async getRecentEmails(maxResults: number = 20) {
    // Use mock service if Gmail not properly initialized
    if (!this.gmail) {
      console.log('Gmail not initialized, using mock data');
      const mockService = new MockGmailService(this.userEmail);
      return await mockService.getRecentEmails();
    }

    try {
      console.log(`Fetching emails for user: ${this.userEmail}`);
      
      // Test token validity first
      await this.gmail.users.getProfile({ userId: 'me' });
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const year = oneMonthAgo.getFullYear();
      const month = String(oneMonthAgo.getMonth() + 1).padStart(2, '0');
      const day = String(oneMonthAgo.getDate()).padStart(2, '0');
      const afterDate = `${year}/${month}/${day}`;
      
      console.log(`Searching emails after: ${afterDate}`);
      
      let response;
      try {
        response = await this.gmail.users.messages.list({
          userId: 'me',
          q: `after:${afterDate}`,
          maxResults: 10
        });
      } catch (error) {
        console.log('Date query failed, trying simple inbox query');
        response = await this.gmail.users.messages.list({
          userId: 'me',
          q: 'in:inbox',
          maxResults: 10
        });
      }

      if (!response.data.messages) {
        console.log('No messages found, using mock data');
        const mockService = new MockGmailService(this.userEmail);
        return await mockService.getRecentEmails();
      }

      console.log(`Found ${response.data.messages.length} messages`);
      const emails = [];
      const messagesToProcess = response.data.messages.slice(0, 5);
      
      for (const message of messagesToProcess) {
        try {
          const emailData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = emailData.data.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          emails.push({
            id: message.id,
            subject,
            from,
            date: new Date(date),
            snippet: emailData.data.snippet,
            userEmail: this.userEmail
          });
        } catch (emailError) {
          console.error(`Error processing email ${message.id}:`, emailError);
        }
      }

      return emails.length > 0 ? emails : await new MockGmailService(this.userEmail).getRecentEmails();
    } catch (error) {
      console.error('Error fetching emails, using mock data:', error);
      const mockService = new MockGmailService(this.userEmail);
      return await mockService.getRecentEmails();
    }
  }

  async getUnreadCount() {
    if (!this.gmail) {
      const mockService = new MockGmailService(this.userEmail);
      return await mockService.getUnreadCount();
    }

    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread'
      });
      return response.data.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Error getting unread count, using mock data:', error);
      const mockService = new MockGmailService(this.userEmail);
      return await mockService.getUnreadCount();
    }
  }

  async getFullEmail(messageId: string) {
    try {
      const emailData = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = emailData.data.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const to = headers.find((h: any) => h.name === 'To')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      const body = this.extractEmailBody(emailData.data.payload);
      
      return {
        id: messageId,
        subject,
        from,
        to,
        date: new Date(date),
        body,
        snippet: emailData.data.snippet,
        userEmail: this.userEmail
      };
    } catch (error) {
      console.error('Error fetching full email:', error);
      return null;
    }
  }

  private extractEmailBody(payload: any): string {
    let body = '';
    
    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString();
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          body = Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }
    
    return body;
  }

  async searchEmails(query: string) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50
      });

      if (!response.data.messages) return [];

      const emails = [];
      for (const message of response.data.messages) {
        const emailData = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const headers = emailData.data.payload.headers;
        emails.push({
          id: message.id,
          subject: headers.find((h: any) => h.name === 'Subject')?.value || '',
          from: headers.find((h: any) => h.name === 'From')?.value || '',
          date: new Date(headers.find((h: any) => h.name === 'Date')?.value || ''),
          snippet: emailData.data.snippet
        });
      }

      return emails;
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }
}