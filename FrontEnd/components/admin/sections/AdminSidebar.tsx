"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminTab } from "../admin-types";

interface NavEntry {
  key: AdminTab;
  label: string;
  href: string;
}

const navEntries: NavEntry[] = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "live-map", label: "Live Map and Trip", href: "/admin/live-map" },
  { key: "vehicles", label: "Vehicle", href: "/admin/vehicles" },
  { key: "routes", label: "Route", href: "/admin/routes" },
  { key: "stops", label: "Stop", href: "/admin/stops" },
];

export function AdminSidebar({
  tab,
  onTabChange,
  onReset,
}: {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onReset: () => void;
}) {
  const pathname = usePathname();

  const isItemActive = (entry: NavEntry) => {
    if (pathname === entry.href) return true;
    if (entry.key === "overview" && (pathname === "/admin" || pathname === "/admin/overview")) return true;
    if (entry.key === "vehicles" && (pathname === "/admin/vehicles" || pathname === "/admin/vehicle")) return true;
    if (entry.key === "routes" && (pathname === "/admin/routes" || pathname === "/admin/route")) return true;
    if (entry.key === "stops" && (pathname === "/admin/stops" || pathname === "/admin/stop")) return true;
    return tab === entry.key;
  };

  return (
    <aside className="admin-sidebar">
      <h1>Operations</h1>
      <p>Campus transport control room</p>
      <nav className="side-nav">
        {navEntries.map((entry) => {
          const active = isItemActive(entry);
          return (
            <Link
              key={entry.key}
              href={entry.href}
              className={`side-nav-link ${active ? "active" : ""}`}
              style={{ textDecoration: "none" }}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                onTabChange(entry.key);
                onReset();
              }}
            >
              <NavIcon name={entry.key} />
              {entry.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function getAdminTabLabel(tab: AdminTab) {
  const match = navEntries.find((e) => e.key === tab);
  return match?.label || tab;
}

function NavIcon({ name }: { name: AdminTab }) {
  if (name === "overview") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === "live-map") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><line x1="9" y1="3" x2="9" y2="18" stroke="currentColor" strokeWidth="1.8" /><line x1="15" y1="6" x2="15" y2="21" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === "vehicles") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 16.5V9.8a2 2 0 0 1 1.6-2l1.2-.25.8-2.05A2 2 0 0 1 10.47 4h3.06a2 2 0 0 1 1.87 1.5l.8 2.05 1.2.25a2 2 0 0 1 1.6 2v6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4 16.5h16M7.5 19.5h.01M16.5 19.5h.01M7 11h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  if (name === "routes") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 18h2a5 5 0 0 0 5-5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M18 10c0 4.5-6 10-6 10S6 14.5 6 10a6 6 0 1 1 12 0Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
