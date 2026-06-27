"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("apex-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextTheme = !isDark;

    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("apex-theme", nextTheme ? "dark" : "light");
    setIsDark(nextTheme);
  }

  return (
    <Button onClick={toggleTheme} size="icon" type="button" variant="outline">
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
