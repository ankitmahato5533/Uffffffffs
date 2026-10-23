export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const inr = (n, decimals = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(+n) ? +n : 0);

export const compactInr = (n) => {
  const v = Math.abs(+n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (iso, days) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const monthKey = (iso) => (iso || "").slice(0, 7);

export const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short" });
};

/* ---------- GST + totals ---------- */
export const calcTotals = (inv) => {
  const items = inv.items || [];
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0
  );
  const discount = subtotal * ((Number(inv.discountPct) || 0) / 100);
  const taxable = Math.max(0, subtotal - discount);
  const rate = Number(inv.gstRate) || 0;
  const tax = taxable * (rate / 100);
  const rawTotal = Math.round((taxable + tax) * 100) / 100;
  const total = Math.round(rawTotal);
  const roundOff = total - rawTotal;
  const half = tax / 2;
  const intra = inv.gstMode !== "inter";
  return {
    subtotal,
    discount,
    taxable,
    rate,
    tax,
    cgst: intra ? half : 0,
    sgst: intra ? half : 0,
    igst: intra ? 0 : tax,
    intra,
    roundOff,
    total,
  };
};

export const amountInWords = (num) => {
  const n = Math.round((Number(num) || 0) * 100) / 100;
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const two = (x) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`);
  const three = (x) => {
    const h = Math.floor(x / 100);
    const rest = x % 100;
    return `${h ? ones[h] + " Hundred" : ""}${h && rest ? " " : ""}${rest ? two(rest) : ""}`;
  };

  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${three(lakh)} Lakh`);
  if (thousand) parts.push(`${three(thousand)} Thousand`);
  if (rest) parts.push(three(rest));

  let words = parts.join(" ") || "Zero";
  words += " Rupees";
  if (paise) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
};

/* ---------- invoice status ---------- */
export const invoiceStatus = (inv) => {
  if (inv.status === "paid" || inv.status === "draft") return inv.status;
  if (inv.dueDate && inv.dueDate < todayISO()) return "overdue";
  return "sent";
};

export const statusMeta = {
  paid: { label: "Paid", className: "st-paid" },
  sent: { label: "Sent", className: "st-sent" },
  overdue: { label: "Overdue", className: "st-overdue" },
  draft: { label: "Draft", className: "st-draft" },
};

export const upiLink = ({ upiId, name, amount, note }) => {
  const p = new URLSearchParams({
    pa: upiId || "",
    pn: name || "",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: note || "Invoice payment",
  });
  return `upi://pay?${p.toString()}`;
};

export const gstr1Csv = (invoices, clients, settings) => {
  const head = [
    "Invoice Number", "Invoice Date", "Client", "Client GSTIN", "Place of Supply",
    "Taxable Value", "GST Rate", "CGST", "SGST", "IGST", "Invoice Total", "Status",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = invoices
    .filter((inv) => inv.status !== "draft")
    .sort((a, b) => (a.issueDate < b.issueDate ? -1 : 1))
    .map((inv) => {
      const c = clients.find((x) => x.id === inv.clientId) || {};
      const t = calcTotals(inv);
      return [
        inv.number, inv.issueDate, c.name || "", c.gstin || "", c.state || settings.state,
        t.taxable.toFixed(2), t.rate, t.cgst.toFixed(2), t.sgst.toFixed(2), t.igst.toFixed(2),
        t.total.toFixed(2), invoiceStatus(inv),
      ].map(esc).join(",");
    });
  return [head.map(esc).join(","), ...rows].join("\n");
};

export const downloadFile = (filename, text, type = "application/json") => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
