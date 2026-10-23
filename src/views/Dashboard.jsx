import { useMemo } from "react";
import {
  calcTotals, compactInr, fmtDate, invoiceStatus, inr, monthKey, monthLabel, todayISO,
  statusMeta,
} from "../utils.js";

export default function Dashboard({ state, go, onPreview }) {
  const { invoices, clients, settings } = state;

  const stats = useMemo(() => {
    let received = 0;
    let pending = 0;
    let overdue = 0;
    let thisMonth = 0;
    const mk = monthKey(todayISO());
    for (const inv of invoices) {
      const t = calcTotals(inv).total;
      const st = invoiceStatus(inv);
      if (st === "paid") received += t;
      if (st === "sent") pending += t;
      if (st === "overdue") {
        pending += t;
        overdue += t;
      }
      if (monthKey(inv.issueDate) === mk && st !== "draft") thisMonth += t;
    }
    return { received, pending, overdue, thisMonth };
  }, [invoices]);

  const chart = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const data = months.map((m) => {
      let billed = 0;
      let paid = 0;
      invoices.forEach((inv) => {
        if (monthKey(inv.issueDate) !== m || inv.status === "draft") return;
        const t = calcTotals(inv).total;
        billed += t;
        if (invoiceStatus(inv) === "paid") paid += t;
      });
      return { key: m, billed, paid };
    });
    const max = Math.max(...data.map((d) => d.billed), 1);
    return { data, max };
  }, [invoices]);

  const recent = useMemo(
    () =>
      [...invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)).slice(0, 5),
    [invoices]
  );

  const topClients = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.status === "draft") return;
      const t = calcTotals(inv).total;
      map.set(inv.clientId, (map.get(inv.clientId) || 0) + t);
    });
    return [...map.entries()]
      .map(([id, amt]) => ({ client: clients.find((c) => c.id === id), amt }))
      .filter((x) => x.client)
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 4);
  }, [invoices, clients]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="eyebrow">{greet}, {settings.ownerName?.split(" ")[0] || "boss"} 👋</p>
          <h1>Your money, at a glance</h1>
          <p className="muted">
            {stats.pending > 0
              ? `${inr(stats.pending, 0)} is still sitting with clients. Ek reminder bhej do?`
              : "Sab clear hai. New invoice banao aur kamai badhao."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => go("editor", { isNew: true })}>
          + New invoice
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Received</span>
          <strong className="stat-value">{compactInr(stats.received)}</strong>
          <span className="stat-sub up">paid invoices</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pending</span>
          <strong className="stat-value">{compactInr(stats.pending)}</strong>
          <span className="stat-sub">{inr(stats.overdue, 0)} overdue</span>
        </div>
        <div className="stat">
          <span className="stat-label">Billed this month</span>
          <strong className="stat-value">{compactInr(stats.thisMonth)}</strong>
          <span className="stat-sub">
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Invoices</span>
          <strong className="stat-value">{invoices.length}</strong>
          <span className="stat-sub">{clients.length} clients</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="card chart-card">
          <div className="card-head">
            <div>
              <h2>Last 6 months</h2>
              <p className="muted small">Billed vs received</p>
            </div>
            <div className="legend">
              <span><i className="dot dot-billed" /> Billed</span>
              <span><i className="dot dot-paid" /> Paid</span>
            </div>
          </div>
          <div className="chart">
            {chart.data.map((d) => (
              <div className="bar-col" key={d.key} title={`${monthLabel(d.key)}: ${inr(d.billed, 0)}`}>
                <div className="bar-track">
                  <div
                    className="bar-total"
                    style={{ height: `${Math.max(4, (d.billed / chart.max) * 100)}%` }}
                  >
                    <div
                      className="bar-paid"
                      style={{ height: `${d.billed ? (d.paid / d.billed) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="bar-label">{monthLabel(d.key)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Top clients</h2>
            <button className="link-btn" onClick={() => go("clients")}>All clients →</button>
          </div>
          <ul className="client-rank">
            {topClients.map(({ client, amt }, i) => (
              <li key={client.id}>
                <span className={`rank rank-${i + 1}`}>{i + 1}</span>
                <div className="cr-main">
                  <strong>{client.name}</strong>
                  <span className="muted small">{client.state}</span>
                </div>
                <span className="cr-amt">{compactInr(amt)}</span>
              </li>
            ))}
            {topClients.length === 0 && <li className="muted">No invoices yet.</li>}
          </ul>
        </section>

        <section className="card recent-card">
          <div className="card-head">
            <h2>Recent invoices</h2>
            <button className="link-btn" onClick={() => go("invoices")}>View all →</button>
          </div>
          <div className="recent-list">
            {recent.map((inv) => {
              const client = clients.find((c) => c.id === inv.clientId);
              const st = invoiceStatus(inv);
              const t = calcTotals(inv);
              return (
                <button className="recent-row" key={inv.id} onClick={() => onPreview(inv)}>
                  <div className="avatar">{(client?.name || "?").slice(0, 2).toUpperCase()}</div>
                  <div className="rr-main">
                    <strong>{client?.name || "No client"}</strong>
                    <span className="muted small">
                      {inv.number} · {fmtDate(inv.issueDate)}
                    </span>
                  </div>
                  <span className="rr-amt">{inr(t.total)}</span>
                  <span className={`pill ${statusMeta[st].className}`}>{statusMeta[st].label}</span>
                </button>
              );
            })}
            {recent.length === 0 && (
              <p className="muted">No invoices yet — create your first one.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
