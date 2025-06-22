// User data isolation and security utilities

export class UserDataIsolation {
  static validateUserAccess(sessionEmail: string, requestedEmail: string): boolean {
    if (!sessionEmail || !requestedEmail) {
      console.log('Security: Missing email parameters');
      return false;
    }

    if (sessionEmail !== requestedEmail) {
      console.log(`Security: Email mismatch - Session: ${sessionEmail}, Requested: ${requestedEmail}`);
      return false;
    }

    return true;
  }

  static sanitizeUserData(data: any, userEmail: string): any {
    // Remove any data that doesn't belong to the current user
    if (Array.isArray(data)) {
      return data.filter(item => 
        !item.userEmail || item.userEmail === userEmail
      );
    }

    if (data && typeof data === 'object') {
      if (data.userEmail && data.userEmail !== userEmail) {
        console.log('Security: Filtered out data for different user');
        return null;
      }
    }

    return data;
  }

  static logUserAccess(userEmail: string, action: string): void {
    console.log(`User Access Log: ${userEmail} performed ${action} at ${new Date().toISOString()}`);
  }
}