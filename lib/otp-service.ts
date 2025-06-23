import * as nodemailer from 'nodemailer';

export class OTPService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
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
          <h2 style="color: #4F46E5;">SkillSpring Account Verification</h2>
          <p>Thank you for signing up! Your verification code is:</p>
          <div style="background: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1F2937; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `;

      // Send email
      await this.transporter.sendMail({
        from: `"SkillSpring" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'SkillSpring - Verify Your Account',
        html
      });
      return true;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return false;
    }
  }
}