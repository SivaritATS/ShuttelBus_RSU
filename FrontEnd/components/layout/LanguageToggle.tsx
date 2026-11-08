"use client";

import { useEffect, useState } from "react";
import { useLanguage, Language } from "@/lib/languageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="lang-toggle-btn" aria-label="Language selector">
        <span className="lang-chip active">TH</span>
        <span className="lang-divider">/</span>
        <span className="lang-chip">EN</span>
      </div>
    );
  }

  return (
    <div
      className="lang-toggle-btn"
      role="group"
      aria-label="Language selector (เลือกภาษา)"
      title={lang === "th" ? "เปลี่ยนเป็นภาษาอังกฤษ (Switch to English)" : "เปลี่ยนเป็นภาษาไทย (Switch to Thai)"}
    >
      <button
        type="button"
        className={`lang-chip ${lang === "th" ? "active" : ""}`}
        onClick={() => setLang("th")}
        aria-pressed={lang === "th"}
        title="ภาษาไทย"
      >
        TH
      </button>
      <span className="lang-divider" aria-hidden="true">/</span>
      <button
        type="button"
        className={`lang-chip ${lang === "en" ? "active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

