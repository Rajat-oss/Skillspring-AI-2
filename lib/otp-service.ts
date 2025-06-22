import * as nodemailer from 'nodemailer';

export class OTPService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'jhaderajat@gmail.com',
        pass: 'ozoh zjjf nwkr ltxp'
      }
    });
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(email: string, otp: string): Promise<boolean> {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">SkillSpring Application Tracker</h2>
          <p>Your verification code is:</p>
          <div style="background: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1F2937; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;

      // Send real email
      await this.transporter.sendMail({
        from: 'jhaderajat@gmail.com',
        to: email,
        subject: 'SkillSpring - Verify Your Gmail Access',
        html
      });
      return true;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return false;
    }
  }
}