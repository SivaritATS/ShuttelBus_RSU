"use client";

import type { Route, Vehicle } from "@/types";
import { EntityPanel, PanelForm } from "../ui/AdminPanels";
import type { VehicleForm } from "../admin-types";
import { useLanguage } from "@/lib/languageContext";

type Props = {
  vehicles: Vehicle[];
  routes: Route[];
  editingId: number | null;
  form: VehicleForm;
  onFormChange: (form: VehicleForm) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function AdminVehiclesSection({ vehicles, routes, editingId, form, onFormChange, onEdit, onDelete, onSave, onCancel }: Props) {
  const { lang, t } = useLanguage();

  return (
    <div className="admin-columns">
        <EntityPanel title={t("adminVehiclesTitle")} subtitle={t("adminVehiclesSub")} count={vehicles.length}>
          <table>
            <thead>
              <tr>
                <th>{t("adminThVehicle")}</th>
                <th>{t("adminThRoute")}</th>
                <th>{t("adminThLocation")}</th>
                <th>{t("adminThStatus")}</th>
                <th>{t("adminThActive")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const isLive = Boolean(
                  vehicle.isLive ||
                  (vehicle.lastSeenAt && (Date.now() - new Date(vehicle.lastSeenAt).getTime()) < 3 * 60 * 1000)
                );

                return (
                  <tr key={vehicle.id}>
                    <td>
                      <strong>{vehicle.name}</strong>
                      <br />
                      <small style={{ color: "var(--muted)" }}>{vehicle.type || "—"}</small>
                    </td>
                    <td>{vehicle.route?.name || (lang === "en" ? "Unassigned" : "ยังไม่กำหนด")}</td>
                    <td className="coords">
                      {vehicle.latitude != null && vehicle.longitude != null
                        ? `${Number(vehicle.latitude).toFixed(4)}, ${Number(vehicle.longitude).toFixed(4)}`
                        : "No GPS"}
                      {isLive && vehicle.speed ? <small style={{ color: "var(--teal)", display: "block" }}>{Number(vehicle.speed).toFixed(1)} km/h</small> : null}
                    </td>
                    <td>
                      <span className={`status ${isLive ? "active" : "inactive"}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#10b981" : "#94a3b8" }} />
                        {isLive ? t("adminStatusLiveDriver") : t("adminStatusStandby")}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${vehicle.isActive ? "active" : "inactive"}`}>
                        {vehicle.isActive ? t("adminStatusActive") : t("adminStatusInactive")}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-button" onClick={() => onEdit(vehicle)}>
                          {t("adminBtnEdit")}
                        </button>
                        <button type="button" className="icon-button" onClick={() => onDelete(vehicle.id)}>
                          {t("adminBtnDelete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </EntityPanel>

          <PanelForm
            title={editingId ? (lang === "en" ? "Edit Vehicle" : "แก้ไข Vehicle") : (lang === "en" ? "Add Vehicle" : "เพิ่ม Vehicle")}
            onCancel={onCancel}
            onSubmit={onSave}
          >
            <div className="field">
              <label>{lang === "en" ? "Vehicle Name *" : "ชื่อ Vehicle *"}</label>
              <input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="เช่น RSU Shuttle 04" />
            </div>
            <div className="field">
              <label>{lang === "en" ? "Vehicle Type" : "ประเภท"}</label>
              <input value={form.type} onChange={(event) => onFormChange({ ...form, type: event.target.value })} placeholder="Electric Van / Tram" />
            </div>
            <div className="field">
              <label>{lang === "en" ? "Assigned Route" : "Route ที่ผูก"}</label>
              <select value={form.routeId} onChange={(event) => onFormChange({ ...form, routeId: event.target.value })}>
                <option value="">{lang === "en" ? "Unassigned" : "ยังไม่กำหนด"}</option>
                {routes.map((route) => <option value={route.id} key={route.id}>{route.name}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>{lang === "en" ? "Default Latitude" : "พิกัดเริ่มต้น (Latitude)"}</label>
                <input type="number" step="any" value={form.latitude} onChange={(event) => onFormChange({ ...form, latitude: event.target.value })} placeholder="13.9552" />
              </div>
              <div className="field">
                <label>{lang === "en" ? "Default Longitude" : "พิกัดเริ่มต้น (Longitude)"}</label>
                <input type="number" step="any" value={form.longitude} onChange={(event) => onFormChange({ ...form, longitude: event.target.value })} placeholder="100.5851" />
              </div>
            </div>
            <p className="form-hint">
              {lang === "en"
                ? "Live GPS coordinates are updated in real-time from driver's smartphone. The default coordinates above are used as standby/garage location."
                : "พิกัด GPS จะถูกติดตามแบบ Realtime จากมือถือของคนขับเมื่อล็อกอินผ่านแอป (ช่องพิกัดด้านบนใช้เป็นจุดสแตนด์บาย/โรงรถเริ่มต้น)"}
            </p>
            <label className="checkbox">
              <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} /> {lang === "en" ? "Active" : "เปิดใช้งาน"}
            </label>
          </PanelForm>
        </div>
        );
}
