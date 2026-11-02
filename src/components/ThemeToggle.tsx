import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readInitialTheme } from "@/lib/theme";

type Theme = "light" | "dark";
const STORAGE_KEY = "deliverypilot-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme works for the session even when storage is unavailable.
    }
  }, [theme]);

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => {
        setTheme(nextTheme);
      }}
    >
      {nextTheme === "dark" ? "Dark" : "Light"}
    </Button>
  );
}
