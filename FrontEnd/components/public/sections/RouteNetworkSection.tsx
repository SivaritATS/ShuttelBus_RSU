import type { Route } from "@/types";

export function RouteNetworkSection({ routes, selectedRoute, loading, error, onSelect }: { routes: Route[]; selectedRoute: Route | null; loading: boolean; error: string; onSelect: (route: Route) => void }) {
  return (
    <section id="routes" className="container">
      <div className="section-heading"><div><div className="eyebrow">Explore the network</div><h2>เส้นทางที่เปิดให้บริการ</h2><p>ข้อมูลถูกโหลดจาก Backend API โดยตรง</p></div><span className="status active">{routes.length} active routes</span></div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && routes.length === 0 ? <div className="loading">กำลังโหลดเส้นทาง…</div> : <div className="route-selector">{routes.map((route) => <button type="button" aria-pressed={selectedRoute?.id === route.id} aria-label={`เลือกเส้นทาง ${route.name}`} className={`route-chip ${selectedRoute?.id === route.id ? "selected" : ""}`} key={route.id} onClick={() => onSelect(route)}><span className="route-chip-head"><span>{route.name}</span><i className="route-swatch" style={{ background: route.color || "var(--blue)" }} /></span><small>{route._count?.routeStops || 0} stops</small></button>)}</div>}
    </section>
  );
}
