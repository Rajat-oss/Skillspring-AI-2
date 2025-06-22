export interface DetectedApplication {
  id: string;
  type: 'job' | 'internship' | 'hackathon';
  company: string;
  role: string;
  platform: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  applicationDate: Date;
  emailSubject: string;
  emailFrom: string;
  confidence: number;
}

export class AIEmailDetector {
  private jobKeywords = [
    'job application', 'position', 'role', 'employment', 'career opportunity',
    'hiring', 'recruitment', 'job opening', 'vacancy', 'work opportunity'
  ];

  private internshipKeywords = [
    'internship', 'intern', 'summer program', 'training program',
    'student opportunity', 'apprenticeship', 'co-op'
  ];

  private hackathonKeywords = [
    'hackathon', 'coding competition', 'hack', 'coding challenge',
    'programming contest', 'dev competition', 'tech challenge'
  ];

  private statusKeywords = {
    applied: ['submitted', 'received', 'application', 'thank you for applying'],
    selected: ['congratulations', 'selected', 'accepted', 'offer', 'welcome'],
    rejected: ['unfortunately', 'regret', 'not selected', 'declined', 'unsuccessful'],
    interview: ['interview', 'next round', 'assessment', 'screening', 'call'],
    pending: ['under review', 'reviewing', 'consideration', 'processing']
  };

  private platforms = [
    'linkedin', 'naukri', 'indeed', 'glassdoor', 'internshala', 'unstop',
    'devfolio', 'angellist', 'wellfound', 'monster', 'shine'
  ];

  async analyzeEmail(subject: string, from: string, body: string): Promise<DetectedApplication | null> {
    const text = `${subject} ${from} ${body}`.toLowerCase();
    
    // Detect type
    const type = this.detectType(text);
    if (!type) return null;

    // Extract details
    const company = this.extractCompany(from, text);
    const role = this.extractRole(subject, text);
    const platform = this.extractPlatform(from, text);
    const status = this.detectStatus(text);
    const confidence = this.calculateConfidence(text, type);

    if (confidence < 0.6) return null;

    return {
      id: Date.now().toString(),
      type,
      company,
      role,
      platform,
      status,
      applicationDate: new Date(),
      emailSubject: subject,
      emailFrom: from,
      confidence
    };
  }

  private detectType(text: string): 'job' | 'internship' | 'hackathon' | null {
    const internshipScore = this.internshipKeywords.reduce((score, keyword) => 
      score + (text.includes(keyword) ? 1 : 0), 0);
    
    const hackathonScore = this.hackathonKeywords.reduce((score, keyword) => 
      score + (text.includes(keyword) ? 1 : 0), 0);
    
    const jobScore = this.jobKeywords.reduce((score, keyword) => 
      score + (text.includes(keyword) ? 1 : 0), 0);

    if (hackathonScore > 0) return 'hackathon';
    if (internshipScore > 0) return 'internship';
    if (jobScore > 0) return 'job';
    
    return null;
  }

  private extractCompany(from: string, text: string): string {
    // Extract from email domain
    const emailMatch = from.match(/@([^.]+)/);
    if (emailMatch) {
      const domain = emailMatch[1];
      if (!['gmail', 'yahoo', 'outlook', 'hotmail', 'noreply'].includes(domain)) {
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }

    // Extract from common patterns
    const companyPatterns = [
      /from ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*) team/
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return 'Unknown Company';
  }

  private extractRole(subject: string, text: string): string {
    const rolePatterns = [
      /for the ([^,\n]+) position/,
      /([^,\n]+) role/,
      /as a ([^,\n]+)/,
      /([^,\n]+) opportunity/
    ];

    for (const pattern of rolePatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }

    // Fallback to subject
    return subject.replace(/re:|fwd:/gi, '').trim() || 'Unknown Position';
  }

  private extractPlatform(from: string, text: string): string {
    for (const platform of this.platforms) {
      if (from.toLowerCase().includes(platform) || text.includes(platform)) {
        return platform.charAt(0).toUpperCase() + platform.slice(1);
      }
    }
    return 'Direct';
  }

  private detectStatus(text: string): 'applied' | 'selected' | 'rejected' | 'interview' | 'pending' {
    for (const [status, keywords] of Object.entries(this.statusKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return status as any;
        }
      }
    }
    return 'applied';
  }

  private calculateConfidence(text: string, type: string): number {
    let score = 0.5; // Base confidence

    // Type-specific keywords boost confidence
    const typeKeywords = type === 'job' ? this.jobKeywords :
                        type === 'internship' ? this.internshipKeywords :
                        this.hackathonKeywords;

    const keywordMatches = typeKeywords.reduce((count, keyword) => 
      count + (text.includes(keyword) ? 1 : 0), 0);

    score += keywordMatches * 0.1;

    // Platform detection boosts confidence
    if (this.platforms.some(platform => text.includes(platform))) {
      score += 0.2;
    }

    // Email structure indicators
    if (text.includes('application') && text.includes('position')) score += 0.1;
    if (text.includes('thank you') && text.includes('applying')) score += 0.1;

    return Math.min(score, 1.0);
  }
}