import { useMemo, useState } from "react";
import {
  calcTotals, downloadFile, fmtDate, gstr1Csv, inr, invoiceStatus, statusMeta, todayISO,
} from "../utils.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sent", label: "Sent" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Drafts" },
];

export default function Invoices({ state, go, onPreview, onMarkPaid, onDuplicate, onDelete }) {
  const { invoices, clients, settings } = state;
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return invoices
      .filter((inv) => (filter === "all" ? true : invoiceStatus(inv) === filter))
      .filter((inv) => {
        if (!q.trim()) return true;
        const client = clients.find((c) => c.id === inv.clientId);
        const needle = q.toLowerCase();
        return (
          inv.number.toLowerCase().includes(needle) ||
          (client?.name || "").toLowerCase().includes(needle) ||
          (client?.email || "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [invoices, clients, filter, q]);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="eyebrow">Billing</p>
          <h1>Invoices</h1>
          <p className="muted">GST-ready invoices, UPI payment link ke saath.</p>
        </div>
        <button className="btn btn-primary" onClick={() => go("editor", { isNew: true })}>
          + New invoice
        </button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`tab ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className="tab-count">
                {f.id === "all"
                  ? invoices.length
                  : invoices.filter((i) => invoiceStatus(i) === f.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <input
            className="input search"
            placeholder="Search invoice # or client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn sm"
            title="Download GST report for your CA"
            onClick={() => {
              const csv = gstr1Csv(invoices, clients, settings);
              downloadFile(`gst-report-${todayISO()}.csv`, csv, "text/csv");
            }}
          >
            ⬇ GST report
          </button>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Date</th>
              <th>Due</th>
              <th className="c-num">Amount</th>
              <th>Status</th>
              <th className="c-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const client = clients.find((c) => c.id === inv.clientId);
              const st = invoiceStatus(inv);
              return (
                <tr key={inv.id}>
                  <td>
                    <button className="num-link mono" onClick={() => onPreview(inv)}>
                      {inv.number}
                    </button>
                  </td>
                  <td>
                    <div className="cell-client">
                      <span className="avatar sm">{(client?.name || "?").slice(0, 2).toUpperCase()}</span>
                      <span>{client?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="muted">{fmtDate(inv.issueDate)}</td>
                  <td className="muted">{fmtDate(inv.dueDate)}</td>
                  <td className="c-num strong">{inr(calcTotals(inv).total)}</td>
                  <td>
                    <span className={`pill ${statusMeta[st].className}`}>{statusMeta[st].label}</span>
                  </td>
                  <td className="c-actions">
                    <div className="row-actions">
                      <button className="icon-btn" title="Preview" onClick={() => onPreview(inv)}>👁</button>
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => go("editor", { invoice: inv })}
                      >
                        ✎
                      </button>
                      {st !== "paid" && (
                        <button
                          className="icon-btn success"
                          title="Mark as paid"
                          onClick={() => onMarkPaid(inv.id)}
                        >
                          ✓
                        </button>
                      )}
                      <button className="icon-btn" title="Duplicate" onClick={() => onDuplicate(inv)}>
                        ⧉
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete invoice ${inv.number}? Ye wapas nahi aayega.`)) onDelete(inv.id);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">
                    <span className="empty-emoji">🧾</span>
                    <strong>Koi invoice nahi mila</strong>
                    <p className="muted">Filter badlo ya naya invoice banao.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
