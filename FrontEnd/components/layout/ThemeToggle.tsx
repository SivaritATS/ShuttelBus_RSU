"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // อ่าน theme ปัจจุบันจาก document attribute หรือ localStorage
    const currentTheme =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") ||
      (localStorage.getItem("rsu_theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("rsu_theme", nextTheme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: nextTheme } }));
  };

  // ก่อน mount ไม่ให้ render layout shift
  if (!mounted) {
    return (
      <button
        type="button"
        className="theme-toggle-btn"
        aria-label="Toggle theme"
        disabled
      >
        <span className="theme-toggle-icon">🌓</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${theme}`}
      onClick={toggleTheme}
      title={theme === "light" ? "สลับเป็นโหมดมืด (Dark Mode)" : "สลับเป็นโหมดสว่าง (Light Mode)"}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-inner">
        {theme === "light" ? (
          <>
            <svg
              className="theme-icon moon-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span className="theme-btn-label">โหมดมืด</span>
          </>
        ) : (
          <>
            <svg
              className="theme-icon sun-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span className="theme-btn-label">โหมดสว่าง</span>
          </>
        )}
      </span>
    </button>
  );
}
