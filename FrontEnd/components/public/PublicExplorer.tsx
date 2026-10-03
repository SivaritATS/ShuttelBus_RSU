"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Route, RouteStop, Stop, Vehicle } from "@/types";
import { useRealtimeSocket } from "@/lib/useSocket";
import { MOCK_STOPS, MOCK_ROUTES, MOCK_VEHICLES, getRoutesWithGeometry } from "@mockup/mockData";

// โหลด CampusLiveMap แบบ dynamic เพื่อหลีกเลี่ยง Leaflet window error ใน SSR
const CampusLiveMap = dynamic(
  () => import("@/components/map/CampusLiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-placeholder">
        <div className="spinner" />
        <p>กำลังเตรียมแผนที่ดาวเทียม มหาวิทยาลัยรังสิต…</p>
      </div>
    ),
  }
);

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลจากระบบได้");
  return response.json();
}

export default function PublicExplorer() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Realtime Socket Callback
  const handleRealtimeLocation = useCallback((incomingVehicle: Vehicle) => {
    setVehicles((prev) => {
      const idx = prev.findIndex((v) => v.id === incomingVehicle.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incomingVehicle };
        return copy;
      }
      return [...prev, incomingVehicle];
    });
    setLastUpdated(new Date());
  }, []);

  const handleTripChange = useCallback((data: { event: string; trip: any }) => {
    console.log("[Realtime] Trip change event:", data);
    // รีเฟรชตำแหน่งรถเมื่อมีทริปใหม่หรือจบทริป
    loadVehicles();
  }, []);

  // เชื่อมต่อ Socket.IO ห้อง public
  const { isConnected: isSocketConnected } = useRealtimeSocket({
    room: "public",
    onLocationUpdate: handleRealtimeLocation,
    onTripChange: handleTripChange,
  });

  // Layer Controls
  const [showStops, setShowStops] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRouteLine, setShowRouteLine] = useState(true);

  // Search & Focus
  const [searchQuery, setSearchQuery] = useState("");
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);
  const [activeItemName, setActiveItemName] = useState<string>("");

  // โหลดตำแหน่งรถราง (Live Vehicles) ผ่าน REST API เป็น Fallback
  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const data = await getJson<Vehicle[]>("/api/vehicles/locations");
      setVehicles(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  // โหลด Routes และ Stops เริ่มต้น
  useEffect(() => {
    Promise.all([
      getJson<Route[]>("/api/routes?active=true"),
      getJson<Stop[]>("/api/stops?active=true"),
      getJson<Vehicle[]>("/api/vehicles/locations"),
    ])
      .then(([routesData, stopsData, vehiclesData]) => {
        const finalRoutes = routesData && routesData.length > 0 ? routesData : (getRoutesWithGeometry() as unknown as Route[]);
        const finalStops = stopsData && stopsData.length > 0 ? stopsData : (MOCK_STOPS as unknown as Stop[]);
        const finalVehicles = vehiclesData && vehiclesData.length > 0 ? vehiclesData : (MOCK_VEHICLES as unknown as Vehicle[]);

        setRoutes(finalRoutes);
        setAllStops(finalStops);
        setVehicles(finalVehicles);
        if (finalRoutes.length > 0) {
          setSelectedRoute(finalRoutes[0]);
        }
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.warn("[PublicExplorer] Database API unreachable, loading offline mock campus dataset:", err);
        const fallbackRoutes = getRoutesWithGeometry() as unknown as Route[];
        setRoutes(fallbackRoutes);
        setAllStops(MOCK_STOPS as unknown as Stop[]);
        setVehicles(MOCK_VEHICLES as unknown as Vehicle[]);
        if (fallbackRoutes.length > 0) {
          setSelectedRoute(fallbackRoutes[0]);
        }
        setLastUpdated(new Date());
      })
      .finally(() => {
        setLoading(false);
        setMounted(true);
      });
  }, []);

  // Auto-refresh ตำแหน่งรถรางทุกๆ 12 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      loadVehicles();
    }, 12000);
    return () => clearInterval(timer);
  }, [loadVehicles]);

  // โหลด RouteStops เมื่อมีการเปลี่ยน Route
  useEffect(() => {
    if (!selectedRoute) {
      setRouteStops([]);
      return;
    }
    getJson<RouteStop[]>(`/api/routes/${selectedRoute.id}/stops`)
      .then((data) => {
        if (data && data.length > 0) {
          setRouteStops(data);
        } else if ((selectedRoute as any).routeStops) {
          setRouteStops((selectedRoute as any).routeStops);
        }
      })
      .catch(() => {
        if ((selectedRoute as any).routeStops) {
          setRouteStops((selectedRoute as any).routeStops);
        }
      });
  }, [selectedRoute]);

  // รายชื่อจุดจอดที่จะส่งเข้า Map (ถ้าเลือก Route ให้ใช้ป้ายตาม Route ถ้าไม่ ให้ใช้ทั้งหมด)
  const displayStopsForMap = useMemo(() => {
    if (selectedRoute && routeStops.length > 0) {
      return routeStops.map((rs) => rs.stop);
    }
    return allStops;
  }, [selectedRoute, routeStops, allStops]);

  // การกรองจุดจอดตาม Search Query รองรับชื่อไทย อังกฤษ หมายเลขตึก และคีย์เวิร์ด
  const filteredStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayStopsForMap;
    return displayStopsForMap.filter((s) => {
      const nameThMatch = s.nameTh.toLowerCase().includes(q);
      const nameEnMatch = s.nameEn ? s.nameEn.toLowerCase().includes(q) : false;
      const idMatch = s.id.toString() === q;
      const buildingMatch = (s as any).building ? (s as any).building.toLowerCase().includes(q) : false;
      const keywordsMatch = Array.isArray((s as any).searchKeywords)
        ? (s as any).searchKeywords.some((k: string) => k.toLowerCase().includes(q))
        : false;
      return nameThMatch || nameEnMatch || idMatch || buildingMatch || keywordsMatch;
    });
  }, [displayStopsForMap, searchQuery]);

  // ฟังก์ชันโฟกัสไปยังจุดจอด
  const handleFocusStop = (stop: Stop) => {
    const lat = Number(stop.latitude);
    const lng = Number(stop.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setFocusTarget([lat, lng]);
      setActiveItemName(stop.nameTh);
      // เลื่อนจอขึ้นมาหาแผนที่อย่างนุ่มนวล
      const mapEl = document.getElementById("main-map-section");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // ฟังก์ชันโฟกัสไปยังรถ
  const handleFocusVehicle = (vehicle: Vehicle) => {
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setFocusTarget([lat, lng]);
      setActiveItemName(vehicle.name);
      const mapEl = document.getElementById("main-map-section");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // รีเซ็ตมุมมองแผนที่
  const handleResetMap = () => {
    setFocusTarget(null);
    setActiveItemName("");
  };

  return (
    <main className="public-portal">
      {/* 1. Header แถบควบคุมและสรุปสถานะแบบ Compact */}
      <section className="portal-header-bar">
        <div className="container-wide header-content-grid">
          <div>
            <div className="eyebrow-badge">
              <span className="live-pulse" />
              RSU CAMPUS REAL-TIME TRANSIT
            </div>
            <h1 className="portal-title">
              แผนที่ติดตามรถราง <span>ม.รังสิต</span>
            </h1>
            <p className="portal-desc">
              ระบบแสดงตำแหน่งรถรางไฟฟ้าและพิกัดจุดจอด 14 อาคารภายในมหาวิทยาลัยรังสิตแบบสด
            </p>
          </div>

          <div className="portal-stats-group">
            <div className="stat-card">
              <span className="stat-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="15" rx="3" />
                  <path d="M3 11h18M7 15h.01M17 15h.01M5 18v2M19 18v2" />
                </svg>
              </span>
              <div>
                <strong className="stat-num">{vehicles.length} คัน</strong>
                <span className="stat-label">รถรางที่กำลังวิ่ง</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </span>
              <div>
                <strong className="stat-num">{allStops.length} จุด</strong>
                <span className="stat-label">ป้ายรถรอบ ม.</span>
              </div>
            </div>

            <div className="stat-card refresh-card">
              <button
                type="button"
                className="button-refresh"
                onClick={loadVehicles}
                disabled={vehiclesLoading}
                title="คลิกเพื่ออัปเดตตำแหน่งรถทันที"
              >
                <svg
                  className={vehiclesLoading ? "spin" : ""}
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                </svg>
                {vehiclesLoading ? "กำลังอัปเดต…" : "รีเฟรชตำแหน่ง"}
              </button>
              <span className="last-updated-text" suppressHydrationWarning>
                <span className={`status-indicator-dot ${isSocketConnected ? "live" : "sync"}`} />
                {isSocketConnected ? "Realtime สด" : "Polling"} · {mounted ? lastUpdated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Route Selector & Controls Bar */}
      <section className="portal-controls-bar">
        <div className="container-wide controls-flex">
          {/* ตัวเลือกสายรถ */}
          <div className="route-pills-wrap">
            <span className="control-label">สายรถราง:</span>
            <button
              type="button"
              className={`route-pill ${selectedRoute === null ? "active" : ""}`}
              onClick={() => setSelectedRoute(null)}
            >
              <span>ทั้งหมด (14 อาคาร)</span>
            </button>
            {routes.map((route) => (
              <button
                type="button"
                key={route.id}
                className={`route-pill ${selectedRoute?.id === route.id ? "active" : ""}`}
                onClick={() => setSelectedRoute(route)}
                style={{
                  borderColor: selectedRoute?.id === route.id ? (route.color || "#165dff") : undefined,
                }}
              >
                <span
                  className="pill-dot"
                  style={{ background: route.color || "#165dff" }}
                />
                <span>{route.name}</span>
                {route._count?.routeStops ? (
                  <small className="pill-badge">{route._count.routeStops} ป้าย</small>
                ) : null}
              </button>
            ))}
          </div>

          {/* สวิตช์เปิดปิดเลเยอร์ และปุ่ม Reset */}
          <div className="layer-toggles">
            <label className="toggle-chip">
              <input
                type="checkbox"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
              />
              <span>รถราง</span>
            </label>
            <label className="toggle-chip">
              <input
                type="checkbox"
                checked={showStops}
                onChange={(e) => setShowStops(e.target.checked)}
              />
              <span>ป้ายหยุด</span>
            </label>
            <label className="toggle-chip">
              <input
                type="checkbox"
                checked={showRouteLine}
                onChange={(e) => setShowRouteLine(e.target.checked)}
              />
              <span>เส้นทาง</span>
            </label>
            <button
              type="button"
              className="button-reset-view"
              onClick={handleResetMap}
              title="ดูภาพรวมทั้งมหาวิทยาลัย"
            >
              ภาพรวม ม.รังสิต
            </button>
          </div>
        </div>
      </section>

      {/* 3. Centerpiece Main Campus Map (แผนที่ขนาดใหญ่ เด่น สะอาดตาที่สุด) */}
      <section id="main-map-section" className="portal-map-section">
        <div className="container-wide">
          <div className="map-outer-card">
            {activeItemName && (
              <div className="focus-indicator-banner">
                <span>กำลังโฟกัส: <strong>{activeItemName}</strong></span>
                <button
                  type="button"
                  onClick={handleResetMap}
                  className="button-clear-focus"
                >
                  ✕ ยกเลิก
                </button>
              </div>
            )}
            <CampusLiveMap
              stops={displayStopsForMap}
              routeStops={routeStops}
              vehicles={vehicles}
              selectedRoute={selectedRoute}
              focusTarget={focusTarget}
              showStops={showStops}
              showVehicles={showVehicles}
              showRouteLine={showRouteLine}
              onSelectStop={handleFocusStop}
              onSelectVehicle={handleFocusVehicle}
            />
          </div>
        </div>
      </section>

      {/* 4. Quick Access Panels (ข้อมูลรถราง & รายชื่อ 14 อาคาร) */}
      <section className="portal-data-section">
        <div className="container-wide data-grid">
          {/* แผงที่ 1: สถานะรถรางไฟฟ้า */}
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
                  รถรางที่กำลังให้บริการ
                </h3>
                <p className="panel-sub">
                  {vehicles.length > 0
                    ? `พบรถรางกำลังปฏิบัติการ ${vehicles.length} คัน`
                    : "ไม่มีรถรางที่เปิดระบบ GPS ในขณะนี้"}
                </p>
              </div>
              <span className="badge-live-count">{vehicles.length} LIVE</span>
            </div>

            {vehicles.length === 0 ? (
              <div className="empty-box">
                <p>ยังไม่มีรถรางที่ส่งพิกัดในระบบ</p>
                <small>เมื่อมีรถเปิดเดินเครื่อง ตำแหน่งจะปรากฏบนแผนที่ทันที</small>
              </div>
            ) : (
              <div className="vehicle-card-list">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="vehicle-info-card"
                    onClick={() => handleFocusVehicle(v)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="vehicle-card-top">
                      <div className="vehicle-title-wrap">
                        <span
                          className="vehicle-color-bar"
                          style={{ background: v.route?.color || "#165dff" }}
                        />
                        <div>
                          <strong className="vehicle-title">{v.name}</strong>
                          <div className="vehicle-type-tag">
                            {v.type || "รถรางไฟฟ้า"} · {v.route?.name || "สายทั่วไป"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-locate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusVehicle(v);
                        }}
                      >
                        โฟกัสบนแผนที่
                      </button>
                    </div>

                    <div className="vehicle-card-bottom">
                      <div className="vehicle-coords">
                        GPS: {Number(v.latitude).toFixed(6)}, {Number(v.longitude).toFixed(6)}
                      </div>
                      <div className="vehicle-time">
                        {v.lastSeenAt
                          ? `อัปเดต ${new Date(v.lastSeenAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`
                          : "อัปเดตล่าสุด"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* แผงที่ 2: พิกัดจุดจอด 14 อาคารใน ม.รังสิต */}
          <div className="data-panel">
            <div className="data-panel-head">
              <div>
                <h3 className="panel-heading">
                  <span className="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </span>
                  จุดจอดและอาคารในมหาวิทยาลัย
                </h3>
                <p className="panel-sub">
                  พิกัด 14 อาคารตามแนวเส้นทางรถราง (คลิกเพื่อเลื่อนดูบนแผนที่)
                </p>
              </div>
              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อตึก / อาคาร…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-search"
                />
              </div>
            </div>

            <div className="stops-scroll-list">
              {filteredStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="stop-row"
                  onClick={() => handleFocusStop(stop)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stop-num-badge">{index + 1}</div>
                  <div className="stop-text-col">
                    <strong className="stop-th">{stop.nameTh}</strong>
                    <span className="stop-en-sub">{stop.nameEn || "RSU Campus"}</span>
                  </div>
                  <div className="stop-coords-col">
                    <code>
                      {Number(stop.latitude).toFixed(6)}, {Number(stop.longitude).toFixed(6)}
                    </code>
                    <span className="btn-locate-text">คลิกเพื่อดู ↗</span>
                  </div>
                </div>
              ))}

              {filteredStops.length === 0 && (
                <div className="empty-box">
                  <p>ไม่พบอาคารที่ตรงกับ "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="portal-footer">
        <div className="container-wide footer-inner">
          <div>
            <strong>มหาวิทยาลัยรังสิต (Rangsit University)</strong> · บริการรถรางรับส่งภายในวิทยาเขต
          </div>
          <div className="footer-links">
            <span>อิงพิกัดทางเข้า-ออก และตึก 2-19 ครบ 14 จุด</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
