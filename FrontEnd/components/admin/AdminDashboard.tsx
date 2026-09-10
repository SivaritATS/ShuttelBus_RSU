"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route, RouteStop, Stop, Vehicle } from "@/types";
import { api } from "@/lib/client-api";
import { AdminSidebar, getAdminTabLabel } from "./sections/AdminSidebar";
import { AdminOverview } from "./sections/AdminOverview";
import { AdminVehiclesSection } from "./sections/AdminVehiclesSection";
import { AdminRoutesSection } from "./sections/AdminRoutesSection";
import { AdminStopsSection } from "./sections/AdminStopsSection";
import { blankRoute, blankStop, blankVehicle, type AdminTab, type Notice, type RouteForm, type StopForm, type VehicleForm } from "./admin-types";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(blankVehicle);
  const [routeForm, setRouteForm] = useState<RouteForm>(blankRoute);
  const [stopForm, setStopForm] = useState<StopForm>(blankStop);
  const [newRouteStopId, setNewRouteStopId] = useState("");

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || null;
  const unassignedStops = useMemo(() => stops.filter((stop) => !routeStops.some((item) => item.stopId === stop.id)), [stops, routeStops]);

  const refresh = async () => {
    const [nextRoutes, nextVehicles, nextStops] = await Promise.all([
      api<Route[]>("/api/routes"),
      api<Vehicle[]>("/api/vehicles"),
      api<Stop[]>("/api/stops"),
    ]);

    setRoutes(nextRoutes);
    setVehicles(nextVehicles);
    setStops(nextStops);

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

  return (
    <div className="admin-layout">
      <AdminSidebar tab={tab} onTabChange={setTab} onReset={resetForm} />
      <main className="admin-main">
        <div className="admin-heading">
          <div><div className="eyebrow">Sprint 01 / data foundation</div><h1>{tab === "overview" ? "Network overview" : `${getAdminTabLabel(tab)} management`}</h1><p>จัดการข้อมูลที่เชื่อมต่อกับ Backend API และฐานข้อมูลกลาง</p></div>
          <a className="button button-secondary" href="/api/health" target="_blank" rel="noreferrer">API health</a>
        </div>

        {notice && <div className={`alert ${notice.kind === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: 18 }} role="status">{notice.message}</div>}
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
