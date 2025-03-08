import { hash, compare } from "bcryptjs";
import { MongoClient } from "mongodb";
import clientPromise from "@/db/clientpromise";

interface VerificationResult {
  success: boolean;
  message?: string;
}

export class OTPService {
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Stores hashed OTP in database with expiry time
   */
  async storeOTP(email: string, otp: string) {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Create expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.collection("otpVerifications").updateOne(
      { email },
      {
        $set: {
          email,
          otp: await hash(otp, 10), // Store hashed OTP for security
          expiresAt,
          createdAt: new Date(),
          verified: false,
        },
      },
      { upsert: true }
    );
  }

  /**
   * Verifies provided OTP against stored OTP
   */
  async verifyOTP(
    email: string,
    providedOtp: string
  ): Promise<VerificationResult> {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Find OTP record
    const otpRecord = await db
      .collection("otpVerifications")
      .findOne({ email });

    if (!otpRecord) {
      return {
        success: false,
        message: "Verification failed. Please request a new code.",
      };
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.collection("otpVerifications").deleteOne({ email });
      return {
        success: false,
        message: "Verification code has expired. Please request a new one.",
      };
    }

    // Verify OTP
    const isValid = await compare(providedOtp, otpRecord.otp);
    if (!isValid) {
      return { success: false, message: "Invalid verification code." };
    }

    // Update verification status
    await db
      .collection("otpVerifications")
      .updateOne({ email }, { $set: { verified: true } });

    return { success: true };
  }

  /**
   * Checks if an email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    const record = await db.collection("otpVerifications").findOne({
      email,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    return !!record;
  }

  /**
   * Cleans up OTP verification records for an email
   */
  async cleanupOTPRecord(email: string): Promise<void> {
    const client: MongoClient = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    await db.collection("otpVerifications").deleteOne({ email });
  }
}

// Export a singleton instance
export const otpService = new OTPService();
