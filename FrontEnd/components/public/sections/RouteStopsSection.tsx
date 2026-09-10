"use client";

import dynamic from "next/dynamic";
import type { Route, RouteStop } from "@/types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), { ssr: false, loading: () => <div className="empty-state">กำลังโหลดแผนที่…</div> });

export function RouteStopsSection({ selectedRoute, stops, loading }: { selectedRoute: Route | null; stops: RouteStop[]; loading: boolean }) {
  return (
    <section className="container public-grid">
      <div className="panel"><h3 className="panel-title"><span>{selectedRoute?.name || "Route stops"}</span>{selectedRoute && <span className="route-swatch" style={{ background: selectedRoute.color || "var(--blue)" }} />}</h3>{loading && selectedRoute ? <div className="loading">กำลังโหลดจุดจอด…</div> : stops.length === 0 ? <div className="empty-state">ยังไม่มีจุดจอดในเส้นทางนี้</div> : <div className="stop-list">{stops.map(({ id, stopOrder, stop }) => <div className="stop-item" key={id}><span className="stop-number">{String(stopOrder).padStart(2, "0")}</span><div><div className="stop-name">{stop.nameTh}</div><div className="stop-en">{stop.nameEn || "English name unavailable"}</div></div><span className="coords">{Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}</span></div>)}</div>}</div>
      <div className="panel map-frame">{stops.length ? <RouteMap stops={stops} color={selectedRoute?.color || null} /> : <div className="empty-state">เลือกเส้นทางเพื่อดูแผนที่</div>}</div>
    </section>
  );
}
