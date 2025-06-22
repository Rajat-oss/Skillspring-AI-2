// Mock applications service for development
export class MockApplicationsService {
  static getMockApplications() {
    return {
      jobs: [
        {
          id: 'job-1',
          platform: 'LinkedIn',
          company: 'TechCorp',
          role: 'Software Engineer',
          status: 'applied' as const,
          applicationDate: new Date(Date.now() - 86400000 * 3),
          emailSubject: 'Application Received - Software Engineer',
          emailFrom: 'noreply@techcorp.com',
          type: 'job' as const,
          confidence: 0.95
        },
        {
          id: 'job-2',
          platform: 'Indeed',
          company: 'StartupXYZ',
          role: 'Frontend Developer',
          status: 'interview' as const,
          applicationDate: new Date(Date.now() - 86400000 * 7),
          emailSubject: 'Interview Invitation - Frontend Developer',
          emailFrom: 'hr@startupxyz.com',
          type: 'job' as const,
          confidence: 0.92
        }
      ],
      internships: [
        {
          id: 'intern-1',
          platform: 'Internshala',
          company: 'BigTech Inc',
          role: 'Software Development Intern',
          status: 'selected' as const,
          applicationDate: new Date(Date.now() - 86400000 * 5),
          emailSubject: 'Congratulations! Internship Selection',
          emailFrom: 'internships@bigtech.com',
          type: 'internship' as const,
          confidence: 0.98
        }
      ],
      hackathons: [
        {
          id: 'hack-1',
          platform: 'Devfolio',
          company: 'DevFest',
          role: 'Participant',
          status: 'applied' as const,
          applicationDate: new Date(Date.now() - 86400000 * 2),
          emailSubject: 'Hackathon Registration Confirmed',
          emailFrom: 'events@devfest.com',
          type: 'hackathon' as const,
          confidence: 0.89
        }
      ]
    };
  }
}