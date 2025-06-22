// Temporary local storage service to bypass Firebase permission issues
export class LocalStorageService {
  static saveGmailAuth(userEmail: string, authData: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`gmail_auth_${userEmail}`, JSON.stringify(authData));
    }
  }

  static getGmailAuth(userEmail: string): any | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(`gmail_auth_${userEmail}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  static saveApplications(userEmail: string, applications: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`applications_${userEmail}`, JSON.stringify(applications));
    }
  }

  static getApplications(userEmail: string): any {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(`applications_${userEmail}`);
      return data ? JSON.parse(data) : { jobs: [], internships: [], hackathons: [] };
    }
    return { jobs: [], internships: [], hackathons: [] };
  }
}