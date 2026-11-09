"use client";

import Link from "next/link";
import type { Route, Stop, Vehicle } from "@/types";
import { useLanguage } from "@/lib/languageContext";

        export function AdminOverview({routes, vehicles, stops, onRoutes}: {routes: Route[]; vehicles: Vehicle[]; stops: Stop[]; onRoutes?: () => void }) {
  const {lang, t} = useLanguage();

        return (
    <>
          <div className="metrics">
            <div className="metric">
              <div className="metric-label">{t("adminActiveRoutes")}</div>
              <div className="metric-value">{routes.filter((item) => item.isActive).length}</div>
            </div>
                <div className="metric">
                  <div className="metric-label">{t("adminActiveVehicles")}</div>
                  <div className="metric-value">{vehicles.filter((item) => item.isActive).length}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">{t("adminMappedStops")}</div>
                  <div className="metric-value">{stops.length}</div>
                </div>
              </div>
              <div className="panel">
                <div className="section-heading" style={{ marginTop: 0 }}>
                  <div>
                    <h2>{t("adminRouteCoverage")}</h2>
                    <p>{t("adminRouteCoverageSub")}</p>
                  </div>
          <Link href="/admin/routes" className="button button-secondary">
            {t("adminManageRoutes")}
          </Link>
        </div>
        <div className="stop-list">
          {routes.map((route) => (
            <div className="stop-item" key={route.id}>
              <i className="route-swatch" style={{ background: route.color || "var(--blue)" }} />
              <div>
                <div className="stop-name">{route.name}</div>
                <div className="stop-en">
                  {route._count?.routeStops || 0} {lang === "en" ? "stops" : "จุดจอด"} · {route._count?.vehicles || 0} {lang === "en" ? "vehicles" : "คัน"}
                </div>
              </div>
              <span className={`status ${route.isActive ? "active" : "inactive"}`}>
                {route.isActive ? (lang === "en" ? "Active" : "เปิดใช้งาน") : (lang === "en" ? "Draft" : "แบบร่าง")}
              </span>
            </div>
                    ))}
                  </div>
              </div>
            </>
            );
}
