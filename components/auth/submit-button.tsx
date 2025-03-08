"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isPending: boolean;
  label: string;
  pendingLabel: string;
  className?: string;
}

export function SubmitButton({
  isPending,
  label,
  pendingLabel,
  className = "",
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={`w-full cursor-pointer ${className}`}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
