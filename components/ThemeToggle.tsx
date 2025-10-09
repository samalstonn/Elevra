"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/theme-provider";

const LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Switch theme (current: ${LABELS[resolved]})`}
          className="relative"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setPreference("light")}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          <span>Light{preference === "light" ? " (current)" : ""}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPreference("dark")}
          className="flex items-center gap-2"
        >
          <Moon className="h-4 w-4" />
          <span>Dark{preference === "dark" ? " (current)" : ""}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPreference("system")}
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span>System{preference === "system" ? " (current)" : ""}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
