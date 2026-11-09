"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";

export default function HeaderAdminLinks({ active }: { active: "public" | "admin" }) {
  const { lang } = useLanguage();

  return (
    <>
        <Link
          className={`nav-link ${active === "public" ? "active" : ""} ${active === "public" ? "mobile-hide-when-active" : ""}`}
          href="/"
        >
          <span className="admin-link-full">{lang === "en" ? "Main Map" : "แผนที่หลัก"}</span>
          <span className="admin-link-mobile">🗺️ {lang === "en" ? "Map" : "แผนที่"}</span>
        </Link>
          <Link
            className={`nav-link ${active === "admin" ? "active" : ""} ${active === "admin" ? "mobile-hide-when-active" : ""}`}
            href="/admin"
          >
            <span className="admin-link-full">{lang === "en" ? "Admin Console" : "ระบบจัดการ (Admin)"}</span>
            <span className="admin-link-mobile">⚙️ Admin</span>
          </Link>
        </>
        );
}
