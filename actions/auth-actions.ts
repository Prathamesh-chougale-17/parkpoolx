"use server";

import { EmailService } from "@/services/email";
import { otpService } from "@/services/otp";
import { z } from "zod";
import clientPromise from "@/db/clientpromise";
import { compare, hash } from "bcryptjs";
import { User } from "@/services/user";

const emailValidator = z.string().email("Please enter a valid email address");
const otpValidator = z.string().length(6, "OTP must be 6 digits");

export type EmailVerificationState = {
  email: string;
  errors?: {
    email?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function sendVerificationEmail(
  prevState: EmailVerificationState,
  formData: FormData
) {
  const email = formData.get("email") as string;

  try {
    // if user is already verified, return error
    const isUserPresent = await User.findByEmail(email);
    if (isUserPresent) {
      return {
        email,
        errors: {
          _form: ["Email is already verified"],
        },
      };
    }

    // Validate email
    const parsedEmail = emailValidator.parse(email);

    // Initialize email service
    const emailService = new EmailService();

    // Send verification email with OTP
    const result = await emailService.sendVerificationEmail(parsedEmail);

    if (!result.success) {
      return {
        email,
        errors: {
          _form: ["Failed to send verification email"],
        },
      };
    }

    return {
      email,
      success: true,
    };
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error instanceof z.ZodError) {
      return {
        email,
        errors: {
          email: [error.errors[0].message],
        },
      };
    }
    return {
      email,
      errors: {
        _form: ["An error occurred while sending the email"],
      },
    };
  }
}

export type OtpVerificationState = {
  email: string;
  otp: string;
  errors?: {
    otp?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function verifyEmailOtp(
  prevState: OtpVerificationState,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;

  try {
    // Validate inputs
    const parsedEmail = emailValidator.parse(email);
    const parsedOtp = otpValidator.parse(otp);

    // Verify OTP
    const result = await otpService.verifyOTP(parsedEmail, parsedOtp);

    if (!result.success) {
      return {
        email,
        otp,
        errors: {
          _form: [result.message || "Verification failed"],
        },
      };
    }

    return {
      email,
      otp,
      success: true,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    if (error instanceof z.ZodError) {
      return {
        email,
        otp,
        errors: {
          otp: [error.errors[0].message],
        },
      };
    }
    return {
      email,
      otp,
      errors: {
        _form: ["An error occurred during verification"],
      },
    };
  }
}

export interface RegisterUserState {
  email: string;
  name: string;
  password: string;
  confirmPassword?: string;
  birthDate: string;
  companyCode?: string;
  phoneNumber: string;
  location: string;
  gender: string;
  success?: boolean;
  errors?: {
    _form?: string[];
    email?: string[];
    name?: string[];
    password?: string[];
    confirmPassword?: string[];
    birthDate?: string[];
    companyCode?: string[];
    phoneNumber?: string[];
    location?: string[];
    gender?: string[];
  };
}

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    birthDate: z.string().min(1, "Birth date is required"),
    companyCode: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^\d+$/, "Phone number must contain only digits")
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    location: z.string().min(1, "Location is required"),
    gender: z.enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Please select a gender" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerUser(
  prevState: RegisterUserState,
  formData: FormData
): Promise<RegisterUserState> {
  const validatedFields = registerSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    birthDate: formData.get("birthDate"),
    companyCode: formData.get("companyCode") || "",
    phoneNumber: formData.get("phoneNumber"),
    location: formData.get("location"),
    gender: formData.get("gender"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const userData = {
      email: validatedFields.data.email,
      name: validatedFields.data.name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      birthDate: validatedFields.data.birthDate,
      companyCode: validatedFields.data.companyCode,
      phoneNumber: validatedFields.data.phoneNumber,
      location: validatedFields.data.location,
      gender: validatedFields.data.gender,
      password: await hash(validatedFields.data.password, 10),
      createdAt: new Date().toISOString(),
      isHITAttempted: false,
      isCourseStarted: false,
      role: "user" as const,
    };

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Check if user already exists
    const existingUser = await db
      .collection("users")
      .findOne({ email: userData.email });

    if (existingUser) {
      return {
        ...prevState,
        errors: {
          _form: ["User with this email already exists"],
        },
      };
    }

    await db.collection("users").insertOne(userData);

    // Here, you would typically store the user in your database
    // For example: await db.user.create({ data: userData });

    return {
      ...validatedFields.data,
      success: true,
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      ...prevState,
      errors: {
        _form: ["An error occurred during registration. Please try again."],
      },
    };
  }
}

export async function verifyCredentials(email: string, password: string) {
  const user = await User.findByEmail(email);

  if (!user) return null;

  const passwordMatch = await compare(password, user.password);
  if (!passwordMatch) return null;

  // Return user without password
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };
}
