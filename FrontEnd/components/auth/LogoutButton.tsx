"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/languageContext";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { lang, t } = useLanguage();

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
      <button className="nav-link nav-action logout-btn" type="button" onClick={logout} disabled={loading}>
        {loading ? (
          lang === "en" ? "Exit…" : "กำลังออก…"
        ) : (
          <>
            <span className="logout-full-text">{t("navLogout")}</span>
            <span className="logout-short-text">⎋ {lang === "en" ? "Exit" : "ออก"}</span>
          </>
        )}
      </button>
      );
}
