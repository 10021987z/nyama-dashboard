"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="hidden sm:flex items-center justify-center rounded-xl p-2"
        aria-label="Theme"
        style={{ width: 36, height: 36 }}
      />
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="hidden sm:flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-[#f5f3ef]"
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? (
        <Sun className="h-5 w-5" style={{ color: "#D4A017" }} />
      ) : (
        <Moon className="h-5 w-5" style={{ color: "#6B7280" }} />
      )}
    </button>
  );
}
