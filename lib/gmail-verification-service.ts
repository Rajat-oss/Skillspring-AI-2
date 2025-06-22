import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface GmailVerificationStatus {
  email: string;
  isVerified: boolean;
  verifiedAt: Date;
  needsGmailAuth: boolean;
  gmailConnected: boolean;
  lastConnectedAt?: Date;
  status: 'verified' | 'connected' | 'expired';
}

export class GmailVerificationService {
  async isGmailVerified(email: string): Promise<boolean> {
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      const docSnap = await getDoc(verifiedDoc);
      
      if (!docSnap.exists()) return false;
      
      const data = docSnap.data();
      return data.isVerified === true;
    } catch (error) {
      console.error('Error checking Gmail verification:', error);
      return false;
    }
  }

  async getVerificationStatus(email: string): Promise<GmailVerificationStatus | null> {
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      const docSnap = await getDoc(verifiedDoc);
      
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      return {
        email: data.email,
        isVerified: data.isVerified,
        verifiedAt: data.verifiedAt.toDate(),
        needsGmailAuth: data.needsGmailAuth || false,
        gmailConnected: data.gmailConnected || false,
        lastConnectedAt: data.lastConnectedAt?.toDate(),
        status: data.status
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
  }

  async markGmailConnected(email: string, accessToken: string): Promise<void> {
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      await updateDoc(verifiedDoc, {
        gmailConnected: true,
        needsGmailAuth: false,
        lastConnectedAt: new Date(),
        accessToken: accessToken,
        status: 'connected'
      });
      console.log('Gmail marked as connected for:', email);
    } catch (error) {
      console.error('Error marking Gmail as connected:', error);
    }
  }

  async saveVerification(email: string): Promise<void> {
    try {
      const verifiedDoc = doc(db, 'verified_gmails', email);
      await setDoc(verifiedDoc, {
        email,
        isVerified: true,
        verifiedAt: new Date(),
        needsGmailAuth: true,
        gmailConnected: false,
        status: 'verified'
      });
    } catch (error) {
      console.error('Error saving verification:', error);
    }
  }
}