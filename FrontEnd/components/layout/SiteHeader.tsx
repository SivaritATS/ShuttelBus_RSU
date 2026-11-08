import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@backend/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageToggle from "@/components/layout/LanguageToggle";
import HeaderBrandText from "@/components/layout/HeaderBrandText";
import HeaderAdminLinks from "@/components/layout/HeaderAdminLinks";

export default async function SiteHeader({ active }: { active: "public" | "admin" }) {
  const user = await getCurrentUser();

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Image
            src="/Bus_icon.png"
            alt="RSU Shuttle Bus Icon"
            width={26}
            height={26}
            className="brand-icon-img"
            priority
          />
        </span>
        <HeaderBrandText />
      </Link>

      <nav className="topnav">
        {user?.role === "ADMIN" ? (
          <div className="admin-nav-group">
            <HeaderAdminLinks active={active} />
            <span className="account-name">{user.username} ({user.role})</span>
            <LogoutButton />
          </div>
        ) : (
          <div className="campus-live-indicator" title="ระบบติดตามตำแหน่งรถรางและจุดจอด มหาวิทยาลัยรังสิต">
            <span className="live-pulse" />
            <span className="live-text">RSU Campus Live</span>
          </div>
        )}

        {/* ปุ่มสลับภาษา TH / EN */}
        <LanguageToggle />

        {/* ปุ่มสลับ Light / Dark Mode */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
