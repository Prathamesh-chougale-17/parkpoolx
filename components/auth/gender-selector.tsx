"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface GenderSelectorProps {
  value?: string;
  disabled?: boolean;
  error?: string[];
}

export function GenderSelector({
  value = "",
  disabled = false,
  error,
}: GenderSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="gender">Gender</Label>
      <RadioGroup
        id="gender"
        name="gender"
        defaultValue={value || undefined}
        disabled={disabled}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="male" id="male" />
          <Label htmlFor="male">Male</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="female" id="female" />
          <Label htmlFor="female">Female</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="other" id="other" />
          <Label htmlFor="other">Other</Label>
        </div>
      </RadioGroup>
      {error && <p className="text-xs text-red-500">{error[0]}</p>}
    </div>
  );
}
