import type { Route, RouteStop, Stop } from "@/types";
import { EntityPanel, PanelForm } from "../ui/AdminPanels";
import type { RouteForm } from "../admin-types";

type Props = {
  routes: Route[];
  selectedRouteId: number | null;
  selectedRoute: Route | null;
  routeStops: RouteStop[];
  availableStops: Stop[];
  editingId: number | null;
  form: RouteForm;
  newStopId: string;
  onFormChange: (form: RouteForm) => void;
  onSelect: (route: Route) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onNewStopChange: (value: string) => void;
  onAddStop: () => void;
  onRemoveStop: (stopId: number) => void;
  onReorder: (items: RouteStop[]) => void;
};

export function AdminRoutesSection({ routes, selectedRouteId, selectedRoute, routeStops, availableStops, editingId, form, newStopId, onFormChange, onSelect, onDelete, onSave, onCancel, onNewStopChange, onAddStop, onRemoveStop, onReorder }: Props) {
  return (
    <div className="admin-columns">
      <EntityPanel title="Routes" subtitle="เส้นทางและการเรียงลำดับจุดจอด" count={routes.length}>
        <table>
          <thead><tr><th>Route</th><th>Stops</th><th>Status</th><th /></tr></thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id} style={{ background: selectedRouteId === route.id ? "var(--mint)" : undefined }}>
                <td><strong><i className="route-swatch" style={{ background: route.color || "var(--blue)", marginRight: 7 }} />{route.name}</strong></td>
                <td>{route._count?.routeStops || 0}</td>
                <td><span className={`status ${route.isActive ? "active" : "inactive"}`}>{route.isActive ? "Public" : "Draft"}</span></td>
                <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => onSelect(route)}>Edit</button><button type="button" className="icon-button" onClick={() => onDelete(route.id)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </EntityPanel>

      <div>
        <PanelForm title={editingId ? "แก้ไข Route" : "เพิ่ม Route"} onCancel={onCancel} onSubmit={onSave}>
          <div className="field"><label>ชื่อ Route *</label><input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="เช่น North Campus" /></div>
          <div className="field"><label>สี Route</label><input type="color" value={form.color} onChange={(event) => onFormChange({ ...form, color: event.target.value })} style={{ height: 40, padding: 4 }} /></div>
          <label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} /> เปิดให้ผู้โดยสารเห็น</label>
        </PanelForm>
        {selectedRoute && <RouteStopEditor route={selectedRoute} routeStops={routeStops} availableStops={availableStops} newStopId={newStopId} onNewStopChange={onNewStopChange} onAdd={onAddStop} onRemove={onRemoveStop} onReorder={onReorder} />}
      </div>
    </div>
  );
}

function RouteStopEditor({ route, routeStops, availableStops, newStopId, onNewStopChange, onAdd, onRemove, onReorder }: { route: Route; routeStops: RouteStop[]; availableStops: Stop[]; newStopId: string; onNewStopChange: (value: string) => void; onAdd: () => void; onRemove: (stopId: number) => void; onReorder: (items: RouteStop[]) => void }) {
  const move = (index: number, direction: -1 | 1) => {
    const next = [...routeStops];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onReorder(next);
  };

  return (
    <div className="panel route-editor">
      <div className="panel-title"><span>Stops in {route.name}</span><span className="status active">{routeStops.length}</span></div>
      <div className="form-grid" style={{ marginBottom: 13 }}><select value={newStopId} onChange={(event) => onNewStopChange(event.target.value)}><option value="">เลือก Stop เพื่อเพิ่ม…</option>{availableStops.map((stop) => <option key={stop.id} value={stop.id}>{stop.nameTh} · {stop.nameEn || ""}</option>)}</select><button type="button" className="button button-secondary" disabled={!newStopId} onClick={onAdd}>+ Add stop</button></div>
      {routeStops.length === 0 ? <div className="empty-state">ยังไม่มี Stop ใน Route นี้</div> : <div className="ordered-list">{routeStops.map((item, index) => <div className="ordered-row" key={item.id}><span className="stop-number">{index + 1}</span><div><strong>{item.stop.nameTh}</strong><div className="stop-en">{item.stop.nameEn || "English name unavailable"}</div></div><div className="order-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} title="เลื่อนขึ้น">↑</button><button type="button" disabled={index === routeStops.length - 1} onClick={() => move(index, 1)} title="เลื่อนลง">↓</button><button type="button" onClick={() => onRemove(item.stopId)} title="นำออก">×</button></div></div>)}</div>}
    </div>
  );
}
