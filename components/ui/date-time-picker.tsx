"use client";

import * as React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatLocalDateTimeInput, parseLocalDateTimeInput } from "@/lib/utils";

const DEFAULT_TIME = "09:00";

function mergeDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
}

type DateTimePickerProps = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
};

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(
  ({ value, onChange, placeholder = "Pick date", disabled, className, onBlur }, ref) => {
    const parsed = React.useMemo(() => parseLocalDateTimeInput(value ?? undefined), [value]);
    const [timeInput, setTimeInput] = React.useState(DEFAULT_TIME);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      if (parsed) {
        setTimeInput(format(parsed, "HH:mm"));
      } else {
        setTimeInput(DEFAULT_TIME);
      }
    }, [parsed]);

    const displayText = React.useMemo(() => {
      if (!parsed) return placeholder;
      const combined = mergeDateAndTime(parsed, timeInput);
      return format(combined, "PPP • HH:mm");
    }, [parsed, placeholder, timeInput]);

    function handleSelect(date: Date | undefined) {
      if (!date) {
        onChange(null);
        return;
      }
      const combined = mergeDateAndTime(date, timeInput);
      onChange(formatLocalDateTimeInput(combined));
    }

    const timeInputId = React.useId();

    function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
      const nextTime = event.target.value;
      setTimeInput(nextTime);
      if (!parsed) return;
      const combined = mergeDateAndTime(parsed, nextTime || DEFAULT_TIME);
      onChange(formatLocalDateTimeInput(combined));
      onBlur?.();
    }

    function handleOpenChange(next: boolean) {
      setOpen(next);
      if (!next) {
        onBlur?.();
      }
    }

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !parsed && "text-muted-foreground",
              className
            )}
          >
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex flex-col gap-3 p-3">
            <Calendar
              mode="single"
              selected={parsed ?? undefined}
              onSelect={(date) => {
                handleSelect(date);
              }}
              initialFocus
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <label htmlFor={timeInputId} className="text-xs font-medium text-muted-foreground">
                Time
              </label>
              <input
                id={timeInputId}
                type="time"
                value={timeInput}
                onChange={handleTimeChange}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
DateTimePicker.displayName = "DateTimePicker";
