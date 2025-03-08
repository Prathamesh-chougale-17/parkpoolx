"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import {
  sendVerificationEmail,
  EmailVerificationState,
} from "@/actions/auth-actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { SubmitButton } from "@/components/auth/submit-button";

interface EmailVerificationFormProps {
  onEmailSubmit: (email: string) => void;
}

const initialState: EmailVerificationState = {
  email: "",
};

export function EmailVerificationForm({
  onEmailSubmit,
}: EmailVerificationFormProps) {
  const [state, formAction, pending] = useActionState(
    sendVerificationEmail,
    initialState
  );

  // Handle success/error toasts
  useEffect(() => {
    if (state.success) {
      toast.success("Verification email sent", {
        description: "Please check your email for the verification code.",
      });
      onEmailSubmit(state.email);
    }

    if (state.errors?._form) {
      toast.error("Error", {
        description: state.errors._form[0],
      });
    }
  }, [state, onEmailSubmit]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="example@email.com"
          value={state.email}
          error={state.errors?.email}
          disabled={pending}
        />

        <FormStatus formError={state.errors?._form} success={state.success} />

        <SubmitButton
          isPending={pending}
          label="Send Verification Code"
          pendingLabel="Sending..."
          className="cursor-pointer"
        />
      </form>
    </div>
  );
}
