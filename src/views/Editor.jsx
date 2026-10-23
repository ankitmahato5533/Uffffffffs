import { useMemo, useState } from "react";
import Modal from "../components/Modal.jsx";
import {
  addDays, amountInWords, calcTotals, inr, todayISO, uid,
} from "../utils.js";

const GST_RATES = [0, 5, 12, 18, 28];

export default function Editor({ initial, state, go, onSave, onAddClient }) {
  const { clients, settings } = state;
  const [inv, setInv] = useState(initial);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", contact: "", email: "", phone: "", address: "", state: "West Bengal", stateCode: "19", gstin: "" });
  const [error, setError] = useState("");

  const t = useMemo(() => calcTotals(inv), [inv]);
  const client = clients.find((c) => c.id === inv.clientId);

  const patch = (p) => setInv((prev) => ({ ...prev, ...p }));

  const setItem = (id, p) =>
    setInv((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    }));

  const addItem = () =>
    setInv((prev) => ({
      ...prev,
      items: [...prev.items, { id: uid(), desc: "", qty: 1, rate: 0 }],
    }));

  const removeItem = (id) =>
    setInv((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));

  const pickClient = (id) => {
    const c = clients.find((x) => x.id === id);
    const inter = c && settings.stateCode && c.stateCode && c.stateCode !== settings.stateCode;
    patch({ clientId: id, ...(c ? { gstMode: inter ? "inter" : "intra" } : {}) });
  };

  const submit = (andPreview = false) => {
    if (!inv.clientId) return setError("Pehle client select karo (ya naya client add karo).");
    const clean = inv.items.filter((it) => it.desc.trim() || Number(it.rate) > 0);
    if (!clean.length) return setError("Kam se kam ek line item daalo.");
    setError("");
    onSave({ ...inv, items: clean }, andPreview);
  };

  const saveNewClient = () => {
    if (!newClient.name.trim()) return;
    const c = { ...newClient, id: uid() };
    onAddClient(c);
    setShowClientModal(false);
    pickClient(c.id);
    setNewClient({ name: "", contact: "", email: "", phone: "", address: "", state: "West Bengal", stateCode: "19", gstin: "" });
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <button className="link-btn back" onClick={() => go("invoices")}>← Back to invoices</button>
          <h1>{initial.isNew ? "New invoice" : `Edit ${inv.number}`}</h1>
          <p className="muted">GST auto-calculate hota hai. Client ka state dekho, tax apne aap lagega.</p>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={() => submit(false)}>Save draft</button>
          <button className="btn btn-primary" onClick={() => submit(true)}>Save &amp; preview</button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <section className="card">
            <div className="card-head">
              <h2>Bill to</h2>
              <button className="link-btn" onClick={() => setShowClientModal(true)}>+ New client</button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Client</span>
                <select className="input" value={inv.clientId} onChange={(e) => pickClient(e.target.value)}>
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.state ? ` — ${c.state}` : ""}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Place of supply</span>
                <input
                  className="input"
                  value={client ? `${client.state}${client.stateCode ? ` (${client.stateCode})` : ""}` : "—"}
                  readOnly
                />
              </label>
            </div>
            {client && (
              <p className="hint">
                {inv.gstMode === "inter"
                  ? "Client dusre state mein hai → IGST lagega."
                  : "Client aapke state mein hai → CGST + SGST lagega."}
              </p>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Invoice details</h2>
            </div>
            <div className="form-grid three">
              <label className="field">
                <span>Invoice number</span>
                <input className="input mono" value={inv.number} onChange={(e) => patch({ number: e.target.value })} />
              </label>
              <label className="field">
                <span>Invoice date</span>
                <input
                  type="date"
                  className="input"
                  value={inv.issueDate}
                  onChange={(e) => {
                    const issueDate = e.target.value;
                    patch({ issueDate, dueDate: addDays(issueDate, settings.defaultDueDays || 7) });
                  }}
                />
              </label>
              <label className="field">
                <span>Due date</span>
                <input type="date" className="input" value={inv.dueDate} onChange={(e) => patch({ dueDate: e.target.value })} />
              </label>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Line items</h2>
              <button className="link-btn" onClick={addItem}>+ Add item</button>
            </div>
            <div className="item-editor">
              <div className="ie-head">
                <span>Description</span>
                <span>Qty</span>
                <span>Rate (₹)</span>
                <span>Amount</span>
                <span />
              </div>
              {inv.items.map((it) => (
                <div className="ie-row" key={it.id}>
                  <input
                    className="input"
                    placeholder="e.g. Website redesign — 5 pages"
                    value={it.desc}
                    onChange={(e) => setItem(it.id, { desc: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={it.qty}
                    onChange={(e) => setItem(it.id, { qty: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.rate}
                    onChange={(e) => setItem(it.id, { rate: e.target.value })}
                  />
                  <span className="ie-amount">{inr((Number(it.qty) || 0) * (Number(it.rate) || 0))}</span>
                  <button className="icon-btn danger" title="Remove" onClick={() => removeItem(it.id)}>✕</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Tax &amp; discount</h2>
            </div>
            <div className="form-grid three">
              <label className="field">
                <span>Discount (%)</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={inv.discountPct}
                  onChange={(e) => patch({ discountPct: e.target.value })}
                />
              </label>
              <label className="field">
                <span>GST rate</span>
                <select className="input" value={inv.gstRate} onChange={(e) => patch({ gstRate: Number(e.target.value) })}>
                  {GST_RATES.map((r) => (
                    <option key={r} value={r}>{r}% {r === 18 ? "(most services)" : ""}</option>
                  ))}
                </select>
              </label>
              <div className="field">
                <span>GST type</span>
                <div className="segmented">
                  <button
                    type="button"
                    className={inv.gstMode !== "inter" ? "active" : ""}
                    onClick={() => patch({ gstMode: "intra" })}
                  >
                    CGST + SGST
                  </button>
                  <button
                    type="button"
                    className={inv.gstMode === "inter" ? "active" : ""}
                    onClick={() => patch({ gstMode: "inter" })}
                  >
                    IGST
                  </button>
                </div>
              </div>
            </div>
            <label className="field mt">
              <span>Notes (invoice par print honge)</span>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Thank you for your business! Payment via UPI preferred."
                value={inv.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>
          </section>
        </div>

        <aside className="editor-side">
          <div className="card summary">
            <h2>Summary</h2>
            <div className="trow"><span>Subtotal</span><span>{inr(t.subtotal)}</span></div>
            {t.discount > 0 && (
              <div className="trow"><span>Discount ({inv.discountPct}%)</span><span>− {inr(t.discount)}</span></div>
            )}
            <div className="trow"><span>Taxable</span><span>{inr(t.taxable)}</span></div>
            {t.intra ? (
              <>
                <div className="trow"><span>CGST {t.rate / 2}%</span><span>{inr(t.cgst)}</span></div>
                <div className="trow"><span>SGST {t.rate / 2}%</span><span>{inr(t.sgst)}</span></div>
              </>
            ) : (
              <div className="trow"><span>IGST {t.rate}%</span><span>{inr(t.igst)}</span></div>
            )}
            {Math.abs(t.roundOff) >= 0.01 && (
              <div className="trow"><span>Round off</span><span>{t.roundOff > 0 ? "+" : "−"} {inr(Math.abs(t.roundOff))}</span></div>
            )}
            <div className="trow total"><span>Total</span><span>{inr(t.total)}</span></div>
            <p className="words small muted">{amountInWords(t.total)}</p>

            {error && <p className="error">{error}</p>}

            <button className="btn btn-primary full" onClick={() => submit(true)}>
              Save &amp; preview invoice
            </button>
            <button className="btn full ghost" onClick={() => go("invoices")}>Cancel</button>
            <p className="small muted center">Preview se print / PDF download kar sakte ho.</p>
          </div>
        </aside>
      </div>

      {showClientModal && (
        <Modal title="New client" subtitle="Sirf naam zaroori hai, baaki baad mein bhar sakte ho." onClose={() => setShowClientModal(false)}>
          <div className="form-grid">
            <label className="field">
              <span>Business / client name *</span>
              <input className="input" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} autoFocus />
            </label>
            <label className="field">
              <span>Contact person</span>
              <input className="input" value={newClient.contact} onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </label>
            <label className="field">
              <span>GSTIN (optional)</span>
              <input className="input mono" value={newClient.gstin} onChange={(e) => setNewClient({ ...newClient, gstin: e.target.value.toUpperCase() })} />
            </label>
            <label className="field">
              <span>State</span>
              <select
                className="input"
                value={newClient.state}
                onChange={(e) => {
                  const map = STATE_CODES;
                  const state = e.target.value;
                  setNewClient({ ...newClient, state, stateCode: map[state] || "" });
                }}
              >
                {Object.keys(STATE_CODES).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field span2">
              <span>Address</span>
              <input className="input" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setShowClientModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNewClient}>Add client</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export const STATE_CODES = {
  "Andhra Pradesh": "37", "Arunachal Pradesh": "12", Assam: "18", Bihar: "10",
  Chandigarh: "04", Chhattisgarh: "22", Delhi: "07", Goa: "30", Gujarat: "24",
  Haryana: "06", "Himachal Pradesh": "02", "Jammu & Kashmir": "01", Jharkhand: "20",
  Karnataka: "29", Kerala: "32", "Madhya Pradesh": "23", Maharashtra: "27",
  Manipur: "14", Meghalaya: "17", Mizoram: "15", Nagaland: "13", Odisha: "21",
  Puducherry: "34", Punjab: "03", Rajasthan: "08", Sikkim: "11", "Tamil Nadu": "33",
  Telangana: "36", Tripura: "38", "Uttar Pradesh": "09", Uttarakhand: "05",
  "West Bengal": "19",
};
