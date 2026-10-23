import { useEffect, useMemo, useState } from "react";
import { loadStore, saveStore, resetStore } from "./store.js";
import { addDays, calcTotals, fmtDate, inr, todayISO, uid } from "./utils.js";
import Dashboard from "./views/Dashboard.jsx";
import Invoices from "./views/Invoices.jsx";
import Editor from "./views/Editor.jsx";
import Clients from "./views/Clients.jsx";
import Settings from "./views/Settings.jsx";
import Upgrade from "./views/Upgrade.jsx";
import InvoiceSheet from "./components/InvoiceSheet.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "invoices", label: "Invoices", icon: "🧾" },
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "upgrade", label: "Pro", icon: "⚡" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function App() {
  const [state, setState] = useState(loadStore);
  const [route, setRoute] = useState({ name: "dashboard" });
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => saveStore(state), [state]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const go = (name, params = {}) => {
    if (name === "editor") {
      setRoute({ name, params });
      return;
    }
    setRoute({ name, params });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const blankInvoice = (clientId = "") => {
    const { settings } = state;
    const year = new Date().getFullYear();
    const client = state.clients.find((c) => c.id === clientId);
    const inter = client && client.stateCode && client.stateCode !== settings.stateCode;
    return {
      id: uid(),
      isNew: true,
      number: `${settings.invoicePrefix}-${year}-${String(settings.nextNumber).padStart(3, "0")}`,
      clientId,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), settings.defaultDueDays || 7),
      items: [{ id: uid(), desc: "", qty: 1, rate: 0 }],
      discountPct: 0,
      gstRate: settings.defaultGstRate ?? 18,
      gstMode: inter ? "inter" : "intra",
      status: "draft",
      notes: "",
    };
  };

  const editorInitial = useMemo(() => {
    if (route.name !== "editor") return null;
    if (route.params?.invoice) return { ...route.params.invoice, isNew: false };
    return blankInvoice(route.params?.clientId || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const saveInvoice = (inv, andPreview) => {
    const exists = state.invoices.some((i) => i.id === inv.id);
    setState((prev) => {
      const cleanInv = { ...inv };
      delete cleanInv.isNew;
      return {
        ...prev,
        invoices: exists
          ? prev.invoices.map((i) => (i.id === inv.id ? cleanInv : i))
          : [...prev.invoices, cleanInv],
        settings: exists
          ? prev.settings
          : { ...prev.settings, nextNumber: (prev.settings.nextNumber || 1) + 1 },
      };
    });
    showToast(andPreview ? "Invoice ready — preview neeche hai 🧾" : "Invoice saved ✅");
    go("invoices");
    if (andPreview) setPreview({ ...inv, isNew: undefined });
  };

  const markPaid = (id) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === id ? { ...i, status: "paid" } : i)),
    }));
    setPreview((p) => (p && p.id === id ? { ...p, status: "paid" } : p));
    showToast("Payment received 🎉 Paisa aa gaya!");
  };

  const duplicate = (inv) => {
    const { settings } = state;
    const year = new Date().getFullYear();
    const copy = {
      ...inv,
      id: uid(),
      number: `${settings.invoicePrefix}-${year}-${String(settings.nextNumber).padStart(3, "0")}`,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), settings.defaultDueDays || 7),
      status: "draft",
      items: inv.items.map((it) => ({ ...it, id: uid() })),
    };
    setState((prev) => ({
      ...prev,
      invoices: [...prev.invoices, copy],
      settings: { ...prev.settings, nextNumber: (prev.settings.nextNumber || 1) + 1 },
    }));
    showToast("Invoice duplicate ho gaya ⧉");
  };

  const deleteInvoice = (id) => {
    setState((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }));
    showToast("Invoice delete ho gaya");
  };

  const saveClient = (client) => {
    setState((prev) => {
      const exists = prev.clients.some((c) => c.id === client.id);
      return {
        ...prev,
        clients: exists
          ? prev.clients.map((c) => (c.id === client.id ? client : c))
          : [...prev.clients, client],
      };
    });
    showToast("Client saved ✅");
  };

  const deleteClient = (id) => {
    setState((prev) => ({ ...prev, clients: prev.clients.filter((c) => c.id !== id) }));
    showToast("Client removed");
  };

  const updateSettings = (patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">₹</div>
          <div>
            <strong>BillKaro</strong>
            <span>Invoice. UPI. Done.</span>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${route.name === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
              {n.id === "upgrade" && <span className="nav-badge">PRO</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="plan-card">
            <strong>{state.settings.plan === "pro" ? "Pro plan" : "Free plan"}</strong>
            <p className="small muted">
              {state.settings.plan === "pro"
                ? "Sab features unlocked."
                : "Unlimited invoices, UPI QR, PDF."}
            </p>
            {state.settings.plan !== "pro" && (
              <button className="btn sm btn-primary full" onClick={() => go("upgrade")}>
                Upgrade ₹499/yr
              </button>
            )}
          </div>
          <div className="user-row">
            <div className="avatar sm">{state.settings.businessName.slice(0, 2).toUpperCase()}</div>
            <div className="ur-main">
              <strong>{state.settings.businessName}</strong>
              <span className="muted small">{state.settings.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-bar">
          <div className="brand">
            <div className="brand-mark">₹</div>
            <strong>BillKaro</strong>
          </div>
          <button className="btn sm btn-primary" onClick={() => go("editor", { isNew: true })}>
            + Invoice
          </button>
        </div>

        {route.name === "dashboard" && (
          <Dashboard state={state} go={go} onPreview={setPreview} />
        )}
        {route.name === "invoices" && (
          <Invoices
            state={state}
            go={go}
            onPreview={setPreview}
            onMarkPaid={markPaid}
            onDuplicate={duplicate}
            onDelete={deleteInvoice}
          />
        )}
        {route.name === "editor" && editorInitial && (
          <Editor
            key={editorInitial.id}
            initial={editorInitial}
            state={state}
            go={go}
            onSave={saveInvoice}
            onAddClient={saveClient}
          />
        )}
        {route.name === "clients" && (
          <Clients
            state={state}
            go={go}
            onSaveClient={saveClient}
            onDeleteClient={deleteClient}
          />
        )}
        {route.name === "settings" && (
          <Settings
            state={state}
            onUpdateSettings={updateSettings}
            onImport={(data) => {
              setState((prev) => ({
                settings: { ...prev.settings, ...data.settings },
                clients: data.clients,
                invoices: data.invoices,
              }));
            }}
            onReset={() => {
              const fresh = resetStore();
              setState(fresh);
              return fresh;
            }}
            toast={showToast}
          />
        )}
        {route.name === "upgrade" && (
          <Upgrade
            state={state}
            toast={showToast}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={route.name === n.id ? "active" : ""}
            onClick={() => go(n.id)}
          >
            <span>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {preview && (
        <PreviewModal
          invoice={preview}
          state={state}
          onClose={() => setPreview(null)}
          onMarkPaid={() => markPaid(preview.id)}
          onEdit={() => {
            const inv = state.invoices.find((i) => i.id === preview.id) || preview;
            setPreview(null);
            go("editor", { invoice: inv });
          }}
          toast={showToast}
        />
      )}

      {upgradeOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setUpgradeOpen(false)}>
          <div className="modal">
            <header className="modal-head">
              <div>
                <h2>Checkout</h2>
                <p className="muted">Demo mode — Razorpay/UPI integration yahan aayega.</p>
              </div>
              <button className="icon-btn" onClick={() => setUpgradeOpen(false)}>✕</button>
            </header>
            <div className="modal-body">
              <div className="checkout-box">
                <strong>BillKaro Pro</strong>
                <span className="muted small">Unlimited everything · GST reports · WhatsApp reminders</span>
              </div>
              <p className="small muted">
                Is demo mein payment gateway connected nahi hai. Live karne ke liye Razorpay account
                banao, payment link banao, aur is button ko us link se replace karo. README mein steps hain.
              </p>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setUpgradeOpen(false)}>Later</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    updateSettings({ plan: "pro" });
                    setUpgradeOpen(false);
                    showToast("Pro unlocked (demo) ⚡");
                  }}
                >
                  Unlock Pro (demo)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function PreviewModal({ invoice, state, onClose, onMarkPaid, onEdit, toast }) {
  const client = state.clients.find((c) => c.id === invoice.clientId);
  const t = calcTotals(invoice);
  const phone = (client?.phone || "").replace(/\D/g, "");
  const message = `Namaste ${client?.contact || client?.name || "ji"},\n\nInvoice ${invoice.number} — ${inr(t.total)}\nDue: ${fmtDate(invoice.dueDate)}\n\nPay via UPI: ${state.settings.upiId}\n\nDhanyavaad,\n${state.settings.businessName}`;
  const wa = `https://wa.me/${phone ? "91" + phone.replace(/^91/, "") : ""}?text=${encodeURIComponent(message)}`;
  const mail = `mailto:${client?.email || ""}?subject=${encodeURIComponent(
    `Invoice ${invoice.number} from ${state.settings.businessName}`
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="preview">
      <div className="preview-bar no-print">
        <button className="btn ghost" onClick={onClose}>← Back</button>
        <div className="pv-title">
          <strong>{invoice.number}</strong>
          <span className="muted small">{client?.name}</span>
        </div>
        <div className="pv-actions">
          <button className="btn sm" onClick={onEdit}>Edit</button>
          {invoice.status !== "paid" && (
            <button className="btn sm success" onClick={onMarkPaid}>Mark paid</button>
          )}
          <a className="btn sm" href={mail} title="Email invoice">✉</a>
          <a
            className="btn sm"
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={() => toast("WhatsApp khul raha hai — PDF attach kar dena 📎")}
          >
            WhatsApp
          </a>
          <button className="btn sm btn-primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <div className="preview-scroll">
        <InvoiceSheet
          invoice={invoice}
          client={client}
          settings={state.settings}
          watermark={state.settings.plan !== "pro"}
        />
      </div>
    </div>
  );
}
