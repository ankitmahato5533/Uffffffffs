# BillKaro 💸

**GST invoices + UPI payments for Indian freelancers.** Invoice banao 30 second mein, QR bhejo, paisa seedha bank mein lo.

> Ye ek poora, chalne wala SaaS product hai — billing engine, GST math, UPI QR, client management, PDF, GST report, pricing page, sab kuch. Aage isko bech kar paise kamane ka plan neeche hai.

---

## Kya-kya hai isme

| Feature | Detail |
|---|---|
| 🧾 **GST invoice** | CGST+SGST (intra-state) / IGST (inter-state) auto-detect client ke state se |
| 📱 **UPI QR on invoice** | `upi://pay` link se live QR — GPay/PhonePe/Paytm scan karke exact amount pay kare |
| 🖨 **Print / Save as PDF** | A4 print CSS, browser se seedha PDF |
| 👥 **Clients** | GSTIN, state code, contact, billed total |
| 📊 **Dashboard** | Received / pending / overdue, 6-month chart, top clients |
| 🎯 **Payment tracking** | Sent, overdue (due date se auto), paid — one-click mark paid |
| 📤 **WhatsApp + Email share** | Pre-filled message with amount + UPI ID |
| ⬇ **GST report (CSV)** | CA ko GSTR-1 ke liye ready export |
| 🔁 **Duplicate invoice** | Retainer clients ke liye ek click |
| 🎨 **Pro gating** | Footer branding hatao, unlimited everything |
| 💾 **100% local** | Data browser ke localStorage mein — koi server, koi login, koi data leak nahi |
| 📦 **Backup / restore** | JSON export/import |
| 📱 **Mobile-first** | Phone par bottom nav, table scroll, invoice responsive |

## Chalane ke liye

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
```

Deploy: `dist/` ko Vercel / Netlify / Cloudflare Pages par drag-drop kar do. Koi backend nahi chahiye.

---

## 💰 Isse paisa kaise kamana hai (step-by-step)

### 1. Pricing jo already app mein hai
- **Free** — unlimited invoices + UPI QR. Footer par chhota "Made with BillKaro" (free marketing).
- **Pro ₹499/year** (~₹42/month) — branding remove, WhatsApp reminders, recurring invoices, GST report, multi-user.
- ₹499 isliye ki Indian freelancer ke mann mein "ek invoice ke paise se kam" lagta hai. Impulse buy.

### 2. Payment lena (Razorpay — 15 min setup)
1. [razorpay.com](https://razorpay.com) par business account banao (PAN + bank details).
2. Dashboard → **Payment Links** → ₹499 ka yearly link banao (UPI + cards on).
3. `src/App.jsx` mein `Unlock Pro (demo)` button ko us payment link se replace karo (`window.location.href = LINK`). Actually live version mein payment ke baad hi Pro unlock karo — Razorpay webhook + ek chhota backend (Vercel function) se licence key generate karo.
4. Test mode se pehle khud ek ₹1 payment karke flow check karo.

> Alternative: **Lemon Squeezy / Gumroad** — international + Indian cards, licence keys built-in, zero backend. 5% fee leta hai but 1 din mein live ho jaata hai.

### 3. Pehle 10 customers kahan se
- **Apne circle**: Durgapur/Kolkata ke photographers, CA, interior designers, gym owners, coaching centres — inko GST invoice chahiye hi chahiye. Personal demo dikhao, free Pro 3 mahine do.
- **WhatsApp/Telegram groups**: "Indian Freelancers", "Designers of India", Startup India groups. Spam nahi — ek helpful post: "GST invoice + UPI QR banana ka free tool banaya, feedback do."
- **Instagram Reels** (Hindi/Bengali): 30-sec screen recording — "Client ko invoice bhejna ab 30 second ka kaam". Hook: "Ye galti mat karo — invoice par UPI QR nahi tha!".
- **r/IndiaFreelance, r/india, r/developersIndia** — value-first post.
- **Cold DM 20/day**: Instagram par "designer" + "Kolkata" search → DM: "Aapke portfolio dekha. Invoice + payment reminder ka free tool banaya hai freelancers ke liye — try karna chahoge?"
- **CA tie-up**: ek CA ke 50 clients hote hain. CA ko free Pro do, wo apne clients ko suggest karega. Ye sabse fast channel hai.

### 4. Conversion tricks (already built-in)
- Free plan par invoice footer mein "Made with BillKaro" → har invoice client ko dikhta hai (viral loop).
- Upgrade page par Pro features ki list + money-back guarantee.
- Dashboard par "pending amount" dikhta hai → user ko reminder bhejne ka mann karta hai → Pro.

### 5. Upsell ladder
| Plan | Price | Kya |
|---|---|---|
| Free | ₹0 | Unlimited invoices, UPI QR, PDF |
| Pro | ₹499/yr | No branding, reminders, recurring, GST report |
| Business | ₹1,499/yr | 5 users, roles, client portal, priority support |
| One-time setup | ₹999 | Aap unka logo/letterhead invoice template bana do |

### 6. Realistic numbers
- 1,000 free users → 3–5% Pro convert → 30–50 × ₹499 ≈ **₹15k–₹25k/year** shuru mein.
- 10,000 users → ~400 Pro ≈ **₹2 lakh/year**, plus Business plan.
- Sabse zyada paisa **CA/agency tie-ups** se aata hai — ek CA 50–200 clients laa sakta hai.

---

## Kabhi mat karna
- Invoice data server par bhejna without consent — privacy hi selling point hai.
- Client ke GSTIN ko validate kiye bina "GSTIN verified" bolna.
- Fake urgency/paywall free features par — freelancers turant churn karte hain.

## Roadmap (agla kaam)
- [ ] Logo upload + custom invoice template (Pro)
- [ ] Recurring invoices (retainers) — cron on serverless
- [ ] WhatsApp Cloud API reminders (paid add-on)
- [ ] Razorpay checkout + licence key backend
- [ ] Tally/Zoho export
- [ ] Multi-currency for international clients

---

## Tech
React 19 + Vite. No backend, no auth, no tracking. Data localStorage mein (`billkaro.v1`).
Invoice math `src/utils.js` mein — GST, round-off, amount-in-words (Indian numbering: lakh/crore).

> ⚠️ GST rates aur invoice format CA se ek baar verify karwa lena — ye tool calculation karta hai, tax advice nahi deta.
