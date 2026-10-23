import { uid, addDays, todayISO } from "./utils.js";

const KEY = "billkaro.v1";

const defaultSettings = {
  businessName: "PixelPandit Studio",
  ownerName: "Aarav Mehta",
  tagline: "Websites & Brand Design",
  email: "hello@pixelpandit.in",
  phone: "+91 98300 12345",
  address: "42, Bidhan Sarani, Kolkata",
  state: "West Bengal",
  stateCode: "19",
  pincode: "700006",
  gstin: "19ABCDE1234F1Z5",
  upiId: "pixelpandit@okhdfcbank",
  invoicePrefix: "INV",
  nextNumber: 6,
  defaultGstRate: 18,
  defaultDueDays: 7,
  terms:
    "Payment via UPI or bank transfer. 50% advance, balance on delivery. Late payments attract 2% monthly interest.",
  plan: "free",
};

const seedClients = () => [
  {
    id: "c1",
    name: "Nimbus Foods Pvt Ltd",
    contact: "Riya Sharma",
    email: "riya@nimbusfoods.in",
    phone: "+91 99001 22334",
    gstin: "19AABCN1234M1Z2",
    address: "7A, Park Street, Kolkata",
    state: "West Bengal",
    stateCode: "19",
  },
  {
    id: "c2",
    name: "Zeta Learning",
    contact: "Karan Bose",
    email: "karan@zetalearning.com",
    phone: "+91 98111 55667",
    gstin: "29XYZAB5678N1Z9",
    address: "Indiranagar, Bengaluru",
    state: "Karnataka",
    stateCode: "29",
  },
  {
    id: "c3",
    name: "Studio Aarna",
    contact: "Meghna Roy",
    email: "meghna@studioaarna.in",
    phone: "+91 90500 77889",
    gstin: "",
    address: "Salt Lake Sector V, Kolkata",
    state: "West Bengal",
    stateCode: "19",
  },
  {
    id: "c4",
    name: "Rathore & Co. CA",
    contact: "Vikram Rathore",
    email: "vikram@rathoreco.in",
    phone: "+91 98333 44221",
    gstin: "19AACFR9012K1Z4",
    address: "City Centre, Durgapur",
    state: "West Bengal",
    stateCode: "19",
  },
];

const seedInvoices = () => {
  const y = new Date().getFullYear();
  const seq = (n, year) => `INV-${year}-${String(n).padStart(3, "0")}`;
  return [
    {
      id: "i1",
      number: seq(1, y),
      clientId: "c1",
      issueDate: addDays(todayISO(), -96),
      dueDate: addDays(todayISO(), -89),
      items: [
        { id: uid(), desc: "Brand identity + packaging design", qty: 1, rate: 85000 },
        { id: uid(), desc: "Social media template kit (12 posts)", qty: 1, rate: 18000 },
      ],
      discountPct: 5,
      gstRate: 18,
      gstMode: "intra",
      status: "paid",
      notes: "Thanks for the quick approvals!",
    },
    {
      id: "i2",
      number: seq(2, y),
      clientId: "c2",
      issueDate: addDays(todayISO(), -70),
      dueDate: addDays(todayISO(), -63),
      items: [
        { id: uid(), desc: "Course landing page (design + build)", qty: 1, rate: 65000 },
        { id: uid(), desc: "1:1 consultation hours", qty: 4, rate: 3500 },
      ],
      discountPct: 0,
      gstRate: 18,
      gstMode: "inter",
      status: "paid",
      notes: "",
    },
    {
      id: "i3",
      number: seq(3, y),
      clientId: "c3",
      issueDate: addDays(todayISO(), -38),
      dueDate: addDays(todayISO(), -31),
      items: [
        { id: uid(), desc: "Website maintenance — monthly retainer", qty: 2, rate: 15000 },
        { id: uid(), desc: "SEO audit & fixes", qty: 1, rate: 12000 },
      ],
      discountPct: 0,
      gstRate: 18,
      gstMode: "intra",
      status: "sent",
      notes: "Retainer covers 20 hrs/month of changes.",
    },
    {
      id: "i4",
      number: seq(4, y),
      clientId: "c4",
      issueDate: addDays(todayISO(), -12),
      dueDate: addDays(todayISO(), 3),
      items: [
        { id: uid(), desc: "Firm website + appointment booking", qty: 1, rate: 72000 },
        { id: uid(), desc: "Domain + hosting (1 yr, pass-through)", qty: 1, rate: 4500 },
      ],
      discountPct: 5,
      gstRate: 18,
      gstMode: "intra",
      status: "sent",
      notes: "",
    },
    {
      id: "i5",
      number: seq(5, y),
      clientId: "c1",
      issueDate: addDays(todayISO(), -4),
      dueDate: addDays(todayISO(), 10),
      items: [
        { id: uid(), desc: "Diwali campaign creatives", qty: 6, rate: 6000 },
      ],
      discountPct: 0,
      gstRate: 18,
      gstMode: "intra",
      status: "sent",
      notes: "",
    },
  ];
};

const seed = () => ({
  settings: defaultSettings,
  clients: seedClients(),
  invoices: seedInvoices(),
});

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    return {
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
    };
  } catch {
    return seed();
  }
}

export function saveStore(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode — app still works in-memory */
  }
}

export function resetStore() {
  localStorage.removeItem(KEY);
  return seed();
}

export { seed, defaultSettings };
