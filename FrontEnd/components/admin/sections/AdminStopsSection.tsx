import type { Stop } from "@/types";
import { EntityPanel, PanelForm } from "../ui/AdminPanels";
import type { StopForm } from "../admin-types";

type Props = {
  stops: Stop[];
  editingId: number | null;
  form: StopForm;
  onFormChange: (form: StopForm) => void;
  onEdit: (stop: Stop) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function AdminStopsSection({ stops, editingId, form, onFormChange, onEdit, onDelete, onSave, onCancel }: Props) {
  return (
    <div className="admin-columns">
      <EntityPanel title="Stops" subtitle="จุดจอดพร้อมพิกัดสำหรับแผนที่" count={stops.length}>
        <table>
          <thead><tr><th>Stop</th><th>Coordinates</th><th>Status</th><th /></tr></thead>
          <tbody>
            {stops.map((stop) => (
              <tr key={stop.id}>
                <td><strong>{stop.nameTh}</strong><br /><small style={{ color: "var(--muted)" }}>{stop.nameEn || "—"}</small></td>
                <td className="coords">{Number(stop.latitude).toFixed(5)},<br />{Number(stop.longitude).toFixed(5)}</td>
                <td><span className={`status ${stop.isActive ? "active" : "inactive"}`}>{stop.isActive ? "Active" : "Hidden"}</span></td>
                <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => onEdit(stop)}>Edit</button><button type="button" className="icon-button" onClick={() => onDelete(stop.id)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </EntityPanel>

      <PanelForm title={editingId ? "แก้ไข Stop" : "เพิ่ม Stop"} onCancel={onCancel} onSubmit={onSave}>
        <div className="field"><label>ชื่อไทย *</label><input value={form.nameTh} onChange={(event) => onFormChange({ ...form, nameTh: event.target.value })} placeholder="เช่น อาคารหอพัก" /></div>
        <div className="field"><label>ชื่ออังกฤษ</label><input value={form.nameEn} onChange={(event) => onFormChange({ ...form, nameEn: event.target.value })} placeholder="Residence Hall" /></div>
        <div className="form-grid"><div className="field"><label>Latitude *</label><input type="number" step="any" value={form.latitude} onChange={(event) => onFormChange({ ...form, latitude: event.target.value })} placeholder="13.9552" /></div><div className="field"><label>Longitude *</label><input type="number" step="any" value={form.longitude} onChange={(event) => onFormChange({ ...form, longitude: event.target.value })} placeholder="100.5851" /></div></div>
        <div className="field"><label>Image URL</label><input value={form.imageUrl} onChange={(event) => onFormChange({ ...form, imageUrl: event.target.value })} /></div>
        <label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} /> เปิดใช้งาน</label>
      </PanelForm>
    </div>
  );
}
