import { google } from 'googleapis';
import { GmailAuthService } from './gmail-auth-service';
import { AIEmailDetector, DetectedApplication } from './ai-email-detector';
import { db } from './firebase';
import { doc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { LocalStorageService } from './local-storage-service';

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
  private authService: GmailAuthService;
  private aiDetector: AIEmailDetector;
  private userEmail: string;

  constructor(userEmail: string, accessToken?: string) {
    this.userEmail = userEmail;
    this.authService = new GmailAuthService();
    this.aiDetector = new AIEmailDetector();
    
    if (accessToken) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });
    }
  }

  async fetchAndStoreApplications(): Promise<{
    jobs: DetectedApplication[];
    internships: DetectedApplication[];
    hackathons: DetectedApplication[];
  }> {
    try {
      // Check if user has valid Gmail auth
      const authData = await this.authService.getGmailAuth(this.userEmail);
      if (!authData || !authData.isActive) {
        console.log('Gmail not authorized, returning stored applications');
        return await this.getStoredApplications();
      }

      // Set up Gmail API with stored token
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: authData.accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });

      // Fetch emails from last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const year = oneMonthAgo.getFullYear();
      const month = String(oneMonthAgo.getMonth() + 1).padStart(2, '0');
      const day = String(oneMonthAgo.getDate()).padStart(2, '0');
      const searchQuery = `after:${year}/${month}/${day}`;
      
      console.log(`Searching emails with query: ${searchQuery}`);
      
      // Fetch emails with reasonable limit
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults: 100,
      });
      
      const allMessages = response.data.messages || [];

      if (!allMessages.length) {
        console.log('No messages found, returning stored applications');
        return await this.getStoredApplications();
      }

      const detectedApplications: DetectedApplication[] = [];
      
      for (const message of allMessages) {
        try {
          const emailData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const application = await this.analyzeEmailWithAI(emailData.data);
          if (application) {
            detectedApplications.push(application);
          }
        } catch (emailError) {
          console.error(`Error processing email ${message.id}:`, emailError);
          // Continue processing other emails
        }
      }

      // Store in Firebase (don't fail if this fails)
      try {
        await this.storeApplicationsInFirebase(detectedApplications);
      } catch (storeError) {
        console.error('Error storing applications in Firebase:', storeError);
        // Continue with the response even if storage fails
      }

      // Categorize and return
      return this.categorizeApplications(detectedApplications);
    } catch (error) {
      console.error('Error fetching Gmail data:', error);
      // Return stored applications as fallback
      try {
        return await this.getStoredApplications();
      } catch (fallbackError) {
        console.error('Error getting stored applications:', fallbackError);
        return { jobs: [], internships: [], hackathons: [] };
      }
    }
  }

  // New method to start watching Gmail inbox for push notifications
  async startWatch(topicName: string): Promise<void> {
    try {
      const authData = await this.authService.getGmailAuth(this.userEmail);
      if (!authData || !authData.isActive) {
        throw new Error('Gmail not authorized');
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: authData.accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });

      const watchRequest = {
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: topicName, // Google Cloud Pub/Sub topic
        },
      };

      const response = await this.gmail.users.watch(watchRequest);
      console.log('Gmail watch started:', response.data);
    } catch (error) {
      console.error('Error starting Gmail watch:', error);
      throw error;
    }
  }

  // New method to fetch new emails by message IDs (called on webhook notification)
  async fetchNewEmails(messageIds: string[]): Promise<void> {
    try {
      const authData = await this.authService.getGmailAuth(this.userEmail);
      if (!authData || !authData.isActive) {
        throw new Error('Gmail not authorized');
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: authData.accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });

      const detectedApplications: DetectedApplication[] = [];

      for (const messageId of messageIds) {
        const emailData = await this.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
        });

        const application = await this.analyzeEmailWithAI(emailData.data);
        if (application) {
          detectedApplications.push(application);
        }
      }

      if (detectedApplications.length > 0) {
        await this.storeApplicationsInFirebase(detectedApplications);
      }
    } catch (error) {
      console.error('Error fetching new emails:', error);
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

  private async analyzeEmailWithAI(emailData: any): Promise<DetectedApplication | null> {
    try {
      const headers = emailData.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = new Date(parseInt(emailData.internalDate));
      
      const body = this.extractEmailBody(emailData.payload);
      const application = await this.aiDetector.analyzeEmail(subject, from, body);
      
      if (!application) return null;

      return {
        ...application,
        id: emailData.id,
        applicationDate: date
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
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
      const categorizedApps = await this.getStoredApplications();
      const applications = [
        ...categorizedApps.jobs,
        ...categorizedApps.internships,
        ...categorizedApps.hackathons,
      ];
      const platformCounts: { [key: string]: { name: string; domain: string; count: number } } = {};

      applications.forEach((app: any) => {
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

  private categorizeApplications(applications: DetectedApplication[]): {
    jobs: DetectedApplication[];
    internships: DetectedApplication[];
    hackathons: DetectedApplication[];
  } {
    return {
      jobs: applications.filter(app => app.type === 'job'),
      internships: applications.filter(app => app.type === 'internship'),
      hackathons: applications.filter(app => app.type === 'hackathon')
    };
  }

  private async storeApplicationsInFirebase(applications: DetectedApplication[]): Promise<void> {
    try {
      // Store user's applications summary with sanitized email as document ID
      const sanitizedEmail = this.userEmail.replace(/[.#$\[\]]/g, '_');
      const userAppsDoc = doc(db, 'user_applications', sanitizedEmail);
      
      await setDoc(userAppsDoc, {
        email: this.userEmail,
        lastSyncAt: new Date(),
        totalApplications: applications.length,
        applications: applications,
        categorized: this.categorizeApplications(applications)
      }, { merge: true });

      console.log(`Stored ${applications.length} applications for ${this.userEmail}`);
    } catch (error) {
      console.error('Error storing applications in Firebase, using local storage:', error);
      // Fallback to local storage
      LocalStorageService.saveApplications(this.userEmail, {
        email: this.userEmail,
        lastSyncAt: new Date(),
        totalApplications: applications.length,
        applications: applications,
        categorized: this.categorizeApplications(applications)
      });
    }
  }

  async getStoredApplications(): Promise<{
    jobs: DetectedApplication[];
    internships: DetectedApplication[];
    hackathons: DetectedApplication[];
  }> {
    try {
      const sanitizedEmail = this.userEmail.replace(/[.#$\[\]]/g, '_');
      const userAppsDoc = doc(db, 'user_applications', sanitizedEmail);
      
      // Try to get document directly first
      const docSnap = await getDocs(query(collection(db, 'user_applications'), where('email', '==', this.userEmail)));
      
      if (docSnap.empty) {
        // Try local storage fallback
        const localData = LocalStorageService.getApplications(this.userEmail);
        return localData.categorized || localData;
      }

      const data = docSnap.docs[0].data();
      return data.categorized || { jobs: [], internships: [], hackathons: [] };
    } catch (error) {
      console.error('Error getting stored applications from Firebase, trying local storage:', error);
      // Fallback to local storage
      const localData = LocalStorageService.getApplications(this.userEmail);
      return localData.categorized || localData;
    }
  }

  async saveGmailAuthorization(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const authData = {
      email: this.userEmail,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      authorizedAt: new Date(),
      isActive: true
    };

    await this.authService.saveGmailAuth(this.userEmail, authData);
  }

  async isAuthorized(): Promise<boolean> {
    return await this.authService.isGmailAuthorized(this.userEmail);
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