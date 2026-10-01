"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Route, RouteStop, Stop, Vehicle, Trip } from "@/types";
import { api } from "@/lib/client-api";
import { AdminSidebar, getAdminTabLabel } from "./sections/AdminSidebar";
import { AdminOverview } from "./sections/AdminOverview";
import { AdminVehiclesSection } from "./sections/AdminVehiclesSection";
import { AdminRoutesSection } from "./sections/AdminRoutesSection";
import { AdminStopsSection } from "./sections/AdminStopsSection";
import { AdminLiveMapSection } from "./sections/AdminLiveMapSection";
import { useRealtimeSocket } from "@/lib/useSocket";
import { blankRoute, blankStop, blankVehicle, type AdminTab, type Notice, type RouteForm, type StopForm, type VehicleForm } from "./admin-types";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("live-map");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(blankVehicle);
  const [routeForm, setRouteForm] = useState<RouteForm>(blankRoute);
  const [stopForm, setStopForm] = useState<StopForm>(blankStop);
  const [newRouteStopId, setNewRouteStopId] = useState("");

  // Realtime Socket Callback สำหรับ Admin
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
  }, []);

  const handleTripChange = useCallback(() => {
    // รีเฟรช active trips เมื่อมีเหตุการณ์
    api<Trip[]>("/api/trips/active").then(setActiveTrips).catch(() => undefined);
  }, []);

  const { isConnected: isSocketConnected, sendLocationUpdate } = useRealtimeSocket({
    room: "admin",
    onLocationUpdate: handleRealtimeLocation,
    onTripChange: handleTripChange,
  });

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || null;
  const unassignedStops = useMemo(() => stops.filter((stop) => !routeStops.some((item) => item.stopId === stop.id)), [stops, routeStops]);

  const refresh = async () => {
    const [nextRoutes, nextVehicles, nextStops, nextTrips] = await Promise.all([
      api<Route[]>("/api/routes"),
      api<Vehicle[]>("/api/vehicles"),
      api<Stop[]>("/api/stops"),
      api<Trip[]>("/api/trips/active").catch(() => []),
    ]);

    setRoutes(nextRoutes);
    setVehicles(nextVehicles);
    setStops(nextStops);
    setActiveTrips(nextTrips);

    if (selectedRouteId && nextRoutes.some((route) => route.id === selectedRouteId)) {
      setRouteStops(await api<RouteStop[]>(`/api/routes/${selectedRouteId}/stops`));
    } else if (selectedRouteId) {
      setSelectedRouteId(null);
      setRouteStops([]);
    }
  };

  useEffect(() => {
    refresh().catch((error) => setNotice({ kind: "error", message: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ" }));
  }, []);

  const run = async (action: () => Promise<void>, success = "บันทึกข้อมูลเรียบร้อย") => {
    try {
      await action();
      await refresh();
      setNotice({ kind: "success", message: success });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setVehicleForm(blankVehicle);
    setRouteForm(blankRoute);
    setStopForm(blankStop);
    setNewRouteStopId("");
  };

  const selectRoute = async (route: Route) => {
    setSelectedRouteId(route.id);
    setEditingId(route.id);
    setRouteForm({ name: route.name, color: route.color || "#165DFF", isActive: route.isActive });
    try {
      setRouteStops(await api<RouteStop[]>(`/api/routes/${route.id}/stops`));
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "โหลด Stop ไม่สำเร็จ" });
    }
  };

  const saveVehicle = () => run(
    () => api(`/api/vehicles${editingId ? `/${editingId}` : ""}`, {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify({ name: vehicleForm.name, type: vehicleForm.type || null, routeId: vehicleForm.routeId ? Number(vehicleForm.routeId) : null, latitude: vehicleForm.latitude === "" ? null : Number(vehicleForm.latitude), longitude: vehicleForm.longitude === "" ? null : Number(vehicleForm.longitude), isActive: vehicleForm.isActive }),
    }).then(() => { resetForm(); }),
    editingId ? "แก้ไข Vehicle แล้ว" : "เพิ่ม Vehicle แล้ว",
  );

  const saveRoute = () => run(
    () => api(`/api/routes${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(routeForm) }).then(() => { resetForm(); }),
    editingId ? "แก้ไข Route แล้ว" : "เพิ่ม Route แล้ว",
  );

  const saveStop = () => run(
    () => api(`/api/stops${editingId ? `/${editingId}` : ""}`, {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify({ nameTh: stopForm.nameTh, nameEn: stopForm.nameEn || null, latitude: Number(stopForm.latitude), longitude: Number(stopForm.longitude), imageUrl: stopForm.imageUrl || null, isActive: stopForm.isActive }),
    }).then(() => { resetForm(); }),
    editingId ? "แก้ไข Stop แล้ว" : "เพิ่ม Stop แล้ว",
  );

  const handleStartTrip = async (vehicleId: number, routeId: number) => {
    await run(async () => {
      await api("/api/trips/start", {
        method: "POST",
        body: JSON.stringify({ vehicleId, routeId }),
      });
    }, "เริ่มทริปใหม่เรียบร้อยแล้ว");
  };

  const handleEndTrip = async (tripId: number) => {
    await run(async () => {
      await api("/api/trips/end", {
        method: "POST",
        body: JSON.stringify({ tripId }),
      });
    }, "จบทริปเรียบร้อยแล้ว");
  };

  const handleSimulateMove = (vehicleId: number) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;

    // ขยับพิกัดเล็กน้อยในบริเวณ ม.รังสิต
    const deltaLat = (Math.random() - 0.5) * 0.0006;
    const deltaLng = (Math.random() - 0.5) * 0.0006;
    const currentLat = target.latitude ? Number(target.latitude) : 13.9658;
    const currentLng = target.longitude ? Number(target.longitude) : 100.5860;
    const nextLat = Number((currentLat + deltaLat).toFixed(7));
    const nextLng = Number((currentLng + deltaLng).toFixed(7));

    // ส่งสัญญาณ Realtime ไปยัง Socket Server ทันที
    sendLocationUpdate({
      vehicleId: target.id,
      latitude: nextLat,
      longitude: nextLng,
      speed: Math.floor(Math.random() * 20) + 15,
      heading: Math.floor(Math.random() * 360),
    });

    setNotice({
      kind: "success",
      message: `📡 จำลองส่ง GPS ให้ ${target.name} (${nextLat}, ${nextLng}) เรียบร้อย`,
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar tab={tab} onTabChange={setTab} onReset={resetForm} />
      <main className="admin-main">
        {notice && <div className={`alert ${notice.kind === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: 18 }} role="status">{notice.message}</div>}

        {tab === "live-map" && (
          <AdminLiveMapSection
            routes={routes}
            vehicles={vehicles}
            stops={stops}
            activeTrips={activeTrips}
            isSocketConnected={isSocketConnected}
            onStartTrip={handleStartTrip}
            onEndTrip={handleEndTrip}
            onSimulateMove={handleSimulateMove}
          />
        )}

        {tab === "overview" && <AdminOverview routes={routes} vehicles={vehicles} stops={stops} onRoutes={() => setTab("routes")} />}

        {tab === "vehicles" && <AdminVehiclesSection
          vehicles={vehicles} routes={routes} editingId={editingId} form={vehicleForm} onFormChange={setVehicleForm}
          onEdit={(vehicle) => { setEditingId(vehicle.id); setVehicleForm({ name: vehicle.name, type: vehicle.type || "", routeId: vehicle.routeId?.toString() || "", latitude: vehicle.latitude == null ? "" : String(vehicle.latitude), longitude: vehicle.longitude == null ? "" : String(vehicle.longitude), isActive: vehicle.isActive }); }}
          onDelete={(id) => run(() => api(`/api/vehicles/${id}`, { method: "DELETE" }).then(() => undefined), "ลบ Vehicle แล้ว")}
          onSave={saveVehicle} onCancel={resetForm}
        />}

        {tab === "routes" && <AdminRoutesSection
          routes={routes} selectedRouteId={selectedRouteId} selectedRoute={selectedRoute} routeStops={routeStops} availableStops={unassignedStops} editingId={editingId} form={routeForm} newStopId={newRouteStopId}
          onFormChange={setRouteForm} onSelect={selectRoute}
          onDelete={(id) => run(() => api(`/api/routes/${id}`, { method: "DELETE" }).then(() => undefined), "ลบ Route แล้ว")}
          onSave={saveRoute} onCancel={resetForm} onNewStopChange={setNewRouteStopId}
          onAddStop={() => run(() => api(`/api/routes/${selectedRouteId}/stops`, { method: "POST", body: JSON.stringify({ stopId: Number(newRouteStopId) }) }).then(() => undefined), "เพิ่ม Stop เข้า Route แล้ว")}
          onRemoveStop={(stopId) => run(() => api(`/api/routes/${selectedRouteId}/stops/${stopId}`, { method: "DELETE" }).then(() => undefined), "นำ Stop ออกจาก Route แล้ว")}
          onReorder={(next) => run(() => api(`/api/routes/${selectedRouteId}/stops/reorder`, { method: "PATCH", body: JSON.stringify({ stopIds: next.map((item) => item.stopId) }) }).then(() => undefined), "บันทึกลำดับ Stop แล้ว")}
        />}

        {tab === "stops" && <AdminStopsSection
          stops={stops} editingId={editingId} form={stopForm} onFormChange={setStopForm}
          onEdit={(stop) => { setEditingId(stop.id); setStopForm({ nameTh: stop.nameTh, nameEn: stop.nameEn || "", latitude: String(stop.latitude), longitude: String(stop.longitude), imageUrl: stop.imageUrl || "", isActive: stop.isActive }); }}
          onDelete={(id) => run(() => api(`/api/stops/${id}`, { method: "DELETE" }).then(() => undefined), "ลบ Stop แล้ว")}
          onSave={saveStop} onCancel={resetForm}
        />}
      </main>
    </div>
  );
}
