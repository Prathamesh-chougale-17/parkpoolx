"use client";

import { useEffect, useState } from "react";
import { useActionState } from "@/hooks/useActionState";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { registerUser, RegisterUserState } from "@/actions/auth-actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { SubmitButton } from "@/components/auth/submit-button";
import { GenderSelector } from "@/components/auth/gender-selector";
import BirthdayPicker from "@/components/auth/year-month-selector-calendar";

interface SignupFormProps {
  email: string;
}

export function SignupForm({ email }: SignupFormProps) {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);

  const [state, formAction, pending] = useActionState<RegisterUserState>(
    registerUser,
    {
      email,
      name: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      companyCode: "",
      phoneNumber: "",
      location: "",
      gender: "",
    }
  );

  // Parse the birthDate from state when it changes
  useEffect(() => {
    if (state.birthDate && state.birthDate !== "") {
      setBirthDate(new Date(state.birthDate));
    }
  }, [state.birthDate]);

  // Handle registration success/error
  useEffect(() => {
    if (state.success) {
      toast.success("Registration successful", {
        description: "Your account has been created successfully.",
      });

      // Navigate to login page on success
      router.push("/login");
    }

    if (state.errors?._form) {
      toast.error("Registration failed", {
        description: state.errors._form[0],
      });
    }
  }, [state, router]);

  // Custom form action that includes the birthDate
  const customFormAction = (formData: FormData) => {
    if (birthDate) {
      // Format the date as YYYY-MM-DD for the server
      const formattedDate = birthDate.toISOString().split("T")[0];
      formData.set("birthDate", formattedDate);
    }
    return formAction(formData);
  };

  // Handle date selection from the calendar
  const handleDateSelect = (date: Date | undefined) => {
    setBirthDate(date);
  };

  return (
    <div className="space-y-6">
      <form action={customFormAction} className="space-y-6">
        <input type="hidden" name="email" value={email} />
        {/* Hidden input to ensure birthDate is included in form submission */}
        <input
          type="hidden"
          name="birthDate"
          value={birthDate ? birthDate.toISOString().split("T")[0] : ""}
        />

        <FormField
          id="email"
          label="Email"
          value={email}
          disabled={true}
          error={state.errors?.email}
        />

        <FormField
          id="name"
          label="Full Name"
          placeholder="John Doe"
          value={state.name}
          error={state.errors?.name}
          disabled={pending}
        />

        <div className="space-y-2">
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium leading-none"
          >
            Birth Date
          </label>
          <BirthdayPicker selected={birthDate} onSelect={handleDateSelect} />
          {state.errors?.birthDate && (
            <p className="text-xs text-red-500">{state.errors.birthDate[0]}</p>
          )}
        </div>

        <FormField
          id="phoneNumber"
          label="Phone Number"
          placeholder="1234567890"
          value={state.phoneNumber}
          error={state.errors?.phoneNumber}
          disabled={pending}
        />

        <FormField
          id="location"
          label="Location"
          placeholder="City, State"
          value={state.location}
          error={state.errors?.location}
          disabled={pending}
        />

        <GenderSelector
          value={state.gender}
          error={state.errors?.gender}
          disabled={pending}
        />

        <FormField
          id="companyCode"
          label="Company Code (Optional)"
          placeholder="Enter company code if applicable"
          value={state.companyCode}
          error={state.errors?.companyCode}
          disabled={pending}
        />

        <FormField
          id="password"
          label="Password"
          isPassword
          placeholder="********"
          value={state.password}
          error={state.errors?.password}
          disabled={pending}
        />

        <FormField
          id="confirmPassword"
          label="Confirm Password"
          isPassword
          placeholder="********"
          value={state.confirmPassword}
          error={state.errors?.confirmPassword}
          disabled={pending}
        />

        <FormStatus formError={state.errors?._form} success={state.success} />

        <SubmitButton
          isPending={pending}
          label="Create Account"
          pendingLabel="Creating Account..."
        />
      </form>
    </div>
  );
}
