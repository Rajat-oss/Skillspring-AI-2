// Token management utilities
export class TokenManager {
  static isTokenValid(token: string): boolean {
    if (!token || token === 'undefined' || token === 'null') {
      return false;
    }
    
    // Basic token format validation
    try {
      const parts = token.split('.');
      return parts.length >= 2;
    } catch {
      return false;
    }
  }

  static async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return null;
  }

  static getStoredToken(userEmail: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`gmail_token_${userEmail}`);
    }
    return null;
  }

  static storeToken(userEmail: string, token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`gmail_token_${userEmail}`, token);
      localStorage.setItem(`gmail_token_${userEmail}_timestamp`, Date.now().toString());
    }
  }
}