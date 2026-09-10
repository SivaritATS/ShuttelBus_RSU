"use client";

import { useEffect, useState } from "react";
import type { Route, RouteStop, Vehicle } from "@/types";
import { PublicHero } from "./sections/PublicHero";
import { LiveVehicleTrackingSection } from "./sections/LiveVehicleTrackingSection";
import { RouteNetworkSection } from "./sections/RouteNetworkSection";
import { RouteStopsSection } from "./sections/RouteStopsSection";

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
      .catch((reason) => setError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดเส้นทางได้"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    if (!selectedRoute) { setStops([]); return; }
    setLoading(true);
    getJson<RouteStop[]>(`/api/routes/${selectedRoute.id}/stops`)
      .then(setStops)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดจุดจอดได้"))
      .finally(() => setLoading(false));
  }, [selectedRoute]);

  return (
    <main>
      <PublicHero routeCount={routes.length} vehicleCount={vehicles.length} />
      <LiveVehicleTrackingSection vehicles={vehicles} loading={trackingLoading} error={trackingError} onRefresh={loadVehicles} />
      <RouteNetworkSection routes={routes} selectedRoute={selectedRoute} loading={loading} error={error} onSelect={(route) => { setSelectedRoute(route); setError(""); }} />
      <RouteStopsSection selectedRoute={selectedRoute} stops={stops} loading={loading} />
      <footer className="container footer">Shuttle Bus RSU · Sprint 1 foundation · Built for a connected campus</footer>
    </main>
  );
}
