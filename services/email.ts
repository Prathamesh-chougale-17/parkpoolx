import nodemailer from "nodemailer";
import { OTPService } from "./otp";
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}
export class EmailService extends OTPService {
  private createTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      secure: true,
    });
  }
  /**
   * Creates HTML content for verification email
   */
  createVerificationEmailHtml(otp: string): string {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 4px;">
            <strong>${otp}</strong>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
  }

  /**
   * Sends an email with the provided options
   */
  async sendEmail({ to, subject, html }: EmailOptions) {
    const transport = this.createTransport();

    try {
      const result = await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }
  }

  /**
   * Sends a verification email with OTP
   */
  async sendVerificationEmail(
    email: string
  ): Promise<{ success: boolean; otp?: string; error?: unknown }> {
    try {
      const otp = this.generateOTP();
      const html = this.createVerificationEmailHtml(otp);

      const result = await this.sendEmail({
        to: email,
        subject: "Email Verification Code",
        html,
      });

      if (result.success) {
        await this.storeOTP(email, otp);
        return { success: true, otp };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  async sendPasswordResetEmail(email: string) {
    try {
      // const otp = await otpService.generateOTP(email);
      const otp = this.generateOTP();
      await this.storeOTP(email, otp);

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
          <p>Your password reset code is:</p>
          <div style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 4px;">
            <strong>${otp}</strong>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject: "Password Reset Code",
        html,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, message: "Failed to send password reset email" };
    }
  }
}
