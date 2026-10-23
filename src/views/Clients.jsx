import { useMemo, useState } from "react";
import Modal from "../components/Modal.jsx";
import { calcTotals, compactInr, inr, uid } from "../utils.js";
import { STATE_CODES } from "./Editor.jsx";

const empty = {
  name: "", contact: "", email: "", phone: "", gstin: "",
  address: "", state: "West Bengal", stateCode: "19",
};

export default function Clients({ state, onSaveClient, onDeleteClient, go }) {
  const { clients, invoices } = state;
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const totals = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.status === "draft") return;
      const t = calcTotals(inv).total;
      map.set(inv.clientId, (map.get(inv.clientId) || 0) + t);
    });
    return map;
  }, [invoices]);

  const filtered = clients.filter((c) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Clients</h1>
          <p className="muted">Har client ka GSTIN save karo — invoice ek click mein ready.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...empty, id: null })}>
          + Add client
        </button>
      </div>

      <div className="toolbar">
        <div />
        <input
          className="input search"
          placeholder="Search clients…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="client-grid">
        {filtered.map((c) => {
          const billed = totals.get(c.id) || 0;
          const count = invoices.filter((i) => i.clientId === c.id).length;
          return (
            <div className="card client-card" key={c.id}>
              <div className="cc-top">
                <div className="avatar lg">{c.name.slice(0, 2).toUpperCase()}</div>
                <div className="cc-main">
                  <strong>{c.name}</strong>
                  <span className="muted small">{c.contact || "—"}</span>
                </div>
              </div>
              <div className="cc-meta">
                <span>{c.email || "no email"}</span>
                <span>{c.phone || "no phone"}</span>
                <span>{c.state}{c.stateCode ? ` (${c.stateCode})` : ""}</span>
                {c.gstin && <span className="mono small">{c.gstin}</span>}
              </div>
              <div className="cc-stats">
                <div><span className="muted small">Billed</span><strong>{compactInr(billed)}</strong></div>
                <div><span className="muted small">Invoices</span><strong>{count}</strong></div>
              </div>
              <div className="cc-actions">
                <button className="btn sm" onClick={() => setEditing(c)}>Edit</button>
                <button className="btn sm ghost" onClick={() => go("editor", { isNew: true, clientId: c.id })}>
                  New invoice
                </button>
                <button
                  className="icon-btn danger"
                  title="Delete client"
                  onClick={() => {
                    if (confirm(`Delete ${c.name}? Invoices will remain.`)) onDeleteClient(c.id);
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card empty">
            <span className="empty-emoji">🤝</span>
            <strong>No clients yet</strong>
            <p className="muted">Add your first client and start billing in 30 seconds.</p>
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit client" : "Add client"}
          onClose={() => setEditing(null)}
        >
          <div className="form-grid">
            <label className="field">
              <span>Business name *</span>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </label>
            <label className="field">
              <span>Contact person</span>
              <input className="input" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </label>
            <label className="field">
              <span>GSTIN</span>
              <input className="input mono" value={editing.gstin} onChange={(e) => setEditing({ ...editing, gstin: e.target.value.toUpperCase() })} />
            </label>
            <label className="field">
              <span>State</span>
              <select
                className="input"
                value={editing.state}
                onChange={(e) => setEditing({ ...editing, state: e.target.value, stateCode: STATE_CODES[e.target.value] || "" })}
              >
                {Object.keys(STATE_CODES).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field span2">
              <span>Address</span>
              <input className="input" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!editing.name.trim()) return;
                onSaveClient({ ...editing, id: editing.id || uid() });
                setEditing(null);
              }}
            >
              Save client
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
