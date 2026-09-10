import Link from "next/link";
import { getCurrentUser } from "@backend/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function SiteHeader({ active }: { active: "public" | "admin" }) {
  const user = await getCurrentUser();

  return <header className="topbar">
    <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5 18.5 5M10 5h8.5v8.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Shuttle Bus RSU</Link>
    <nav className="topnav">
      <Link className={`nav-link ${active === "public" ? "active" : ""}`} href="/">Public Web Map</Link>
      {user?.role === "ADMIN" && <Link className={`nav-link ${active === "admin" ? "active" : ""}`} href="/admin">Admin Dashboard</Link>}
      {user ? <><span className="account-name">{user.username} · {user.role}</span><LogoutButton /></> : <Link className="button button-primary nav-login" href="/login">เข้าสู่ระบบ</Link>}
    </nav>
  </header>;
}
