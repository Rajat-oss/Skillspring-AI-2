// Mock Gmail service for development when OAuth fails
export class MockGmailService {
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
  }

  async getRecentEmails() {
    return [
      {
        id: 'mock-1',
        subject: 'Application Received - Software Engineer at TechCorp',
        from: 'noreply@techcorp.com <noreply@techcorp.com>',
        to: this.userEmail,
        date: new Date(Date.now() - 86400000),
        snippet: 'Thank you for your application to the Software Engineer position...',
        threadId: 'thread-1',
        labelIds: ['INBOX'],
        userEmail: this.userEmail
      },
      {
        id: 'mock-2', 
        subject: 'Interview Invitation - Frontend Developer',
        from: 'HR Team <hr@startup.io>',
        to: this.userEmail,
        date: new Date(Date.now() - 172800000),
        snippet: 'We are pleased to invite you for an interview...',
        threadId: 'thread-2',
        labelIds: ['INBOX', 'UNREAD'],
        userEmail: this.userEmail
      },
      {
        id: 'mock-3',
        subject: 'Hackathon Registration Confirmed',
        from: 'DevFest Events <events@devfest.com>',
        to: this.userEmail,
        date: new Date(Date.now() - 259200000),
        snippet: 'Your registration for DevFest Hackathon has been confirmed...',
        threadId: 'thread-3',
        labelIds: ['INBOX'],
        userEmail: this.userEmail
      }
    ];
  }

  async getUnreadCount() {
    return 5;
  }

  async getFullEmail(messageId: string) {
    return {
      id: messageId,
      subject: 'Mock Email Subject',
      from: 'mock@example.com',
      to: this.userEmail,
      date: new Date(),
      body: 'This is a mock email body for development purposes.',
      snippet: 'Mock email snippet...',
      userEmail: this.userEmail
    };
  }

  async searchEmails(query: string) {
    const emails = await this.getRecentEmails();
    if (!query) return emails;
    
    return emails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.from.toLowerCase().includes(query.toLowerCase()) ||
      email.snippet.toLowerCase().includes(query.toLowerCase())
    );
  }
}