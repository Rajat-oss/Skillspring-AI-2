import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

export interface ApplicationAnalysis {
  type: 'job' | 'internship' | 'hackathon';
  company: string;
  role: string;
  status: 'applied' | 'selected' | 'rejected' | 'interview' | 'pending';
  platform: string;
  confidence: number;
}

export class GenkitAIService {
  private ai: any;

  constructor() {
    this.ai = genkit({
      plugins: [googleAI()],
      model: gemini15Flash,
    });
  }

  async analyzeEmail(subject: string, from: string, body: string): Promise<ApplicationAnalysis | null> {
    try {
      const analyzeFlow = this.ai.defineFlow('analyzeEmailFlow', async (emailData: any) => {
        const prompt = `
Analyze this email and determine if it's related to a job application, internship application, or hackathon application.

Email Subject: ${emailData.subject}
Email From: ${emailData.from}
Email Body: ${emailData.body}

Respond with ONLY a JSON object:
{
  "type": "job" | "internship" | "hackathon" | null,
  "company": "company name",
  "role": "position/role name", 
  "status": "applied" | "selected" | "rejected" | "interview" | "pending",
  "platform": "platform name",
  "confidence": 0.0 to 1.0
}

Rules:
- Only return valid application-related emails
- Extract company from email content or sender
- Determine status from content (congratulations=selected, unfortunately=rejected, etc.)
- Set confidence based on certainty
- Return null type if not application-related`;

        const { text } = await this.ai.generate(prompt);
        return text;
      });

      const result = await analyzeFlow({ subject, from, body: body.substring(0, 1000) });
      
      try {
        const analysis = JSON.parse(result);
        return analysis.type ? analysis : null;
      } catch (parseError) {
        console.error('Failed to parse Genkit response:', result);
        return null;
      }
    } catch (error) {
      console.error('Genkit AI error:', error);
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
      const insightsFlow = this.ai.defineFlow('generateInsightsFlow', async (apps: any[]) => {
        const prompt = `
Based on these application data, provide career insights and recommendations:

Applications: ${JSON.stringify(apps.slice(0, 10))}

Provide insights about:
1. Application success rate
2. Most active platforms  
3. Industry focus
4. Recommendations for improvement

Keep response under 200 words and make it actionable.`;

        const { text } = await this.ai.generate(prompt);
        return text;
      });

      return await insightsFlow(applications);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return 'Unable to generate insights at this time.';
    }
  }

  async smartApplicationSearch(query: string): Promise<string> {
    try {
      const searchFlow = this.ai.defineFlow('smartSearchFlow', async (searchQuery: string) => {
        const prompt = `
You are a smart application search assistant. Help the user find information about job applications, internships, or hackathons.

User Query: ${searchQuery}

Provide helpful information, tips, or guidance related to their query. Be concise and actionable.`;

        const { text } = await this.ai.generate(prompt);
        return text;
      });

      return await searchFlow(query);
    } catch (error) {
      console.error('Smart search error:', error);
      return 'Unable to process search query at this time.';
    }
  }
}