"use client";

import { useLanguage } from "@/lib/languageContext";

export default function HeaderBrandText() {
  const { lang } = useLanguage();

  return (
    <span className="brand-text">
      <span className="brand-title">Shuttle Bus RSU</span>
      <span className="brand-subtitle">
        {lang === "en" ? "RSU Tram Tracking System" : "ระบบติดตามรถราง ม.รังสิต"}
      </span>
    </span>
  );
}

