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
        from: 'noreply@techcorp.com',
        date: new Date(Date.now() - 86400000),
        snippet: 'Thank you for your application to the Software Engineer position...',
        userEmail: this.userEmail
      },
      {
        id: 'mock-2', 
        subject: 'Interview Invitation - Frontend Developer',
        from: 'hr@startup.io',
        date: new Date(Date.now() - 172800000),
        snippet: 'We are pleased to invite you for an interview...',
        userEmail: this.userEmail
      },
      {
        id: 'mock-3',
        subject: 'Hackathon Registration Confirmed',
        from: 'events@devfest.com',
        date: new Date(Date.now() - 259200000),
        snippet: 'Your registration for DevFest Hackathon has been confirmed...',
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
    return this.getRecentEmails();
  }
}