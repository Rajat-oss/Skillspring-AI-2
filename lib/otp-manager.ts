interface OTPData {
  otp: string;
  email: string;
  timestamp: number;
  expiresAt: number;
}

class OTPManager {
  private get storage() {
    if (!global.otpStorage) {
      global.otpStorage = new Map();
    }
    return global.otpStorage;
  }
  private readonly EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOTP(email: string, otp: string): void {
    const now = Date.now();
    this.storage.set(email, {
      otp,
      email,
      timestamp: now,
      expiresAt: now + this.EXPIRY_TIME
    });
    console.log(`OTP stored for ${email}: ${otp}, expires at ${new Date(now + this.EXPIRY_TIME)}`);
  }

  verifyOTP(email: string, providedOTP: string): { success: boolean; message: string } {
    const otpData = this.storage.get(email);
    
    if (!otpData) {
      return { success: false, message: 'No OTP found for this email. Please request a new one.' };
    }

    const now = Date.now();
    if (now > otpData.expiresAt) {
      this.storage.delete(email);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (otpData.otp !== providedOTP) {
      return { success: false, message: 'Invalid OTP. Please check your email and try again.' };
    }

    // OTP is valid, remove it to prevent reuse
    this.storage.delete(email);
    return { success: true, message: 'OTP verified successfully.' };
  }

  getStorageInfo(): { size: number; emails: string[] } {
    return {
      size: this.storage.size,
      emails: Array.from(this.storage.keys())
    };
  }

  cleanExpiredOTPs(): void {
    const now = Date.now();
    for (const [email, data] of this.storage.entries()) {
      if (now > data.expiresAt) {
        this.storage.delete(email);
        console.log(`Cleaned expired OTP for ${email}`);
      }
    }
  }
}

export const otpManager = new OTPManager();