"use client";

import dynamic from "next/dynamic";
import type { Vehicle } from "@/types";

const VehicleMap = dynamic(() => import("@/components/map/VehicleMap"), { ssr: false, loading: () => <div className="empty-state">กำลังโหลดแผนที่รถ…</div> });

export function LiveVehicleTrackingSection({ vehicles, loading, error, onRefresh }: { vehicles: Vehicle[]; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <section id="tracking" className="container tracking-section">
      <div className="section-heading"><div><div className="eyebrow">Live vehicle tracking</div><h2>รถที่กำลังติดตาม</h2><p>ตำแหน่งล่าสุดจากข้อมูลที่ Admin อัปเดตในระบบ</p></div><div className="hero-actions"><span className="status active">{vehicles.length} tracked vehicles</span><button className="button button-secondary" type="button" onClick={onRefresh} disabled={loading}>{loading ? "กำลังโหลด…" : "รีเฟรชข้อมูล"}</button></div></div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <div className="panel loading">กำลังโหลดตำแหน่งรถ…</div> : vehicles.length === 0 ? <div className="panel empty-state"><strong>ยังไม่มีรถที่มีพิกัดสำหรับติดตาม</strong><div className="stop-en">เมื่อ Admin เพิ่ม Latitude และ Longitude รถจะแสดงบนแผนที่หน้านี้</div></div> : <div className="tracking-grid"><div className="panel"><div className="vehicle-list">{vehicles.map((vehicle) => <div className="vehicle-item" key={vehicle.id}><span className="vehicle-dot" style={{ background: vehicle.route?.color || "#165dff" }} /><div><strong>{vehicle.name}</strong><div className="stop-en">{vehicle.route?.name || "ยังไม่ผูก Route"} · {vehicle.lastSeenAt ? `อัปเดต ${new Date(vehicle.lastSeenAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "ยังไม่มีเวลาอัปเดต"}</div></div><span className="coords">{Number(vehicle.latitude).toFixed(4)}, {Number(vehicle.longitude).toFixed(4)}</span></div>)}</div></div><div className="panel map-frame tracking-map"><VehicleMap vehicles={vehicles} /></div></div>}
    </section>
  );
}
