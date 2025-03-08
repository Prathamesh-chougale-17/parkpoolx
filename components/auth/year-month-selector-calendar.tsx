import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BirthdayPickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

const BirthdayPicker = ({ selected, onSelect }: BirthdayPickerProps) => {
  const [date, setDate] = React.useState<Date | undefined>(selected);
  const [month, setMonth] = React.useState(
    selected ? selected.getMonth() : new Date().getMonth()
  );
  const [year, setYear] = React.useState(
    selected ? selected.getFullYear() : new Date().getFullYear()
  );

  // Update internal state when selected prop changes
  React.useEffect(() => {
    if (selected) {
      setDate(selected);
      setMonth(selected.getMonth());
      setYear(selected.getFullYear());
    }
  }, [selected]);

  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      // Ensure we're using a consistent timestamp (beginning of the day)
      const normalizedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate()
      );
      onSelect?.(normalizedDate);
    } else {
      onSelect?.(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full justify-start text-left font-normal rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          {date ? format(date, "PPP") : "Pick a date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-4 p-4">
          <div className="flex gap-2">
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={new Date(year, month)}
            className="rounded-md border"
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BirthdayPicker;
