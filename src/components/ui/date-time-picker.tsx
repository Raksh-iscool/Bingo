"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<{
    hours: string;
    minutes: string;
  }>({
    hours: "12",
    minutes: "00",
  });

  // Update time when date changes
  React.useEffect(() => {
    if (date) {
      setSelectedTime({
        hours: date.getHours().toString().padStart(2, "0"),
        minutes: date.getMinutes().toString().padStart(2, "0"),
      });
    }
  }, [date]);

  // Update date with selected time
  const handleTimeChange = React.useCallback((hours: string, minutes: string) => {
    setSelectedTime({ hours, minutes });
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      setDate(newDate);
    }
  }, [date, setDate]);

  // Generate hours and minutes for the select
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className="flex items-center space-x-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                const newDate = new Date(selectedDate);
                if (date) {
                  // Preserve existing time if there's already a date
                  newDate.setHours(date.getHours());
                  newDate.setMinutes(date.getMinutes());
                } else {
                  // Set default time if there's no existing date
                  newDate.setHours(parseInt(selectedTime.hours, 10));
                  newDate.setMinutes(parseInt(selectedTime.minutes, 10));
                }
                setDate(newDate);
              } else {
                setDate(undefined);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedTime.hours}
          onValueChange={(value) => handleTimeChange(value, selectedTime.minutes)}
          disabled={disabled ?? !date}
        >
          <SelectTrigger className="w-16">
            <SelectValue placeholder="Hours" />
          </SelectTrigger>
          <SelectContent position="popper">
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={selectedTime.minutes}
          onValueChange={(value) => handleTimeChange(selectedTime.hours, value)}
          disabled={disabled ?? !date}
        >
          <SelectTrigger className="w-16">
            <SelectValue placeholder="Minutes" />
          </SelectTrigger>
          <SelectContent position="popper">
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}