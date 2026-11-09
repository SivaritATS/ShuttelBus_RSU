"use client";

import type { Route, RouteStop, Stop } from "@/types";
import { EntityPanel, PanelForm } from "../ui/AdminPanels";
import type { RouteForm } from "../admin-types";
import { useLanguage } from "@/lib/languageContext";

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
  const { lang, t } = useLanguage();

  return (
    <div className="admin-columns">
        <EntityPanel title={t("adminRoutesTitle")} subtitle={t("adminRoutesSub")} count={routes.length}>
          <table>
            <thead>
              <tr>
                <th>{t("adminThRoute")}</th>
                <th>{t("adminThStops")}</th>
                <th>{t("adminThActive")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} style={{ background: selectedRouteId === route.id ? "var(--mint)" : undefined }}>
                  <td>
                    <strong>
                      <i className="route-swatch" style={{ background: route.color || "var(--blue)", marginRight: 7 }} />
                      {route.name}
                    </strong>
                  </td>
                  <td>{route._count?.routeStops || 0}</td>
                  <td>
                    <span className={`status ${route.isActive ? "active" : "inactive"}`}>
                      {route.isActive ? t("adminStatusPublic") : t("adminStatusDraft")}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-button" onClick={() => onSelect(route)}>
                        {t("adminBtnEdit")}
                      </button>
                      <button type="button" className="icon-button" onClick={() => onDelete(route.id)}>
                        {t("adminBtnDelete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EntityPanel>

        <div>
            <PanelForm
              title={editingId ? (lang === "en" ? "Edit Route" : "แก้ไข Route") : (lang === "en" ? "Add Route" : "เพิ่ม Route")}
              onCancel={onCancel}
              onSubmit={onSave}
            >
              <div className="field">
                <label>{lang === "en" ? "Route Name *" : "ชื่อ Route *"}</label>
                <input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="เช่น North Campus" />
              </div>
              <div className="field">
                <label>{lang === "en" ? "Route Color" : "สี Route"}</label>
                <input type="color" value={form.color} onChange={(event) => onFormChange({ ...form, color: event.target.value })} style={{ height: 40, padding: 4 }} />
              </div>
              <label className="checkbox">
                <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} /> {lang === "en" ? "Public to Passengers" : "เปิดให้ผู้โดยสารเห็น"}
              </label>
            </PanelForm>
            {selectedRoute && (
              <RouteStopEditor
                route={selectedRoute}
                routeStops={routeStops}
                availableStops={availableStops}
                newStopId={newStopId}
                onNewStopChange={onNewStopChange}
                onAdd={onAddStop}
                onRemove={onRemoveStop}
                onReorder={onReorder}
              />
            )}
        </div>
    </div>
  );
}

function RouteStopEditor({ route, routeStops, availableStops, newStopId, onNewStopChange, onAdd, onRemove, onReorder }: { route: Route; routeStops: RouteStop[]; availableStops: Stop[]; newStopId: string; onNewStopChange: (value: string) => void; onAdd: () => void; onRemove: (stopId: number) => void; onReorder: (items: RouteStop[]) => void }) {
  const { lang, t } = useLanguage();

  const move = (index: number, direction: -1 | 1) => {
    const next = [...routeStops];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onReorder(next);
  };

  return (
    <div className="panel route-editor">
      <div className="panel-title">
        <span>{t("adminStopsInRoute")} {route.name}</span>
        <span className="status active">{routeStops.length}</span>
      </div>
      <div className="form-grid" style={{ marginBottom: 13 }}>
        <select value={newStopId} onChange={(event) => onNewStopChange(event.target.value)}>
          <option value="">{t("adminSelectStopPlaceholder")}</option>
          {availableStops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.nameTh} {stop.nameEn ? `· ${stop.nameEn}` : ""}
            </option>
          ))}
        </select>
        <button type="button" className="button button-secondary" disabled={!newStopId} onClick={onAdd}>
          {t("adminAddStop")}
        </button>
      </div>
      {routeStops.length === 0 ? (
        <div className="empty-state">{t("adminNoStopsInRoute")}</div>
      ) : (
        <div className="ordered-list">
          {routeStops.map((item, index) => (
            <div className="ordered-row" key={item.id}>
              <span className="stop-number">{index + 1}</span>
              <div>
                <strong>{item.stop.nameTh}</strong>
                <div className="stop-en">{item.stop.nameEn || "—"}</div>
              </div>
              <div className="order-actions">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} title={lang === "en" ? "Move Up" : "เลื่อนขึ้น"}>
                  ↑
                </button>
                <button type="button" disabled={index === routeStops.length - 1} onClick={() => move(index, 1)} title={lang === "en" ? "Move Down" : "เลื่อนลง"}>
                  ↓
                </button>
                <button type="button" onClick={() => onRemove(item.stopId)} title={lang === "en" ? "Remove" : "นำออก"}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
