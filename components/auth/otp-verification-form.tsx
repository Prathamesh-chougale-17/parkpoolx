"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActionState } from "@/hooks/useActionState"; // Updated import

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  verifyEmailOtp,
  sendVerificationEmail,
  OtpVerificationState,
  EmailVerificationState,
} from "@/actions/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FormStatus } from "@/components/auth/form-status";

interface OtpVerificationFormProps {
  email: string;
  onVerificationSuccess: () => void;
  onChangeEmail: () => void;
}

export function OtpVerificationForm({
  email,
  onVerificationSuccess,
  onChangeEmail,
}: OtpVerificationFormProps) {
  const [otpValue, setOtpValue] = useState("");

  // State for OTP verification
  const [verifyState, verifyAction, verifyPending] =
    useActionState<OtpVerificationState>(verifyEmailOtp, { email, otp: "" });

  // State for resending verification email
  const [resendState, resendAction, resendPending] =
    useActionState<EmailVerificationState>(sendVerificationEmail, { email });

  // Handle OTP value changes
  const handleOtpChange = (value: string) => {
    setOtpValue(value);

    if (value.length === 6) {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("otp", value);
      verifyAction(formData);
    }
  };

  // Handle resend button click
  //   const handleResend = () => {
  //     const formData = new FormData();
  //     formData.append("email", email);
  //     resendAction(formData);
  //   };

  // Handle verification success/error
  useEffect(() => {
    if (verifyState.success) {
      toast.success("Email verified", {
        description: "Your email has been verified successfully.",
      });
      onVerificationSuccess();
    }

    if (verifyState.errors?._form) {
      toast.error("Verification failed", {
        description: verifyState.errors._form[0],
      });
    }
  }, [verifyState, onVerificationSuccess]);

  // Handle resend success/error
  useEffect(() => {
    if (resendState.success) {
      toast.success("Verification code resent", {
        description: "Please check your email for the new code.",
      });
    }

    if (resendState.errors?._form) {
      toast.error("Error", {
        description: resendState.errors._form[0],
      });
    }
  }, [resendState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={verifyAction}>
          <input type="hidden" name="email" value={email} />

          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={handleOtpChange}
                disabled={verifyPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {verifyState.errors?.otp && (
              <div className="text-sm text-red-500 text-center">
                {verifyState.errors.otp[0]}
              </div>
            )}

            <FormStatus
              formError={verifyState.errors?._form}
              success={verifyState.success}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={verifyState.otp?.length !== 6 || verifyPending}
            >
              {verifyPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <form action={resendAction} className="flex-1">
            <input type="hidden" name="email" value={email} />
            <Button
              type="submit"
              variant="outline"
              className="w-full cursor-pointer"
              disabled={resendPending}
            >
              {resendPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
          </form>

          <Button
            variant="ghost"
            onClick={onChangeEmail}
            disabled={verifyPending || resendPending}
            className="flex-1 cursor-pointer"
          >
            Change Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
