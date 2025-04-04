"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function MultiSelect({
  options,
  placeholder = "Select items...",
  value,
  onChange,
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && value.length > 0) {
          const newValue = [...value];
          newValue.pop();
          onChange(newValue);
        }
      }
      // This is not an else if because we want to handle the case where the user
      // presses Delete or Backspace to remove the last item and then presses Escape
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  const selectables = options.filter((option) => !value.includes(option.value));

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={`overflow-visible bg-white border border-input rounded-md ${className}`}
    >
      <div
        className="flex flex-wrap gap-1 p-1 group border-0"
        cmdk-input-wrapper=""
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        {value.map((item) => {
          const option = options.find((o) => o.value === item);
          if (!option) return null;

          return (
            <Badge key={item} variant="secondary" className="px-2 py-0.5">
              {option.label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Remove {option.label}</span>
              </button>
            </Badge>
          );
        })}

        <CommandPrimitive.Input
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px] h-8"
        />
      </div>

      <div className="relative">
        {open && selectables.length > 0 && (
          <div className="absolute w-full z-10 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto max-h-60">
              {selectables.map((option) => (
                <CommandItem
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onSelect={() => {
                    onChange([...value, option.value]);
                    setInputValue("");
                  }}
                  className="cursor-pointer"
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}
