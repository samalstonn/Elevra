"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEME_STORAGE_KEY = "elevra-theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === "light" || value === "dark" || value === "system";
};

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) {
      return stored;
    }
  } catch (error) {
    console.error("Unable to read stored theme preference", error);
  }

  return "system";
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

function applyThemeClassName(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    getStoredPreference()
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPrefersDark()
  );

  useEffect(() => {
    setPreference(getStoredPreference());
    setSystemPrefersDark(getSystemPrefersDark());
  }, []);

  const resolved: ResolvedTheme =
    preference === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : preference;

  useEffect(() => {
    applyThemeClassName(resolved);
  }, [resolved]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (preference === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch (error) {
      console.error("Unable to persist theme preference", error);
    }
  }, [preference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const setPreferenceSafe = useCallback((theme: ThemePreference) => {
    setPreference(theme);
  }, []);

  const toggle = useCallback(() => {
    setPreference((prev) => {
      const current =
        prev === "system"
          ? systemPrefersDark
            ? "dark"
            : "light"
          : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, [systemPrefersDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference: setPreferenceSafe,
      toggle,
    }),
    [preference, resolved, setPreferenceSafe, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
