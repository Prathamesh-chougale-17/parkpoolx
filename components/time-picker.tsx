"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value = "",
  onChange,
  className = "",
  disabled = false,
}: TimePickerProps) {
  // Parse initial value if provided (format: "HH:MM")
  const [selectedHour, setSelectedHour] = React.useState<string>(() => {
    if (value) {
      const [hour] = value.split(":");
      return hour;
    }
    return "";
  });

  const [selectedMinute, setSelectedMinute] = React.useState<string>(() => {
    if (value) {
      const [, minute] = value.split(":");
      return minute;
    }
    return "";
  });

  // Update the combined time when either hours or minutes change
  React.useEffect(() => {
    if (selectedHour && selectedMinute && onChange) {
      onChange(`${selectedHour}:${selectedMinute}`);
    }
  }, [selectedHour, selectedMinute, onChange]);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <div className="grid gap-2">
        <Label htmlFor="hour">Hour</Label>
        <Select
          value={selectedHour}
          onValueChange={setSelectedHour}
          disabled={disabled}
        >
          <SelectTrigger id="hour" className="w-[80px] cursor-pointer">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour} className="cursor-pointer">
                  {hour}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center self-center pb-2">:</div>

      <div className="grid gap-2">
        <Label htmlFor="minute">Minute</Label>
        <Select
          value={selectedMinute}
          onValueChange={setSelectedMinute}
          disabled={disabled}
        >
          <SelectTrigger id="minute" className="w-[80px] cursor-pointer">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {minutes.map((minute) => (
                <SelectItem
                  key={minute}
                  value={minute}
                  className="cursor-pointer"
                >
                  {minute}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
