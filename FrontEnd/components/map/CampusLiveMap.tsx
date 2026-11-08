"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Route, RouteStop, Stop, Vehicle } from "@/types";
import { useLanguage } from "@/lib/languageContext";

const RSU_CAMPUS_CENTER: [number, number] = [13.9658, 100.5860];
const DEFAULT_ZOOM = 16;

// กรองจุดพิกัดในซอย/ทางเดินที่รถรางจริงไม่วิ่ง (2 เส้นตัดขวางที่ผู้ใช้ระบุ)
function isProhibitedCampusSegment(lat: number, lng: number): boolean {
  // เส้นบน: ซอยข้างตึก 10 และ 11 / ลานจอดรถ
  if (lat >= 13.9663 && lat <= 13.9672 && lng >= 100.5858 && lng <= 100.5868) return true;
  // เส้นล่าง: ทางเดินข้างสระน้ำ / หน้าตึก 1
  if (lat >= 13.9650 && lat <= 13.9656 && lng >= 100.5861 && lng <= 100.5873) return true;
  return false;
}

function sanitizeCoords(coords: [number, number][]): [number, number][] {
  return coords.filter((pt) => !isProhibitedCampusSegment(pt[0], pt[1]));
}

function MapController({
  focusTarget,
  fitStops,
  followedVehicleId,
  selectedRouteId,
}: {
  focusTarget: [number, number] | null;
  fitStops: Stop[];
  followedVehicleId?: number | null;
  selectedRouteId?: number | null;
}) {
  const map = useMap();
  const prevRouteIdRef = useRef<number | null | undefined>(undefined);
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (focusTarget) {
      const currentZoom = map.getZoom();
      if (currentZoom < 15) {
        map.flyTo(focusTarget, 17, { duration: 1.2 });
      } else {
        map.panTo(focusTarget, { animate: true, duration: 0.8 });
      }
    }
  }, [focusTarget, map]);

  useEffect(() => {
    const routeChanged = prevRouteIdRef.current !== selectedRouteId;
    prevRouteIdRef.current = selectedRouteId;

    if (!focusTarget && !followedVehicleId && fitStops.length > 0) {
      if (!initialFitDone.current || routeChanged) {
        const bounds = fitStops.map(
          (s) => [Number(s.latitude), Number(s.longitude)] as [number, number]
        );
        if (bounds.length === 1) {
          map.panTo(bounds[0], { animate: true, duration: 0.8 });
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
        }
        initialFitDone.current = true;
      }
    }
  }, [fitStops, focusTarget, followedVehicleId, selectedRouteId, map]);

  return null;
}

interface CampusLiveMapProps {
  stops: Stop[];
  routeStops: RouteStop[];
  vehicles: Vehicle[];
  selectedRoute: Route | null;
  focusTarget: [number, number] | null;
  followedVehicleId?: number | null;
  showStops?: boolean;
  showVehicles?: boolean;
  showRouteLine?: boolean;
  onSelectStop?: (stop: Stop) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export default function CampusLiveMap({
  stops,
  routeStops,
  vehicles,
  selectedRoute,
  focusTarget,
  followedVehicleId,
  showStops = true,
  showVehicles = true,
  showRouteLine = true,
  onSelectStop,
  onSelectVehicle,
}: CampusLiveMapProps) {
  const { lang } = useLanguage();
  // สร้าง icon สำหรับรถราง (รองรับทั้งสถานะ Live GPS คนขับ และ สแตนด์บาย)
  const getVehicleIcon = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return (color: string, isLive: boolean) => {
      const key = `${color}_${isLive}`;
      if (cache.has(key)) return cache.get(key)!;

      const icon = L.divIcon({
        className: `custom-tram-icon ${isLive ? "is-live" : "is-standby"}`,
        html: `
          <div class="tram-marker-wrap ${isLive ? "live-pulse-active" : "standby-mode"}">
            ${isLive ? `<span class="tram-pulse-ring" style="border-color: ${color};"></span>` : ""}
            <div class="tram-marker-body" style="background: ${isLive ? color : "#64748b"}; border-color: ${isLive ? "#ffffff" : "#cbd5e1"};">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
              </svg>
            </div>
            <span class="tram-marker-label ${isLive ? "label-live" : "label-standby"}">${isLive ? "LIVE สด" : "Standby"}</span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

      cache.set(key, icon);
      return icon;
    };
  }, []);

  // สร้าง icon สำหรับป้ายรถพร้อมหมายเลข
  const stopIcons = useMemo(() => {
    const cache = new Map<number, L.DivIcon>();
    return (num: number) => {
      if (cache.has(num)) return cache.get(num)!;
      const icon = L.divIcon({
        className: "custom-stop-icon",
        html: `
          <div class="stop-marker-wrap">
            <div class="stop-marker-pin">
              <span class="stop-marker-num">${num}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -30],
      });
      cache.set(num, icon);
      return icon;
    };
  }, []);

  // สถานะเก็บพิกัดถนนที่คำนวณแบบ Dynamic ผ่าน OSRM ตามจุดจอดจริง
  const [dynamicRoadCoords, setDynamicRoadCoords] = useState<[number, number][] | null>(null);

  // คำนวณเส้นทางตามแนวถนนจริงผ่าน OSRM อัตโนมัติเมื่อสายรถมีการกำหนดจุดจอด
  useEffect(() => {
    if (!showRouteLine || routeStops.length < 2) {
      setDynamicRoadCoords(null);
      return;
    }

    let isCancelled = false;
    const fetchOSRMRoute = async () => {
      try {
        const coordsStr = routeStops
          .map((rs) => `${Number(rs.stop.longitude)},${Number(rs.stop.latitude)}`)
          .join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&continue_straight=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (!isCancelled && data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
          const latLngs = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          // กรองจุดพิกัดในซอย/ทางเดินที่รถรางจริงไม่วิ่ง (2 เส้นตัดขวางที่ผู้ใช้ระบุ)
          const cleanCoords = sanitizeCoords(latLngs);
          setDynamicRoadCoords(cleanCoords);
        }
      } catch (err) {
        console.warn("[CampusLiveMap] Could not fetch OSRM road geometry, falling back to direct line:", err);
      }
    };

    fetchOSRMRoute();
    return () => {
      isCancelled = true;
    };
  }, [selectedRoute?.id, routeStops, showRouteLine]);

  // พิกัดสำหรับเส้นทาง Polyline (ลำดับ: 1. dynamicRoadCoords OSRM -> 2. geometry ที่ผ่านการกรอง -> 3. เส้นตรงระหว่างจุดจอดจริง)
  const polylineCoords = useMemo(() => {
    if (!showRouteLine) return [];

    // 1. เส้นทางตามแนวถนนจริงที่คำนวณจากจุดจอดล่าสุด (กรอง 2 เส้นตัดขวางออกเด็ดขาด)
    if (dynamicRoadCoords && dynamicRoadCoords.length > 1) {
      return sanitizeCoords(dynamicRoadCoords);
    }

    // 2. ถ้ามี geometry ส่งมาจาก Route (กรอง 2 เส้นตัดขวางออกเด็ดขาด)
    if (selectedRoute?.geometry && selectedRoute.geometry.length > 1) {
      const sanitized = sanitizeCoords(selectedRoute.geometry);
      if (sanitized.length > 1) {
        return sanitized;
      }
    }

    // 3. Fallback ลากเส้นตรงระหว่างจุดจอดจริง
    if (routeStops.length === 0) return [];
    return routeStops.map(
      (rs) => [Number(rs.stop.latitude), Number(rs.stop.longitude)] as [number, number]
    );
  }, [selectedRoute, dynamicRoadCoords, routeStops, showRouteLine]);

  // จุดจอดที่จะแสดงบนแผนที่: ถ้าเลือก Route และมี routeStops ให้แสดงเฉพาะจุดจอดของ Route นั้น พร้อมเลขลำดับ 1, 2, 3...
  const activeDisplayStops = useMemo(() => {
    if (selectedRoute && routeStops.length > 0) {
      return routeStops.map((rs) => rs.stop);
    }
    return stops;
  }, [selectedRoute, routeStops, stops]);

  // พิกัดสำหรับ FitBounds
  const stopsToFit = useMemo(() => {
    return activeDisplayStops;
  }, [activeDisplayStops]);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";

    setTheme(getTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: "light" | "dark" }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      } else {
        setTheme(getTheme());
      }
    };

    window.addEventListener("themechange", handleThemeChange);
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`campus-map-wrapper theme-${theme}`}>
      <MapContainer
        center={RSU_CAMPUS_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="campus-leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          focusTarget={focusTarget}
          fitStops={stopsToFit}
          followedVehicleId={followedVehicleId}
          selectedRouteId={selectedRoute?.id ?? null}
        />

        {/* เส้นทางเดินรถ (Route Polyline) */}
        {polylineCoords.length > 1 && (
          <>
            {/* เส้นเรืองแสงพื้นหลัง */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: selectedRoute?.color || "#165dff",
                weight: 8,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* เส้นทางหลัก */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: selectedRoute?.color || "#165dff",
                weight: 4,
                opacity: 0.9,
                dashArray: "10, 8",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* หมุดจุดจอด / อาคารใน ม.รังสิต */}
        {showStops &&
          activeDisplayStops.map((stop, index) => {
            const lat = Number(stop.latitude);
            const lng = Number(stop.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const stopNumber = index + 1;

            return (
              <Marker
                key={`stop-${stop.id}`}
                position={[lat, lng]}
                icon={stopIcons(stopNumber)}
                eventHandlers={{
                  click: () => onSelectStop?.(stop),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -28]}
                  opacity={0.96}
                  permanent={false}
                  className="campus-stop-tooltip"
                >
                  <span className="tooltip-title">
                    {lang === "en" ? (stop.nameEn || stop.nameTh) : stop.nameTh}
                  </span>
                </Tooltip>

                <Popup className="campus-popup">
                  <div className="popup-inner">
                    <div className="popup-tag">
                      {lang === "en" ? `Stop #${stopNumber}` : `จุดจอดที่ ${stopNumber}`}
                    </div>
                    <h4 className="popup-title">
                      {lang === "en" ? (stop.nameEn || stop.nameTh) : stop.nameTh}
                    </h4>
                    <div className="popup-subtitle">
                      {lang === "en" ? stop.nameTh : (stop.nameEn || "RSU Campus")}
                    </div>
                    <div className="popup-divider" />
                    <div className="popup-coords">
                      <span className="coord-label">
                        {lang === "en" ? "GPS Coordinates:" : "พิกัด GPS:"}
                      </span>
                      <code>
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </code>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        }

        {/* หมุดรถราง: แสดงเฉพาะรถที่มี GPS สดจากมือถือคนขับเท่านั้น (ไม่แสดง mock อยู่นิ่ง) */}
        {showVehicles &&
          vehicles
            .filter((vehicle) => {
              const lat = Number(vehicle.latitude);
              const lng = Number(vehicle.longitude);
              if (isNaN(lat) || isNaN(lng) || lat === 0) return false;

              // แสดงเฉพาะรถที่กำลังแชร์พิกัดสดจากมือถือคนขับ
              const isLive = Boolean(
                vehicle.isLive ||
                (vehicle.lastSeenAt && (Date.now() - new Date(vehicle.lastSeenAt).getTime()) < 3 * 60 * 1000)
              );
              return isLive;
            })
            .map((vehicle) => {
              const lat = Number(vehicle.latitude);
              const lng = Number(vehicle.longitude);
              const isLive = true;

              const color = vehicle.route?.color || "#165dff";
              const icon = getVehicleIcon(color, isLive);

              return (
                <Marker
                  key={`vehicle-${vehicle.id}`}
                  position={[lat, lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelectVehicle?.(vehicle),
                  }}
                >
                  <Tooltip
                    direction="bottom"
                    offset={[0, 15]}
                    opacity={0.96}
                    permanent={true}
                    className={`campus-vehicle-tooltip ${isLive ? "tooltip-live" : "tooltip-standby"}`}
                  >
                    <span className="vehicle-tooltip-name">
                      {isLive ? "🟢 " : "⚪ "}
                      {vehicle.name}
                      {isLive && vehicle.speed ? ` (${Number(vehicle.speed).toFixed(0)} km/h)` : ""}
                    </span>
                  </Tooltip>

                  <Popup className="campus-popup vehicle-popup">
                    <div className="popup-inner">
                      <div className={`vehicle-popup-badge ${isLive ? "live" : "standby"}`}>
                        {isLive ? (
                          <>
                            <span className="live-dot" /> {lang === "en" ? "Sharing live GPS (Driver)" : "กำลังแชร์พิกัดสด (GPS คนขับ)"}
                          </>
                        ) : (
                          <>
                            <span className="standby-dot" /> {lang === "en" ? "Standby (Waiting for driver)" : "สแตนด์บาย (รอคนขับเข้าสู่ระบบ)"}
                          </>
                        )}
                      </div>
                      <h4 className="popup-title">{vehicle.name}</h4>
                      <div className="popup-meta">
                        <span className="popup-type">{vehicle.type || (lang === "en" ? "Electric Tram" : "รถรางไฟฟ้า")}</span>
                        {vehicle.route && (
                          <span
                            className="popup-route-pill"
                            style={{
                              borderColor: vehicle.route.color || "#165dff",
                              color: vehicle.route.color || "#165dff",
                            }}
                          >
                            {vehicle.route.name}
                          </span>
                        )}
                      </div>

                      {isLive && vehicle.driverName && (
                        <div className="popup-driver-row" style={{ fontSize: 12, margin: "4px 0", color: "var(--ink-soft)" }}>
                          👤 {lang === "en" ? "Driver: " : "คนขับ: "}<strong style={{ color: "var(--navy)" }}>{vehicle.driverName}</strong>
                        </div>
                      )}

                      {isLive && typeof vehicle.speed === "number" && vehicle.speed > 0 && (
                        <div className="popup-speed-row" style={{ fontSize: 12, margin: "2px 0 6px", color: "var(--teal)" }}>
                          ⚡ {lang === "en" ? "Current Speed: " : "ความเร็วปัจจุบัน: "}<strong>{Number(vehicle.speed).toFixed(1)} km/h</strong>
                        </div>
                      )}

                      <div className="popup-divider" />
                      <div className="popup-coords">
                        <span className="coord-label">{isLive ? (lang === "en" ? "Live Phone GPS:" : "พิกัด GPS มือถือสด:") : (lang === "en" ? "Last GPS:" : "พิกัดล่าสุด:")}</span>
                        <code>
                          {lat.toFixed(6)}, {lng.toFixed(6)}
                        </code>
                      </div>
                      {vehicle.lastSeenAt && (
                        <div className="popup-timestamp">
                            { isLive?(lang === "en" ? "Updated: " : "อัปเดตสดเมื่อ: ") : (lang === "en" ? "Last seen: " : "สัญญาณล่าสุด: ")}
                          {new Date(vehicle.lastSeenAt).toLocaleTimeString(lang === "en" ? "en-US" : "th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
      </MapContainer>
    </div>
  );
}
