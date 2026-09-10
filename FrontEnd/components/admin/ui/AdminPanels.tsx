import type { ReactNode } from "react";

export function EntityPanel({ title, subtitle, count, children }: { title: string; subtitle: string; count: number; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "3px 0 0" }}>{subtitle}</p>
        </div>
        <span className="status active">{count}</span>
      </div>
      <div className="table-wrap">{children}</div>
    </div>
  );
}

export function PanelForm({ title, children, onSubmit, onCancel }: { title: string; children: ReactNode; onSubmit: () => void; onCancel: () => void }) {
  return (
    <div className="panel form">
      <h3>{title}</h3>
      {children}
      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={onCancel}>ล้าง</button>
        <button type="button" className="button button-primary" onClick={onSubmit}>บันทึก</button>
      </div>
    </div>
  );
}
