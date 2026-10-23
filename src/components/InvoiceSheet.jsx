import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { calcTotals, inr, fmtDate, amountInWords, upiLink, invoiceStatus } from "../utils.js";

export default function InvoiceSheet({ invoice, client, settings, watermark = true }) {
  const t = calcTotals(invoice);
  const [qr, setQr] = useState("");
  const status = invoiceStatus(invoice);
  const isPaid = status === "paid";

  useEffect(() => {
    const link = upiLink({
      upiId: settings.upiId,
      name: settings.businessName,
      amount: t.total,
      note: `${invoice.number} ${settings.businessName}`,
    });
    QRCode.toDataURL(link, {
      width: 240,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [settings.upiId, settings.businessName, t.total, invoice.number]);

  return (
    <div className="sheet" id="invoice-sheet">
      <div className="sheet-top-accent" />
      <header className="sheet-head">
        <div>
          <div className="sheet-brand">
            <div className="sheet-logo">{(settings.businessName || "B").slice(0, 1)}</div>
            <div>
              <h1>{settings.businessName || "Your Business"}</h1>
              <p className="muted">{settings.tagline}</p>
            </div>
          </div>
          <div className="sheet-biz-meta">
            <span>{settings.address}</span>
            <span>
              {settings.state} {settings.pincode}
            </span>
            <span>{settings.email}</span>
            <span>{settings.phone}</span>
            {settings.gstin && <span className="mono">GSTIN: {settings.gstin}</span>}
          </div>
        </div>
        <div className="sheet-title">
          <h2>TAX INVOICE</h2>
          <table className="meta-table">
            <tbody>
              <tr>
                <td>Invoice #</td>
                <td className="mono">{invoice.number}</td>
              </tr>
              <tr>
                <td>Invoice date</td>
                <td>{fmtDate(invoice.issueDate)}</td>
              </tr>
              <tr>
                <td>Due date</td>
                <td>{fmtDate(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td>Place of supply</td>
                <td>
                  {client?.state || settings.state}
                  {client?.stateCode ? ` (${client.stateCode})` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </header>

      <section className="sheet-parties">
        <div className="bill-block">
          <h3>Bill to</h3>
          <strong>{client?.name || "—"}</strong>
          {client?.contact && <span>Attn: {client.contact}</span>}
          <span>{client?.address}</span>
          <span>
            {client?.state}
            {client?.stateCode ? ` (${client.stateCode})` : ""}
          </span>
          {client?.gstin && <span className="mono">GSTIN: {client.gstin}</span>}
          {client?.email && <span>{client.email}</span>}
        </div>
        <div className={`due-card ${isPaid ? "paid" : ""}`}>
          <span>{isPaid ? "Amount received" : "Amount due"}</span>
          <strong>{inr(t.total)}</strong>
          <em>
            {isPaid ? "Thank you!" : `Due by ${fmtDate(invoice.dueDate)}`}
          </em>
        </div>
      </section>

      <table className="items">
        <thead>
          <tr>
            <th className="c-idx">#</th>
            <th>Description</th>
            <th className="c-num">Qty</th>
            <th className="c-num">Rate</th>
            <th className="c-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={it.id || i}>
              <td className="c-idx">{i + 1}</td>
              <td>{it.desc || <span className="muted">Untitled item</span>}</td>
              <td className="c-num">{Number(it.qty) || 0}</td>
              <td className="c-num">{inr(it.rate, 2)}</td>
              <td className="c-num">{inr((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="sheet-bottom">
        <div className="pay-block">
          <h3>Pay via UPI</h3>
          <div className="qr-wrap">
            {qr ? <img src={qr} alt="UPI QR code" /> : <div className="qr-skeleton" />}
            <div className="pay-details">
              <span className="muted">Scan with any UPI app</span>
              <strong className="mono">{settings.upiId}</strong>
              <span className="muted">GPay · PhonePe · Paytm · Bank apps</span>
              <span className="pay-amt">{inr(t.total)}</span>
            </div>
          </div>
        </div>

        <div className="totals">
          <div className="trow">
            <span>Subtotal</span>
            <span>{inr(t.subtotal)}</span>
          </div>
          {t.discount > 0 && (
            <div className="trow">
              <span>Discount ({invoice.discountPct}%)</span>
              <span>− {inr(t.discount)}</span>
            </div>
          )}
          <div className="trow">
            <span>Taxable value</span>
            <span>{inr(t.taxable)}</span>
          </div>
          {t.intra ? (
            <>
              <div className="trow">
                <span>CGST @ {t.rate / 2}%</span>
                <span>{inr(t.cgst)}</span>
              </div>
              <div className="trow">
                <span>SGST @ {t.rate / 2}%</span>
                <span>{inr(t.sgst)}</span>
              </div>
            </>
          ) : (
            <div className="trow">
              <span>IGST @ {t.rate}%</span>
              <span>{inr(t.igst)}</span>
            </div>
          )}
          {Math.abs(t.roundOff) >= 0.01 && (
            <div className="trow">
              <span>Round off</span>
              <span>{t.roundOff > 0 ? "+" : "−"} {inr(Math.abs(t.roundOff))}</span>
            </div>
          )}
          <div className="trow total">
            <span>Total</span>
            <span>{inr(t.total)}</span>
          </div>
          {isPaid && (
            <div className="trow paid-row">
              <span>Amount paid</span>
              <span>− {inr(t.total)}</span>
            </div>
          )}
        </div>
      </section>

      <p className="words">
        <strong>Amount in words:</strong> {amountInWords(t.total)}
      </p>

      {invoice.notes && (
        <div className="sheet-notes">
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className="sheet-terms">
        <h3>Terms &amp; conditions</h3>
        <p>{settings.terms}</p>
      </div>

      <footer className="sheet-foot">
        <div>
          <span className="muted">This is a computer-generated invoice.</span>
          {watermark && <span className="muted"> · Generated with BillKaro</span>}
        </div>
        <div className="sign">
          <span>For {settings.businessName}</span>
          <span className="sign-line">Authorised signatory</span>
        </div>
      </footer>
    </div>
  );
}
