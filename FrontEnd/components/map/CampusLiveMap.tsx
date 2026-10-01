"use client";

import { useEffect, useMemo, useState } from "react";
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

const RSU_CAMPUS_CENTER: [number, number] = [13.9658, 100.5860];
const DEFAULT_ZOOM = 16;

function MapController({
  focusTarget,
  fitStops,
}: {
  focusTarget: [number, number] | null;
  fitStops: Stop[];
}) {
  const map = useMap();

  useEffect(() => {
    if (focusTarget) {
      map.flyTo(focusTarget, 18, { duration: 1.2 });
    }
  }, [focusTarget, map]);

  useEffect(() => {
    if (!focusTarget && fitStops.length > 0) {
      const bounds = fitStops.map(
        (s) => [Number(s.latitude), Number(s.longitude)] as [number, number]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [fitStops, focusTarget, map]);

  return null;
}

interface CampusLiveMapProps {
  stops: Stop[];
  routeStops: RouteStop[];
  vehicles: Vehicle[];
  selectedRoute: Route | null;
  focusTarget: [number, number] | null;
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
  showStops = true,
  showVehicles = true,
  showRouteLine = true,
  onSelectStop,
  onSelectVehicle,
}: CampusLiveMapProps) {
  // สร้าง icon สำหรับรถรางแต่ละสี
  const tramIcons = useMemo(() => {
    const makeIcon = (color: string) =>
      L.divIcon({
        className: "custom-tram-icon",
        html: `
          <div class="tram-marker-wrap">
            <span class="tram-pulse-ring" style="border-color: ${color};"></span>
            <div class="tram-marker-body" style="background: ${color};">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
              </svg>
            </div>
            <span class="tram-marker-label">Live</span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

    return {
      default: makeIcon("#165dff"),
      loop: makeIcon("#165dff"),
      connector: makeIcon("#f97316"),
      express: makeIcon("#0ba6a6"),
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

  // พิกัดสำหรับเส้นทาง Polyline
  const polylineCoords = useMemo(() => {
    if (!showRouteLine || routeStops.length === 0) return [];
    return routeStops.map(
      (rs) => [Number(rs.stop.latitude), Number(rs.stop.longitude)] as [number, number]
    );
  }, [routeStops, showRouteLine]);

  // พิกัดสำหรับ FitBounds
  const stopsToFit = useMemo(() => {
    if (routeStops.length > 0) {
      return routeStops.map((rs) => rs.stop);
    }
    return stops;
  }, [routeStops, stops]);

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

        <MapController focusTarget={focusTarget} fitStops={stopsToFit} />

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
          stops.map((stop, index) => {
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
                  <span className="tooltip-title">{stop.nameTh}</span>
                </Tooltip>

                <Popup className="campus-popup">
                  <div className="popup-inner">
                    <div className="popup-tag">จุดจอดที่ {stopNumber}</div>
                    <h4 className="popup-title">{stop.nameTh}</h4>
                    {stop.nameEn && <div className="popup-subtitle">{stop.nameEn}</div>}
                    <div className="popup-divider" />
                    <div className="popup-coords">
                      <span className="coord-label">พิกัด GPS:</span>
                      <code>
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </code>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* หมุดรถรางที่กำลังวิ่งอยู่ (Live Vehicles) */}
        {showVehicles &&
          vehicles.map((vehicle) => {
            const lat = Number(vehicle.latitude);
            const lng = Number(vehicle.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0) return null;

            const icon =
              vehicle.route?.color === "#F97316"
                ? tramIcons.connector
                : vehicle.route?.color === "#0ba6a6"
                ? tramIcons.express
                : tramIcons.default;

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
                  className="campus-vehicle-tooltip"
                >
                  <span className="vehicle-tooltip-name">{vehicle.name}</span>
                </Tooltip>

                <Popup className="campus-popup vehicle-popup">
                  <div className="popup-inner">
                    <div className="vehicle-popup-badge">
                      <span className="live-dot" /> กำลังให้บริการ (Live)
                    </div>
                    <h4 className="popup-title">{vehicle.name}</h4>
                    <div className="popup-meta">
                      <span className="popup-type">{vehicle.type || "รถรางไฟฟ้า"}</span>
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
                    <div className="popup-divider" />
                    <div className="popup-coords">
                      <span className="coord-label">พิกัดปัจจุบัน:</span>
                      <code>
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </code>
                    </div>
                    {vehicle.lastSeenAt && (
                      <div className="popup-timestamp">
                        อัปเดต:{" "}
                        {new Date(vehicle.lastSeenAt).toLocaleTimeString("th-TH", {
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
