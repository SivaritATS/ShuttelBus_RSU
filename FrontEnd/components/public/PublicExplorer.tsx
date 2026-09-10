"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Route, RouteStop, Vehicle } from "@/types";

const RouteMap = dynamic(() => import("../map/RouteMap"), { ssr: false, loading: () => <div className="empty-state">กำลังโหลดแผนที่…</div> });
const VehicleMap = dynamic(() => import("../map/VehicleMap"), { ssr: false, loading: () => <div className="empty-state">กำลังโหลดแผนที่รถ…</div> });

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลจาก Backend ได้");
  return response.json();
}

export default function PublicExplorer() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingError, setTrackingError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVehicles = async () => {
    setTrackingLoading(true);
    setTrackingError("");
    try {
      setVehicles(await getJson<Vehicle[]>("/api/vehicles/locations"));
    } catch (reason) {
      setTrackingError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดตำแหน่งรถได้");
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    getJson<Route[]>("/api/routes?active=true")
      .then((data) => { setRoutes(data); setSelectedRoute(data[0] || null); })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    if (!selectedRoute) { setStops([]); return; }
    setLoading(true);
    getJson<RouteStop[]>(`/api/routes/${selectedRoute.id}/stops`)
      .then(setStops)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [selectedRoute]);

  return (
    <main>
      <section className="container public-hero">
        <div>
          <div className="eyebrow">University shuttle / public tracking</div>
          <h1 className="hero-title">Move through campus <span>with clarity.</span></h1>
          <p className="hero-copy">เลือกเส้นทางรถรับส่งมหาวิทยาลัยเพื่อดูจุดจอดทั้งหมดตามลำดับ พร้อมข้อมูลภาษาไทยและภาษาอังกฤษในมุมมองเดียว</p>
          <div className="hero-actions"><a className="button button-primary" href="#routes">สำรวจเส้นทาง</a><span className="hero-meta"><i className="live-pulse" />ข้อมูลจากระบบ Shuttle Bus RSU</span></div>
          <div className="hero-stats" aria-label="สรุปข้อมูลระบบ"><div className="hero-stat"><strong>{routes.length}</strong><span>เส้นทางที่เปิดให้บริการ</span></div><div className="hero-stat"><strong>{vehicles.length}</strong><span>รถที่มีตำแหน่งล่าสุด</span></div></div>
        </div>
        <div className="hero-card"><div className="hero-card-art"><div className="map-grid" /><span className="art-badge"><i className="live-pulse" />LIVE CAMPUS NETWORK</span><div className="route-line" /><i className="route-dot one" /><i className="route-dot two" /><i className="route-dot three" /><i className="vehicle-beacon" /><div className="art-label"><strong>Campus in motion</strong><small>One connected shuttle network</small></div></div></div>
      </section>

      <section id="tracking" className="container tracking-section">
        <div className="section-heading"><div><div className="eyebrow">Live vehicle tracking</div><h2>รถที่กำลังติดตาม</h2><p>ตำแหน่งล่าสุดจากข้อมูลที่ Admin อัปเดตในระบบ</p></div><div className="hero-actions"><span className="status active">{vehicles.length} tracked vehicles</span><button className="button button-secondary" type="button" onClick={loadVehicles} disabled={trackingLoading}>{trackingLoading ? "กำลังโหลด…" : "รีเฟรชข้อมูล"}</button></div></div>
        {trackingError && <div className="alert alert-error">{trackingError}</div>}
        {trackingLoading ? <div className="panel loading">กำลังโหลดตำแหน่งรถ…</div> : vehicles.length === 0 ? <div className="panel empty-state"><strong>ยังไม่มีรถที่มีพิกัดสำหรับติดตาม</strong><div className="stop-en">เมื่อ Admin เพิ่ม Latitude และ Longitude รถจะแสดงบนแผนที่หน้านี้</div></div> : <div className="tracking-grid"><div className="panel"><div className="vehicle-list">{vehicles.map((vehicle) => <div className="vehicle-item" key={vehicle.id}><span className="vehicle-dot" style={{ background: vehicle.route?.color || "#165dff" }} /><div><strong>{vehicle.name}</strong><div className="stop-en">{vehicle.route?.name || "ยังไม่ผูก Route"} · {vehicle.lastSeenAt ? `อัปเดต ${new Date(vehicle.lastSeenAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "ยังไม่มีเวลาอัปเดต"}</div></div><span className="coords">{Number(vehicle.latitude).toFixed(4)}, {Number(vehicle.longitude).toFixed(4)}</span></div>)}</div></div><div className="panel map-frame tracking-map"><VehicleMap vehicles={vehicles} /></div></div>}
      </section>

      <section id="routes" className="container">
        <div className="section-heading"><div><div className="eyebrow">Explore the network</div><h2>เส้นทางที่เปิดให้บริการ</h2><p>ข้อมูลถูกโหลดจาก Backend API โดยตรง</p></div><span className="status active">{routes.length} active routes</span></div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading && routes.length === 0 ? <div className="loading">กำลังโหลดเส้นทาง…</div> : <div className="route-selector">{routes.map((route) => <button type="button" aria-pressed={selectedRoute?.id === route.id} aria-label={`เลือกเส้นทาง ${route.name}`} className={`route-chip ${selectedRoute?.id === route.id ? "selected" : ""}`} key={route.id} onClick={() => { setSelectedRoute(route); setError(""); }}><span className="route-chip-head"><span>{route.name}</span><i className="route-swatch" style={{ background: route.color || "var(--blue)" }} /></span><small>{route._count?.routeStops || 0} stops</small></button>)}</div>}
      </section>

      <section className="container public-grid">
        <div className="panel"><h3 className="panel-title"><span>{selectedRoute?.name || "Route stops"}</span>{selectedRoute && <span className="route-swatch" style={{ background: selectedRoute.color || "var(--blue)" }} />}</h3>{loading && selectedRoute ? <div className="loading">กำลังโหลดจุดจอด…</div> : stops.length === 0 ? <div className="empty-state">ยังไม่มีจุดจอดในเส้นทางนี้</div> : <div className="stop-list">{stops.map(({ id, stopOrder, stop }) => <div className="stop-item" key={id}><span className="stop-number">{String(stopOrder).padStart(2, "0")}</span><div><div className="stop-name">{stop.nameTh}</div><div className="stop-en">{stop.nameEn || "English name unavailable"}</div></div><span className="coords">{Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}</span></div>)}</div>}</div>
        <div className="panel map-frame">{stops.length ? <RouteMap stops={stops} color={selectedRoute?.color || null} /> : <div className="empty-state">เลือกเส้นทางเพื่อดูแผนที่</div>}</div>
      </section>
      <footer className="container footer">Shuttle Bus RSU · Sprint 1 foundation · Built for a connected campus</footer>
    </main>
  );
}
