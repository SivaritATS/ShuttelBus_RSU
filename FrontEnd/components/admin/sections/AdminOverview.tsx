import type { Route, Stop, Vehicle } from "@/types";

export function AdminOverview({ routes, vehicles, stops, onRoutes }: { routes: Route[]; vehicles: Vehicle[]; stops: Stop[]; onRoutes: () => void }) {
  return (
    <>
      <div className="metrics">
        <div className="metric"><div className="metric-label">Active routes</div><div className="metric-value">{routes.filter((item) => item.isActive).length}</div></div>
        <div className="metric"><div className="metric-label">Active vehicles</div><div className="metric-value">{vehicles.filter((item) => item.isActive).length}</div></div>
        <div className="metric"><div className="metric-label">Mapped stops</div><div className="metric-value">{stops.length}</div></div>
      </div>
      <div className="panel">
        <div className="section-heading" style={{ marginTop: 0 }}>
          <div><h2>Route coverage</h2><p>เส้นทางที่ Backend พร้อมให้ Public Web ใช้งาน</p></div>
          <button type="button" className="button button-secondary" onClick={onRoutes}>Manage routes →</button>
        </div>
        <div className="stop-list">
          {routes.map((route) => (
            <div className="stop-item" key={route.id}>
              <i className="route-swatch" style={{ background: route.color || "var(--blue)" }} />
              <div><div className="stop-name">{route.name}</div><div className="stop-en">{route._count?.routeStops || 0} stops · {route._count?.vehicles || 0} vehicles</div></div>
              <span className={`status ${route.isActive ? "active" : "inactive"}`}>{route.isActive ? "Active" : "Draft"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
