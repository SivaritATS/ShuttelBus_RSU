"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";

export default function HeaderAdminLinks({ active }: { active: "public" | "admin" }) {
  const { lang } = useLanguage();

  return (
    <>
      <Link className={`nav-link ${active === "public" ? "active" : ""}`} href="/">
        {lang === "en" ? "Main Map" : "แผนที่หลัก"}
      </Link>
      <Link className={`nav-link ${active === "admin" ? "active" : ""}`} href="/admin">
        {lang === "en" ? "Admin Console" : "ระบบจัดการ (Admin)"}
      </Link>
    </>
  );
}

