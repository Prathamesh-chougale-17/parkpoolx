"use client";

import { CheckCircle2 } from "lucide-react";

interface FormStatusProps {
  formError?: string[];
  success?: boolean;
}

export function FormStatus({ formError, success }: FormStatusProps) {
  if (!formError && !success) return null;

  return (
    <div
      className={`p-3 rounded-md text-sm ${
        success
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <div className="flex items-center gap-x-2">
        {success && <CheckCircle2 className="h-4 w-4" />}
        <p>{success ? "Success!" : formError?.[0]}</p>
      </div>
    </div>
  );
}
