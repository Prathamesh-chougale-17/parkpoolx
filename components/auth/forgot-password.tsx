"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  sendPasswordResetEmail,
  verifyEmailOtp,
  resetPassword,
  PasswordResetEmailState,
  OtpVerificationState,
  PasswordResetFormState,
} from "@/actions/auth-actions";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { FormStatus } from "@/components/auth/form-status";
import { SubmitButton } from "@/components/auth/submit-button";
import { useActionState } from "@/hooks/useActionState";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const initialEmailState: PasswordResetEmailState = {
  email: "",
};

const initialOtpState: OtpVerificationState = {
  email: "",
  otp: "",
};

const initialPasswordState: PasswordResetFormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Form states using useActionState
  const [emailState, emailAction, emailPending] = useActionState(
    sendPasswordResetEmail,
    initialEmailState
  );

  const [otpState, otpAction, otpPending] = useActionState(
    verifyEmailOtp,
    initialOtpState
  );

  // For resend functionality
  const [resendState, resendAction, resendPending] = useActionState(
    sendPasswordResetEmail,
    { email: "" }
  );

  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetPassword,
    initialPasswordState
  );

  // Handle email form submission success/error
  useEffect(() => {
    if (emailState.success && step === "email") {
      toast.success("Email verification sent", {
        description: "Please check your email for the reset code.",
      });
      setEmail(emailState.email);
      setStep("otp");
    }

    if (emailState.errors?._form) {
      toast.error("Error", {
        description: emailState.errors._form[0],
      });
    }
  }, [emailState, step]);

  // Handle OTP verification success/error
  useEffect(() => {
    if (otpState.success && step === "otp") {
      toast.success("Verification successful", {
        description: "Please create your new password.",
      });
      setStep("password");
    }

    if (otpState.errors?._form) {
      toast.error("Error", {
        description: otpState.errors._form[0],
      });
    }
  }, [otpState, step]);

  // Handle password reset success/error
  useEffect(() => {
    if (passwordState.success && step === "password") {
      toast.success("Password reset successful", {
        description: "You can now log in with your new password.",
      });
      setStep("success");
    }

    if (passwordState.errors?._form) {
      toast.error("Error", {
        description: passwordState.errors._form[0],
      });
    }
  }, [passwordState, step]);

  // Handle OTP value changes
  const handleOtpChange = (value: string) => {
    setOtpValue(value);

    // Auto-submit when all 6 digits are entered
    if (value.length === 6) {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("otp", value);
      otpAction(formData);
    }
  };

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

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    setPasswordsMatch(e.target.value === passwordInput.value);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          {step === "email" && "Enter your email to reset your password"}
          {step === "otp" && "Enter the verification code sent to your email"}
          {step === "password" && "Create a new password"}
          {step === "success" && "Password reset successful"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "email" && (
          <form action={emailAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                defaultValue={emailState.email}
                disabled={emailPending}
              />
              {emailState.errors?.email && (
                <p className="text-sm text-red-500">
                  {emailState.errors.email[0]}
                </p>
              )}
            </div>

            <FormStatus
              formError={emailState.errors?._form}
              success={emailState.success}
            />

            <SubmitButton
              isPending={emailPending}
              label="Send Reset Code"
              pendingLabel="Sending..."
              className="w-full"
            />
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={handleOtpChange}
                disabled={otpPending}
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

            {otpState.errors?.otp && (
              <div className="text-sm text-red-500 text-center">
                {otpState.errors.otp[0]}
              </div>
            )}

            <FormStatus
              formError={otpState.errors?._form}
              success={otpState.success}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={otpValue.length !== 6 || otpPending}
              onClick={() => {
                const formData = new FormData();
                formData.append("email", email);
                formData.append("otp", otpValue);
                otpAction(formData);
              }}
            >
              {otpPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>

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
                onClick={() => setStep("email")}
                disabled={otpPending || resendPending}
                className="flex-1 cursor-pointer"
              >
                Change Email
              </Button>
            </div>
          </div>
        )}

        {step === "password" && (
          <form action={passwordAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={passwordPending}
                  onChange={() => {
                    const confirmInput = document.getElementById(
                      "confirmPassword"
                    ) as HTMLInputElement;
                    if (confirmInput.value) {
                      setPasswordsMatch(
                        confirmInput.value ===
                          (
                            document.getElementById(
                              "password"
                            ) as HTMLInputElement
                          ).value
                      );
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={passwordPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordState.errors?.password && (
                <p className="text-sm text-red-500">
                  {passwordState.errors.password[0]}
                </p>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                <p>Password should:</p>
                <ul className="list-disc list-inside">
                  <li>Be at least 8 characters</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one number</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={passwordPending}
                  onChange={handleConfirmPasswordChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={passwordPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!passwordsMatch && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
              {passwordState.errors?.confirmPassword && (
                <p className="text-sm text-red-500">
                  {passwordState.errors.confirmPassword[0]}
                </p>
              )}
            </div>

            <FormStatus
              formError={passwordState.errors?._form}
              success={passwordState.success}
            />

            <SubmitButton
              isPending={passwordPending}
              label="Reset Password"
              pendingLabel="Resetting..."
              className="w-full"
            />
          </form>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center space-y-4 py-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-center">
              Your password has been reset successfully.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-semibold">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
