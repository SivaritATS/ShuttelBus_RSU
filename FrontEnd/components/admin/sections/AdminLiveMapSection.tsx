"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Route, RouteStop, Stop, Vehicle, Trip } from "@/types";

const CampusLiveMap = dynamic(() => import("@/components/map/CampusLiveMap"), {
  ssr: false,
  loading: () => <div className="loading">กำลังเตรียมแผนที่ควบคุม Admin…</div>,
});

export function AdminLiveMapSection({
  routes,
  vehicles,
  stops,
  activeTrips,
  isSocketConnected,
  onStartTrip,
  onEndTrip,
  onSimulateMove,
}: {
  routes: Route[];
  vehicles: Vehicle[];
  stops: Stop[];
  activeTrips: Trip[];
  isSocketConnected: boolean;
  onStartTrip: (vehicleId: number, routeId: number) => Promise<void>;
  onEndTrip: (tripId: number) => Promise<void>;
  onSimulateMove: (vehicleId: number) => void;
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;

  // ค้นหา routeStops หรือ geometry สำหรับสายที่เลือก
  const currentRouteStops: RouteStop[] = (selectedRoute?.routeStops as RouteStop[]) || [];

  return (
    <div className="admin-map-dashboard">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">Realtime Operations Center</div>
          <h1>แผนที่และสถานะเดินรถ (Live Fleet & Trips)</h1>
          <p>
            ตรวจสอบตำแหน่งรถรางและทริปที่กำลังปฏิบัติการแบบ Realtime ผ่าน Socket.IO
          </p>
        </div>
        <div className="hero-actions">
          <span className={`status ${isSocketConnected ? "active" : "inactive"}`}>
            <span className={`status-indicator-dot ${isSocketConnected ? "live" : "sync"}`} style={{ marginRight: 6 }} />
            {isSocketConnected ? "Socket Connected" : "Reconnecting…"}
          </span>
        </div>
      </div>

      {/* Control Bar สำหรับเลือกสายในหน้า Admin */}
      <div className="portal-controls-bar" style={{ borderRadius: 14, marginBottom: 20, position: "static" }}>
        <div className="controls-flex" style={{ padding: "0 10px" }}>
          <div className="route-pills-wrap">
            <span className="control-label">สายรถ:</span>
            <button
              type="button"
              className={`route-pill ${selectedRouteId === null ? "active" : ""}`}
              onClick={() => { setSelectedRouteId(null); setFocusTarget(null); }}
            >
              <span>ทุกเส้นทาง</span>
            </button>
            {routes.map((route) => (
              <button
                type="button"
                key={route.id}
                className={`route-pill ${selectedRouteId === route.id ? "active" : ""}`}
                onClick={() => setSelectedRouteId(route.id)}
                style={{
                  borderColor: selectedRouteId === route.id ? (route.color || "#165dff") : undefined,
                }}
              >
                <span className="pill-dot" style={{ background: route.color || "#165dff" }} />
                <span>{route.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="button-reset-view"
            onClick={() => setFocusTarget(null)}
          >
            รีเซ็ตมุมมอง
          </button>
        </div>
      </div>

      {/* แผนที่หลักใน Admin */}
      <div className="map-outer-card" style={{ marginBottom: 24 }}>
        <CampusLiveMap
          stops={stops}
          routeStops={currentRouteStops}
          vehicles={vehicles}
          selectedRoute={selectedRoute}
          focusTarget={focusTarget}
          showStops={true}
          showVehicles={true}
          showRouteLine={true}
          onSelectVehicle={(v) => {
            if (v.latitude && v.longitude) {
              setFocusTarget([Number(v.latitude), Number(v.longitude)]);
            }
          }}
          onSelectStop={(s) => {
            if (s.latitude && s.longitude) {
              setFocusTarget([Number(s.latitude), Number(s.longitude)]);
            }
          }}
        />
      </div>

      {/* Grid จัดการ Active Trips & Vehicle Controls */}
      <div className="data-grid">
        {/* แผงที่ 1: รายการทริปที่กำลังวิ่ง (Active Trips) */}
        <div className="data-panel">
          <div className="data-panel-head">
            <div>
              <h3 className="panel-heading">
                <span className="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                ทริปที่กำลังดำเนินการ ({activeTrips.length})
              </h3>
              <p className="panel-sub">สถานะการเดินรถที่กำลังบันทึกพิกัด</p>
            </div>
          </div>

          {activeTrips.length === 0 ? (
            <div className="empty-box">
              <p>ขณะนี้ไม่มีทริปที่กำลังเดินรถ</p>
              <small>สามารถเลือกเริ่มทริปใหม่ได้จากแผงควบคุมรถด้านขวา</small>
            </div>
          ) : (
            <div className="vehicle-card-list">
              {activeTrips.map((trip) => (
                <div key={trip.id} className="vehicle-info-card">
                  <div className="vehicle-card-top">
                    <div>
                      <strong className="vehicle-title">{trip.vehicle?.name}</strong>
                      <div className="vehicle-type-tag">
                        สาย: <strong>{trip.route?.name}</strong> · เริ่มเมื่อ{" "}
                        {trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString("th-TH") : "-"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button button-danger"
                      style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
                      onClick={() => onEndTrip(trip.id)}
                    >
                      จบทริป (End Trip)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* แผงที่ 2: ควบคุมและทดสอบส่งพิกัดรถ (Vehicle Fleet & Simulator) */}
        <div className="data-panel">
          <div className="data-panel-head">
            <div>
              <h3 className="panel-heading">
                <span className="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="15" rx="3" />
                    <path d="M3 11h18M7 15h.01M17 15h.01M5 18v2M19 18v2" />
                  </svg>
                </span>
                ควบคุมยานพาหนะ ({vehicles.length})
              </h3>
              <p className="panel-sub">เริ่มทริปใหม่ หรือจำลองส่งพิกัด GPS แบบ Realtime</p>
            </div>
          </div>

          <div className="vehicle-card-list">
            {vehicles.map((v) => {
              const activeTrip = activeTrips.find((t) => t.vehicleId === v.id);

              return (
                <div key={v.id} className="vehicle-info-card">
                  <div className="vehicle-card-top">
                    <div>
                      <strong className="vehicle-title">{v.name}</strong>
                      <div className="vehicle-type-tag">
                        {v.type || "รถราง"} · {v.route?.name || "ยังไม่ผูกสาย"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {activeTrip ? (
                        <span className="status active" style={{ fontSize: 11 }}>
                          กำลังวิ่ง (Trip #{activeTrip.id})
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                          onClick={() => {
                            const defaultRouteId = v.routeId || routes[0]?.id;
                            if (defaultRouteId) onStartTrip(v.id, defaultRouteId);
                          }}
                        >
                          เริ่มทริป (Start)
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ minHeight: 30, padding: "4px 8px", fontSize: 11 }}
                        onClick={() => onSimulateMove(v.id)}
                        title="จำลองส่งพิกัด GPS ขยับรถไปข้างหน้า"
                      >
                        จำลอง GPS
                      </button>
                    </div>
                  </div>
                  <div className="vehicle-card-bottom">
                    <span className="vehicle-coords">
                      GPS: {v.latitude ? Number(v.latitude).toFixed(6) : "N/A"},{" "}
                      {v.longitude ? Number(v.longitude).toFixed(6) : "N/A"}
                    </span>
                    <span className="vehicle-time">
                      {v.lastSeenAt ? `อัปเดต ${new Date(v.lastSeenAt).toLocaleTimeString("th-TH")}` : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
