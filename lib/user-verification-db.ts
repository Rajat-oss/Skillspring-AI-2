// Simple in-memory database for user verification
interface UserVerification {
  email: string;
  isVerified: boolean;
  verifiedAt: Date;
  gmailConnected: boolean;
  connectedAt?: Date;
}

class UserVerificationDB {
  private static instance: UserVerificationDB;
  private users = new Map<string, UserVerification>();

  static getInstance(): UserVerificationDB {
    if (!UserVerificationDB.instance) {
      UserVerificationDB.instance = new UserVerificationDB();
    }
    return UserVerificationDB.instance;
  }

  saveVerification(email: string): void {
    this.users.set(email, {
      email,
      isVerified: true,
      verifiedAt: new Date(),
      gmailConnected: false
    });
    console.log('Saved verification for:', email);
  }

  markGmailConnected(email: string): void {
    const user = this.users.get(email);
    if (user) {
      user.gmailConnected = true;
      user.connectedAt = new Date();
      this.users.set(email, user);
      console.log('Gmail connected for:', email);
    }
  }

  isVerified(email: string): boolean {
    return this.users.get(email)?.isVerified || false;
  }

  isGmailConnected(email: string): boolean {
    return this.users.get(email)?.gmailConnected || false;
  }

  getUser(email: string): UserVerification | null {
    return this.users.get(email) || null;
  }

  getAllUsers(): UserVerification[] {
    return Array.from(this.users.values());
  }
}

export const userDB = UserVerificationDB.getInstance();