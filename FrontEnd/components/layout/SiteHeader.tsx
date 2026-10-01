import Link from "next/link";
import { getCurrentUser } from "@backend/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default async function SiteHeader({ active }: { active: "public" | "admin" }) {
  const user = await getCurrentUser();

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 18.5 18.5 5M10 5h8.5v8.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-title">Shuttle Bus RSU</span>
          <span className="brand-subtitle">ระบบติดตามรถราง ม.รังสิต</span>
        </span>
      </Link>

      <nav className="topnav">
        {user?.role === "ADMIN" ? (
          <div className="admin-nav-group">
            <Link className={`nav-link ${active === "public" ? "active" : ""}`} href="/">
              แผนที่หลัก
            </Link>
            <Link className={`nav-link ${active === "admin" ? "active" : ""}`} href="/admin">
              ระบบจัดการ (Admin)
            </Link>
            <span className="account-name">{user.username} ({user.role})</span>
            <LogoutButton />
          </div>
        ) : (
          <div className="campus-live-indicator" title="ระบบติดตามตำแหน่งรถรางและจุดจอด มหาวิทยาลัยรังสิต">
            <span className="live-pulse" />
            <span className="live-text">RSU Campus Live</span>
          </div>
        )}

        {/* ปุ่มสลับ Light / Dark Mode */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
