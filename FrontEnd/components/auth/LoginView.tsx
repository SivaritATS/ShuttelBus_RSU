"use client";

import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/lib/languageContext";

export default function LoginView({ redirectTo }: { redirectTo: string }) {
  const { lang } = useLanguage();

  return (
    <main className="auth-shell">
      <div style={{ position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 30 }}>
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <section className="auth-layout">
        <div className="auth-visual">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Image
                src="/Bus_icon.png"
                alt="Shuttle Bus RSU Icon"
                width={26}
                height={26}
                className="brand-icon-img"
                priority
              />
            </span>
            Shuttle Bus RSU
          </div>
          <h2>{lang === "en" ? "Keep the campus moving." : "ขับเคลื่อนทุกการเดินทางใน ม.รังสิต"}</h2>
          <p>
            {lang === "en"
              ? "Operations control room for campus shuttle routes, 14 building stops, and real-time tram fleet tracking."
              : "พื้นที่สำหรับทีม Admin จัดการเส้นทาง จุดจอด และตำแหน่งรถรับส่งให้ผู้ใช้งานติดตามได้อย่างมั่นใจ"}
          </p>
          <ul className="auth-feature-list">
            <li>{lang === "en" ? "Live GPS mobile telemetry from driver phones" : "อัปเดตตำแหน่งรถแบบเรียลไทม์ผ่าน Socket"}</li>
            <li>{lang === "en" ? "Unified Route & Stops management" : "จัดการ Route และจุดจอดจากที่เดียว"}</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-mark" aria-hidden="true">
            <Image
              src="/Bus_icon.png"
              alt="Shuttle Bus RSU Icon"
              width={32}
              height={32}
              className="brand-icon-img"
            />
          </div>
          <div className="eyebrow">{lang === "en" ? "Shuttle Bus RSU Access" : "ระบบความปลอดภัย Shuttle Bus RSU"}</div>
          <h1>{lang === "en" ? "Admin Sign In" : "เข้าสู่ระบบ"}</h1>
          <p className="auth-copy">
            {lang === "en"
              ? "For authorized transport team & staff only. Public campus map can be accessed without login."
              : "สำหรับเจ้าหน้าที่ที่ได้รับบัญชีจาก Dev เท่านั้น ข้อมูล Public Web สามารถดูได้โดยไม่ต้องเข้าสู่ระบบ"}
          </p>
          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </main>
  );
}

