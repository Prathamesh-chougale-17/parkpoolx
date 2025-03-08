"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { SignupForm } from "@/components/auth/signup-form";

type SignupStep = "EMAIL_VERIFICATION" | "OTP_VERIFICATION" | "REGISTRATION";

export default function SignupPage() {
  const [currentStep, setCurrentStep] =
    useState<SignupStep>("EMAIL_VERIFICATION");
  const [email, setEmail] = useState("");

  function handleEmailSubmit(submittedEmail: string) {
    setEmail(submittedEmail);
    setCurrentStep("OTP_VERIFICATION");
  }

  function handleVerificationSuccess() {
    setCurrentStep("REGISTRATION");
  }

  function handleChangeEmail() {
    setCurrentStep("EMAIL_VERIFICATION");
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {currentStep === "EMAIL_VERIFICATION" && "Sign Up"}
            {currentStep === "OTP_VERIFICATION" && "Verify Email"}
            {currentStep === "REGISTRATION" && "Create Account"}
          </CardTitle>
          <CardDescription>
            {currentStep === "EMAIL_VERIFICATION" &&
              "Enter your email to get started"}
            {currentStep === "OTP_VERIFICATION" &&
              "Enter the verification code sent to your email"}
            {currentStep === "REGISTRATION" && "Complete your account setup"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === "EMAIL_VERIFICATION" && (
            <EmailVerificationForm onEmailSubmit={handleEmailSubmit} />
          )}

          {currentStep === "OTP_VERIFICATION" && (
            <OtpVerificationForm
              email={email}
              onVerificationSuccess={handleVerificationSuccess}
              onChangeEmail={handleChangeEmail}
            />
          )}

          {currentStep === "REGISTRATION" && <SignupForm email={email} />}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>

          {currentStep !== "EMAIL_VERIFICATION" && (
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() =>
                setCurrentStep(
                  currentStep === "OTP_VERIFICATION"
                    ? "EMAIL_VERIFICATION"
                    : "OTP_VERIFICATION"
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Back to{" "}
              {currentStep === "REGISTRATION" ? "verification" : "email"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
