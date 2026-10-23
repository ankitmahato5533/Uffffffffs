import { useRef, useState } from "react";
import { downloadFile, todayISO } from "../utils.js";
import { STATE_CODES } from "./Editor.jsx";

export default function Settings({ state, onUpdateSettings, onImport, onReset, toast }) {
  const { settings } = state;
  const [form, setForm] = useState(settings);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const set = (p) => setForm((f) => ({ ...f, ...p }));

  const save = () => {
    onUpdateSettings(form);
    setMsg("Saved! Sab changes ho gaye.");
    setTimeout(() => setMsg(""), 2500);
  };

  const exportJson = () => {
    downloadFile(
      `billkaro-backup-${todayISO()}.json`,
      JSON.stringify({ settings: form, clients: state.clients, invoices: state.invoices }, null, 2)
    );
    toast("Backup download ho gaya 📦");
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.settings || !Array.isArray(parsed.clients) || !Array.isArray(parsed.invoices)) {
          throw new Error("bad file");
        }
        onImport(parsed);
        setForm(parsed.settings);
        toast("Backup restore ho gaya ✅");
      } catch {
        toast("File sahi nahi hai — BillKaro ka JSON backup chuno.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="eyebrow">Setup</p>
          <h1>Business settings</h1>
          <p className="muted">Ye details har invoice par print hoti hain.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!dirty}>
          {dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      {msg && <div className="banner success">{msg}</div>}

      <div className="settings-grid">
        <section className="card">
          <div className="card-head"><h2>Business profile</h2></div>
          <div className="form-grid">
            <label className="field">
              <span>Business name *</span>
              <input className="input" value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
            </label>
            <label className="field">
              <span>Your name</span>
              <input className="input" value={form.ownerName} onChange={(e) => set({ ownerName: e.target.value })} />
            </label>
            <label className="field">
              <span>Tagline / services</span>
              <input className="input" value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </label>
            <label className="field">
              <span>GSTIN</span>
              <input className="input mono" value={form.gstin} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} />
            </label>
            <label className="field span2">
              <span>Address</span>
              <input className="input" value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </label>
            <label className="field">
              <span>State</span>
              <select
                className="input"
                value={form.state}
                onChange={(e) => set({ state: e.target.value, stateCode: STATE_CODES[e.target.value] || form.stateCode })}
              >
                {Object.keys(STATE_CODES).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span>PIN code</span>
              <input className="input" value={form.pincode} onChange={(e) => set({ pincode: e.target.value })} />
            </label>
            <label className="field span2">
              <span>UPI ID (invoice par QR banega)</span>
              <input className="input mono" placeholder="name@okhdfcbank" value={form.upiId} onChange={(e) => set({ upiId: e.target.value.trim() })} />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Invoice defaults</h2></div>
          <div className="form-grid">
            <label className="field">
              <span>Invoice prefix</span>
              <input className="input mono" value={form.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value.toUpperCase() })} />
            </label>
            <label className="field">
              <span>Next number</span>
              <input className="input" type="number" min="1" value={form.nextNumber} onChange={(e) => set({ nextNumber: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>Default GST rate</span>
              <select className="input" value={form.defaultGstRate} onChange={(e) => set({ defaultGstRate: Number(e.target.value) })}>
                {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </label>
            <label className="field">
              <span>Payment due (days)</span>
              <input className="input" type="number" min="0" value={form.defaultDueDays} onChange={(e) => set({ defaultDueDays: Number(e.target.value) })} />
            </label>
            <label className="field span2">
              <span>Terms &amp; conditions</span>
              <textarea className="input" rows={4} value={form.terms} onChange={(e) => set({ terms: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Your data</h2></div>
          <p className="muted small">
            Sab kuch aapke browser mein rehta hai — koi server nahi, koi login nahi. Backup lena zaroori hai.
          </p>
          <div className="stack">
            <button className="btn full" onClick={exportJson}>⬇ Export backup (.json)</button>
            <button className="btn full" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
            <button
              className="btn full danger-ghost"
              onClick={() => {
                if (confirm("Sab clients + invoices delete ho jayenge aur demo data wapas aa jayega. Pakka?")) {
                  const fresh = onReset();
                  setForm(fresh.settings);
                  toast("Fresh start! Demo data reload ho gaya.");
                }
              }}
            >
              Reset all data
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Plan</h2></div>
          <div className="plan-badge">
            <div>
              <strong>{settings.plan === "pro" ? "BillKaro Pro" : "Free plan"}</strong>
              <p className="muted small">
                {settings.plan === "pro" ? "Sab features unlocked. Thank you!" : "Unlimited invoices, UPI QR, GST reports."}
              </p>
            </div>
            <span className={`pill ${settings.plan === "pro" ? "st-paid" : "st-sent"}`}>
              {settings.plan === "pro" ? "PRO" : "FREE"}
            </span>
          </div>
          <p className="small muted">
            Pro mein: custom branding, recurring invoices, WhatsApp reminders, GST filing export.
          </p>
        </section>
      </div>
    </div>
  );
}
