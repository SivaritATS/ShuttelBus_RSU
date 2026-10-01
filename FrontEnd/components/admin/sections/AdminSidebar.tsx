"use client";

import type { AdminTab } from "../admin-types";

const tabLabel: Record<AdminTab, string> = {
  overview: "Overview",
  "live-map": "Live Map & Trips",
  vehicles: "Vehicles",
  routes: "Routes",
  stops: "Stops",
};

export function AdminSidebar({ tab, onTabChange, onReset }: { tab: AdminTab; onTabChange: (tab: AdminTab) => void; onReset: () => void }) {
  return (
    <aside className="admin-sidebar">
      <h1>Operations</h1>
      <p>Campus transport control room</p>
      <nav className="side-nav">
        {(Object.keys(tabLabel) as AdminTab[]).map((item) => (
          <button
            type="button"
            key={item}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => { onTabChange(item); onReset(); }}
          >
            <NavIcon name={item} />
            {tabLabel[item]}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function getAdminTabLabel(tab: AdminTab) {
  return tabLabel[tab];
}

function NavIcon({ name }: { name: AdminTab }) {
  if (name === "overview") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === "live-map") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><line x1="9" y1="3" x2="9" y2="18" stroke="currentColor" strokeWidth="1.8" /><line x1="15" y1="6" x2="15" y2="21" stroke="currentColor" strokeWidth="1.8" /></svg>;
  if (name === "vehicles") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 16.5V9.8a2 2 0 0 1 1.6-2l1.2-.25.8-2.05A2 2 0 0 1 10.47 4h3.06a2 2 0 0 1 1.87 1.5l.8 2.05 1.2.25a2 2 0 0 1 1.6 2v6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4 16.5h16M7.5 19.5h.01M16.5 19.5h.01M7 11h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  if (name === "routes") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 18h2a5 5 0 0 0 5-5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M18 10c0 4.5-6 10-6 10S6 14.5 6 10a6 6 0 1 1 12 0Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
