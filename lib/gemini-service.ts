import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ApplicationAnalysis {
  type: 'job' | 'internship' | 'hackathon';
  company: string;
  role: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  platform: string;
  confidence: number;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeEmail(subject: string, from: string, body: string): Promise<ApplicationAnalysis | null> {
    try {
      const prompt = `
Analyze this email and determine if it's related to a job application, internship application, or hackathon application.

Email Subject: ${subject}
Email From: ${from}
Email Body: ${body.substring(0, 1000)}

Please respond with a JSON object containing:
{
  "type": "job" | "internship" | "hackathon" | null,
  "company": "company name",
  "role": "position/role name",
  "status": "applied" | "selected" | "rejected" | "interview" | "pending",
  "platform": "platform name (LinkedIn, Unstop, Internshala, etc.)",
  "confidence": 0.0 to 1.0
}

Rules:
- Only return valid application-related emails
- Extract company name from email content or sender
- Determine status based on email content (congratulations=selected, unfortunately=rejected, interview=interview, etc.)
- Identify platform from sender domain or content
- Set confidence based on how certain you are this is an application email
- Return null if not application-related

Respond only with valid JSON.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const analysis = JSON.parse(text);
        return analysis.type ? analysis : null;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        return null;
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return null;
    }
  }

  async categorizeApplications(applications: any[]): Promise<{
    jobs: any[];
    internships: any[];
    hackathons: any[];
  }> {
    const jobs: any[] = [];
    const internships: any[] = [];
    const hackathons: any[] = [];

    for (const app of applications) {
      switch (app.type) {
        case 'job':
          jobs.push(app);
          break;
        case 'internship':
          internships.push(app);
          break;
        case 'hackathon':
          hackathons.push(app);
          break;
      }
    }

    return { jobs, internships, hackathons };
  }

  async generateInsights(applications: any[]): Promise<string> {
    try {
      const prompt = `
Based on these application data, provide career insights and recommendations:

Applications: ${JSON.stringify(applications.slice(0, 10))}

Provide insights about:
1. Application success rate
2. Most active platforms
3. Industry focus
4. Recommendations for improvement

Keep response under 200 words and make it actionable.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return 'Unable to generate insights at this time.';
    }
  }
}