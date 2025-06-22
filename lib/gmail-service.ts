import { google } from 'googleapis';
import { GenkitAIService } from './genkit-ai-service';

export interface ApplicationData {
  id: string;
  platform: string;
  company: string;
  role: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  applicationDate: Date;
  emailSubject: string;
  emailFrom: string;
  type: 'job' | 'internship' | 'hackathon';
  confidence: number;
}

export interface ConnectedPlatform {
  name: string;
  domain: string;
  count: number;
}

export class GmailService {
  private gmail: any;
  private genkitAI: GenkitAIService;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
    this.genkitAI = new GenkitAIService();
  }

  async fetchApplicationEmails(): Promise<ApplicationData[]> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const query = `${this.buildSearchQuery()} after:${oneMonthAgo.getFullYear()}/${oneMonthAgo.getMonth() + 1}/${oneMonthAgo.getDate()}`;
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
      });

      if (!response.data.messages) return [];

      const applications: ApplicationData[] = [];
      
      for (const message of response.data.messages) {
        const emailData = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const application = await this.parseEmailWithAI(emailData.data);
        if (application) {
          applications.push(application);
        }
      }

      return applications;
    } catch (error) {
      console.error('Error fetching Gmail data:', error);
      throw error;
    }
  }

  private buildSearchQuery(): string {
    const keywords = [
      'application received',
      'thanks for applying',
      'you have applied',
      'application submitted',
      'congratulations',
      'selected for',
      'interview',
      'unfortunately',
      'not selected',
      'rejected'
    ];

    const platforms = [
      'unstop.com',
      'devfolio.co',
      'linkedin.com',
      'internshala.com',
      'naukri.com',
      'indeed.com',
      'glassdoor.com',
      'angel.co',
      'wellfound.com'
    ];

    const keywordQuery = keywords.map(k => `"${k}"`).join(' OR ');
    const platformQuery = platforms.map(p => `from:${p}`).join(' OR ');
    
    return `(${keywordQuery}) OR (${platformQuery})`;
  }

  private async parseEmailWithAI(emailData: any): Promise<ApplicationData | null> {
    try {
      const headers = emailData.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = new Date(parseInt(emailData.internalDate));
      
      const body = this.extractEmailBody(emailData.payload);
      const analysis = await this.genkitAI.analyzeEmail(subject, from, body);
      
      if (!analysis || analysis.confidence < 0.6) return null;

      return {
        id: emailData.id,
        platform: analysis.platform || this.extractPlatform(from, subject) || 'Unknown',
        company: analysis.company || 'Unknown',
        role: analysis.role || 'Unknown Position',
        status: analysis.status,
        applicationDate: date,
        emailSubject: subject,
        emailFrom: from,
        type: analysis.type,
        confidence: analysis.confidence,
      };
    } catch (error) {
      console.error('Error parsing email with AI:', error);
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
        }
      }
    }
    
    return body.replace(/<[^>]*>/g, '').substring(0, 2000);
  }

  private extractPlatform(from: string, subject: string): string {
    const platformMap: { [key: string]: string } = {
      'unstop.com': 'Unstop',
      'devfolio.co': 'Devfolio',
      'linkedin.com': 'LinkedIn',
      'internshala.com': 'Internshala',
      'naukri.com': 'Naukri',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'angel.co': 'AngelList',
      'wellfound.com': 'Wellfound',
    };

    for (const [domain, name] of Object.entries(platformMap)) {
      if (from.toLowerCase().includes(domain)) {
        return name;
      }
    }

    return '';
  }

  private extractCompany(from: string, subject: string): string {
    // Extract company name from email or subject
    const companyPatterns = [
      /at\s+([A-Z][a-zA-Z\s&]+)/,
      /from\s+([A-Z][a-zA-Z\s&]+)/,
      /([A-Z][a-zA-Z\s&]+)\s+team/i,
    ];

    for (const pattern of companyPatterns) {
      const match = subject.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Extract from email domain
    const emailMatch = from.match(/@([^.]+)/);
    if (emailMatch) {
      return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
    }

    return '';
  }

  private extractRole(subject: string): string {
    const rolePatterns = [
      /for\s+([A-Z][a-zA-Z\s]+)\s+position/i,
      /([A-Z][a-zA-Z\s]+)\s+role/i,
      /([A-Z][a-zA-Z\s]+)\s+internship/i,
      /([A-Z][a-zA-Z\s]+)\s+job/i,
    ];

    for (const pattern of rolePatterns) {
      const match = subject.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  private extractStatus(subject: string): ApplicationData['status'] {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('congratulations') || lowerSubject.includes('selected')) {
      return 'selected';
    }
    if (lowerSubject.includes('interview')) {
      return 'interview';
    }
    if (lowerSubject.includes('unfortunately') || lowerSubject.includes('not selected') || lowerSubject.includes('rejected')) {
      return 'rejected';
    }
    if (lowerSubject.includes('received') || lowerSubject.includes('submitted')) {
      return 'applied';
    }
    
    return 'pending';
  }

  async getConnectedPlatforms(): Promise<ConnectedPlatform[]> {
    try {
      const applications = await this.fetchApplicationEmails();
      const platformCounts: { [key: string]: { name: string; domain: string; count: number } } = {};

      applications.forEach(app => {
        const domain = this.getPlatformDomain(app.platform);
        if (!platformCounts[app.platform]) {
          platformCounts[app.platform] = {
            name: app.platform,
            domain,
            count: 0
          };
        }
        platformCounts[app.platform].count++;
      });

      return Object.values(platformCounts);
    } catch (error) {
      console.error('Error getting connected platforms:', error);
      return [];
    }
  }

  async getCategorizedApplications(): Promise<{
    jobs: ApplicationData[];
    internships: ApplicationData[];
    hackathons: ApplicationData[];
  }> {
    try {
      const applications = await this.fetchApplicationEmails();
      return await this.genkitAI.categorizeApplications(applications);
    } catch (error) {
      console.error('Error categorizing applications:', error);
      return { jobs: [], internships: [], hackathons: [] };
    }
  }

  async getAIInsights(): Promise<string> {
    try {
      const applications = await this.fetchApplicationEmails();
      return await this.genkitAI.generateInsights(applications);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return 'Unable to generate insights at this time.';
    }
  }

  private getPlatformDomain(platform: string): string {
    const domainMap: { [key: string]: string } = {
      'Unstop': 'unstop.com',
      'Devfolio': 'devfolio.co',
      'LinkedIn': 'linkedin.com',
      'Internshala': 'internshala.com',
      'Naukri': 'naukri.com',
      'Indeed': 'indeed.com',
      'Glassdoor': 'glassdoor.com',
      'AngelList': 'angel.co',
      'Wellfound': 'wellfound.com',
    };

    return domainMap[platform] || '';
  }
}