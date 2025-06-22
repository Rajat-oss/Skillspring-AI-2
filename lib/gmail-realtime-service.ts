import { google } from 'googleapis';

export class GmailRealtimeService {
  private gmail: any;
  private userEmail: string;
  private accessToken: string;

  constructor(accessToken: string, userEmail: string) {
    // Security: Store user context
    this.accessToken = accessToken;
    this.userEmail = userEmail;
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
    
    console.log(`Gmail service initialized for user: ${userEmail}`);
  }

  async getRecentEmails(maxResults: number = 20) {
    try {
      console.log(`Fetching emails for user: ${this.userEmail}`);
      
      const response = await this.gmail.users.messages.list({
        userId: 'me', // 'me' ensures only current user's data
        maxResults: maxResults,
        q: 'in:inbox'
      });

      if (!response.data.messages) return [];

      const emails = [];
      for (const message of response.data.messages) {
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
          userEmail: this.userEmail // Tag with user for security
        });
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
  }

  async getUnreadCount() {
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