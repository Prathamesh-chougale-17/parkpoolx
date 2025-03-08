"use server";

import { z } from "zod";

const ContactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" }),
});

export interface ContactFormState {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
    _form?: string[];
  };
  success?: boolean;
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Extract form values
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  // Always preserve the input values
  const formValues = { name, email, subject, message };

  const validatedFields = ContactFormSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return {
      ...prevState,
      ...formValues,
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    // Here you would typically send an email or save to a database
    // For demonstration purposes, we'll just simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return success state
    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to submit the form", error);
    return {
      ...prevState,
      ...formValues,
      errors: {
        _form: ["Failed to submit the form. Please try again."],
      },
      success: false,
    };
  }
}
