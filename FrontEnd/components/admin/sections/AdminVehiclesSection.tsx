import type { Route, Vehicle } from "@/types";
import { EntityPanel, PanelForm } from "../ui/AdminPanels";
import type { VehicleForm } from "../admin-types";

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
  return (
    <div className="admin-columns">
      <EntityPanel title="Vehicles" subtitle="ยานพาหนะทั้งหมดในระบบ" count={vehicles.length}>
        <table>
          <thead><tr><th>Vehicle</th><th>Route</th><th>Location (GPS)</th><th>Tracking Status</th><th>Active</th><th /></tr></thead>
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
                  <td>{vehicle.route?.name || "Unassigned"}</td>
                  <td className="coords">
                    {vehicle.latitude != null && vehicle.longitude != null
                      ? `${Number(vehicle.latitude).toFixed(4)}, ${Number(vehicle.longitude).toFixed(4)}`
                      : "No GPS"}
                    {isLive && vehicle.speed ? <small style={{ color: "var(--teal)", display: "block" }}>{Number(vehicle.speed).toFixed(1)} km/h</small> : null}
                  </td>
                  <td>
                    <span className={`status ${isLive ? "active" : "inactive"}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#10b981" : "#94a3b8" }} />
                      {isLive ? "Live (GPS มือถือ)" : "Standby (รอคนขับ)"}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${vehicle.isActive ? "active" : "inactive"}`}>
                      {vehicle.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-button" onClick={() => onEdit(vehicle)}>
                        Edit
                      </button>
                      <button type="button" className="icon-button" onClick={() => onDelete(vehicle.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </EntityPanel>

      <PanelForm title={editingId ? "แก้ไข Vehicle" : "เพิ่ม Vehicle"} onCancel={onCancel} onSubmit={onSave}>
        <div className="field"><label>ชื่อ Vehicle *</label><input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="เช่น RSU Shuttle 04" /></div>
        <div className="field"><label>ประเภท</label><input value={form.type} onChange={(event) => onFormChange({ ...form, type: event.target.value })} placeholder="Electric Van" /></div>
        <div className="field"><label>Route ที่ผูก</label><select value={form.routeId} onChange={(event) => onFormChange({ ...form, routeId: event.target.value })}><option value="">ยังไม่กำหนด</option>{routes.map((route) => <option value={route.id} key={route.id}>{route.name}</option>)}</select></div>
        <div className="form-grid"><div className="field"><label>พิกัดเริ่มต้น (Latitude)</label><input type="number" step="any" value={form.latitude} onChange={(event) => onFormChange({ ...form, latitude: event.target.value })} placeholder="13.9552" /></div><div className="field"><label>พิกัดเริ่มต้น (Longitude)</label><input type="number" step="any" value={form.longitude} onChange={(event) => onFormChange({ ...form, longitude: event.target.value })} placeholder="100.5851" /></div></div>
        <p className="form-hint">พิกัด GPS จะถูกติดตามแบบ Realtime จากมือถือของคนขับเมื่อล็อกอินผ่านแอป (ช่องพิกัดด้านบนใช้เป็นจุดสแตนด์บาย/โรงรถเริ่มต้น)</p>
        <label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} /> เปิดใช้งาน</label>
      </PanelForm>
    </div>
  );
}
