import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { LocalStorageService } from './local-storage-service';

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
    try {
      const sanitizedEmail = userEmail.replace(/[.#$\[\]]/g, '_');
      const authDoc = doc(db, 'gmail_auth', sanitizedEmail);
      await setDoc(authDoc, {
        ...authData,
        authorizedAt: new Date(),
        isActive: true,
        lastSyncAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving Gmail auth to Firebase, using local storage:', error);
      // Fallback to local storage
      LocalStorageService.saveGmailAuth(userEmail, {
        ...authData,
        authorizedAt: new Date(),
        isActive: true,
        lastSyncAt: new Date()
      });
    }
  }

  async getGmailAuth(userEmail: string): Promise<GmailAuthData | null> {
    try {
      const sanitizedEmail = userEmail.replace(/[.#$\[\]]/g, '_');
      const authDoc = doc(db, 'gmail_auth', sanitizedEmail);
      const authSnap = await getDoc(authDoc);
      
      if (!authSnap.exists()) {
        // Try local storage fallback
        const localData = LocalStorageService.getGmailAuth(userEmail);
        return localData;
      }
      
      const data = authSnap.data();
      return {
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        authorizedAt: data.authorizedAt?.toDate ? data.authorizedAt.toDate() : new Date(data.authorizedAt),
        isActive: data.isActive
      };
    } catch (error) {
      console.error('Error getting Gmail auth from Firebase, trying local storage:', error);
      // Fallback to local storage
      return LocalStorageService.getGmailAuth(userEmail);
    }
  }

  async isGmailAuthorized(userEmail: string): Promise<boolean> {
    try {
      const authData = await this.getGmailAuth(userEmail);
      return authData?.isActive && Date.now() < authData.expiresAt;
    } catch (error) {
      console.error('Error checking Gmail authorization:', error);
      return false;
    }
  }

  async revokeGmailAuth(userEmail: string): Promise<void> {
    try {
      const sanitizedEmail = userEmail.replace(/[.#$\[\]]/g, '_');
      const authDoc = doc(db, 'gmail_auth', sanitizedEmail);
      await updateDoc(authDoc, {
        isActive: false,
        revokedAt: new Date()
      });
    } catch (error) {
      console.error('Error revoking Gmail auth:', error);
      throw error;
    }
  }
}