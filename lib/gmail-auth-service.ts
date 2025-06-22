import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface GmailAuthData {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  authorizedAt: Date;
  isActive: boolean;
}

export class GmailAuthService {
  async saveGmailAuth(userEmail: string, authData: GmailAuthData): Promise<void> {
    const authDoc = doc(db, 'gmail_auth', userEmail);
    await setDoc(authDoc, {
      ...authData,
      authorizedAt: new Date(),
      isActive: true,
      lastSyncAt: new Date()
    });
  }

  async getGmailAuth(userEmail: string): Promise<GmailAuthData | null> {
    const authDoc = doc(db, 'gmail_auth', userEmail);
    const authSnap = await getDoc(authDoc);
    
    if (!authSnap.exists()) return null;
    
    const data = authSnap.data();
    return {
      email: data.email,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      authorizedAt: data.authorizedAt.toDate(),
      isActive: data.isActive
    };
  }

  async isGmailAuthorized(userEmail: string): Promise<boolean> {
    const authData = await this.getGmailAuth(userEmail);
    return authData?.isActive && Date.now() < authData.expiresAt;
  }

  async revokeGmailAuth(userEmail: string): Promise<void> {
    const authDoc = doc(db, 'gmail_auth', userEmail);
    await updateDoc(authDoc, {
      isActive: false,
      revokedAt: new Date()
    });
  }
}