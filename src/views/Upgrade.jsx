import { useState } from "react";

const FEATURES = [
  ["Unlimited GST invoices", true, true],
  ["UPI QR on every invoice", true, true],
  ["PDF download & print", true, true],
  ["Client + payment tracking", true, true],
  ["Custom logo & branding", false, true],
  ["Remove “Made with BillKaro”", false, true],
  ["Recurring invoices (retainers)", false, true],
  ["WhatsApp payment reminders", false, true],
  ["GST report (GSTR-1 ready)", false, true],
  ["Multi-user / team login", false, true],
];

export default function Upgrade({ state, onUpgrade, toast }) {
  const [plan, setPlan] = useState("yearly");
  const isPro = state.settings.plan === "pro";

  const price = plan === "yearly" ? 499 : 99;

  return (
    <div className="view upgrade">
      <div className="upgrade-hero">
        <span className="pill st-sent">BillKaro Pro</span>
        <h1>Freelancing ki billing, <span className="grad">10x fast</span></h1>
        <p className="muted">
          Invoice banao, UPI QR bhejo, payment track karo. CA ko GST report export karo — sab ek app mein.
        </p>

        <div className="segmented price-toggle">
          <button className={plan === "monthly" ? "active" : ""} onClick={() => setPlan("monthly")}>
            Monthly ₹99
          </button>
          <button className={plan === "yearly" ? "active" : ""} onClick={() => setPlan("yearly")}>
            Yearly ₹499 <em>save 58%</em>
          </button>
        </div>

        <div className="price-card">
          <div className="price">
            <span className="cur">₹</span>
            {price}
            <span className="per">/{plan === "yearly" ? "year" : "month"}</span>
          </div>
          <p className="muted small">
            {plan === "yearly" ? "₹41.6/month · 7-day money back" : "Cancel anytime · 7-day money back"}
          </p>
          <ul className="feat-list">
            {FEATURES.map(([label, free, pro]) => (
              <li key={label} className={!free && plan === "yearly" ? "hot" : ""}>
                <span className={pro ? "tick on" : "tick"}>{pro ? "✓" : "—"}</span>
                {label}
                {!free && <span className="pro-tag">PRO</span>}
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary full lg"
            onClick={() => {
              if (isPro) return toast("Aap already Pro ho 🎉");
              onUpgrade(price, plan);
            }}
          >
            {isPro ? "You're on Pro 🎉" : `Upgrade for ₹${price}`}
          </button>
          <p className="small muted center">
            Razorpay / UPI checkout — integrate karke live payments lena.
          </p>
        </div>
      </div>

      <div className="card faq">
        <h2>Pricing FAQ</h2>
        <details>
          <summary>Free plan kaun le sakta hai?</summary>
          <p>Har freelancer. Free plan mein unlimited invoices + UPI QR milta hai, bas “Made with BillKaro” footer rehta hai.</p>
        </details>
        <details>
          <summary>GST invoice legally valid hai?</summary>
          <p>Haan — invoice mein aapka GSTIN, client GSTIN, place of supply, CGST/SGST ya IGST split, aur amount in words sab hota hai. CA se ek baar verify karwa lena.</p>
        </details>
        <details>
          <summary>Payment kaise collect hota hai?</summary>
          <p>Invoice par UPI QR hota hai. Client GPay/PhonePe se scan karke exact amount pay karta hai — paisa seedha aapke bank mein.</p>
        </details>
        <details>
          <summary>Mera data kahan jaata hai?</summary>
          <p>Kahi nahi. Sab aapke browser (localStorage) mein rehta hai. Backup JSON export kar sakte ho.</p>
        </details>
      </div>
    </div>
  );
}
