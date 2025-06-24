import { google } from 'googleapis';

export class GmailRealtimeService {
  private gmail: any;
  private userEmail: string;
  private accessToken: string;

  constructor(accessToken: string, userEmail: string) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
    
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      throw new Error('Valid access token is required for Gmail access');
    }
    
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
    console.log(`Gmail service initialized for user: ${userEmail}`);
  }

  async getRecentEmails(maxResults: number = 50) {
    if (!this.gmail) {
      throw new Error('Gmail not initialized - please sign in again');
    }

    try {
      console.log(`Fetching emails for user: ${this.userEmail}`);
      
      // Get recent emails from inbox
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox',
        maxResults: maxResults
      });

      if (!response.data.messages) {
        console.log('No messages found');
        return [];
      }

      console.log(`Found ${response.data.messages.length} messages`);
      const emails = [];
      
      // Process all messages
      for (const message of response.data.messages) {
        try {
          const emailData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = emailData.data.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          const to = headers.find((h: any) => h.name === 'To')?.value || '';

          emails.push({
            id: message.id,
            subject,
            from,
            to,
            date: new Date(date),
            snippet: emailData.data.snippet || '',
            threadId: emailData.data.threadId,
            labelIds: emailData.data.labelIds || [],
            userEmail: this.userEmail
          });
        } catch (emailError) {
          console.error(`Error processing email ${message.id}:`, emailError);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    if (!this.gmail) {
      throw new Error('Gmail not initialized');
    }

    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread'
      });
      return response.data.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async getFullEmail(messageId: string) {
    if (!this.gmail) {
      throw new Error('Gmail not initialized');
    }
    
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
    if (!this.gmail) {
      throw new Error('Gmail not initialized');
    }
    
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
          to: headers.find((h: any) => h.name === 'To')?.value || '',
          date: new Date(headers.find((h: any) => h.name === 'Date')?.value || ''),
          snippet: emailData.data.snippet,
          threadId: emailData.data.threadId,
          labelIds: emailData.data.labelIds || [],
          userEmail: this.userEmail
        });
      }

      return emails;
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }
}