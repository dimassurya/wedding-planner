const GKEY = "weddingGuests_v3";
const BKEY = "weddingBudget_v1";
const VKEY = "weddingVendors_v1";
const SKEY = "wp_seserahan";
const MKEY = "wp_mahar";
const AKEY = "wp_admin";
const CKEY = "wp_checklist";
const TLKEY = "wp_timeline";

let guests = [];
let budget = [];
let vendors = [];
let seserahan = [];
let mahar = [];
let admin = [];
let checklist = [];
let timeline = [];

let mem = {};
const selected = new Set();
let editGuestId = null;
let editBudgetId = null;
let editVendorId = null;
let bFilter = "all";
let gFilter = "all";
let vFilter = "wo";

function load(k) {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; }
  catch (e) { return mem[k] || null; }
}

function saveK(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { mem[k] = v; }
}

function init() {
  const g = load(GKEY);
  if (Array.isArray(g)) { guests = g; } 
  else { guests = (typeof GUEST_SEED !== 'undefined' ? GUEST_SEED : []).slice(); saveK(GKEY, guests); }

  const b = load(BKEY);
  if (Array.isArray(b)) {
    budget = b;
    // Migrasi data lama: tandai item bawaan sebagai "template" kalau belum ada penandanya
    if (typeof BUDGET_SEED !== 'undefined') {
      const seedNames = new Set(BUDGET_SEED.map(x => x.item));
      let changed = false;
      budget.forEach(x => {
        if (x.template === undefined && !x.vendorId && x.id !== 'seserahan_auto' && x.id !== 'mahar_auto' && seedNames.has(x.item)) {
          x.template = true; changed = true;
        }
      });
      if (changed) saveK(BKEY, budget);
    }
  }
  else { budget = (typeof BUDGET_SEED !== 'undefined' ? BUDGET_SEED : []).slice(); saveK(BKEY, budget); }

  const v = load(VKEY);
  vendors = Array.isArray(v) ? v : [];
  if (!Array.isArray(v)) saveK(VKEY, vendors);

  const s = load(SKEY);
  if (Array.isArray(s) && s.length === 41 && s[0].item === "Al Quran") {
    seserahan = [];
    saveK(SKEY, seserahan);
  } else if (!Array.isArray(s) || !s.length) {
    if (typeof SESERAHAN_SEED !== 'undefined') {
      seserahan = SESERAHAN_SEED.map((item, i) => ({
        id: i + 1,
        item: item.item,
        status: false,
        budget: 0,
        harga: 0,
        link: ""
      }));
    }
    saveK(SKEY, seserahan);
  } else {
    seserahan = s;
  }

  const m = load(MKEY);
  mahar = Array.isArray(m) ? m : [];
  if (!Array.isArray(m)) saveK(MKEY, mahar);

  const a = load(AKEY);
  if (Array.isArray(a)) { admin = a; }
  else {
    admin = (typeof ADMIN_SEED !== 'undefined' ? JSON.parse(JSON.stringify(ADMIN_SEED)) : []);
    saveK(AKEY, admin);
  }

  const c = load(CKEY);
  if (Array.isArray(c)) { checklist = c; }
  else {
    checklist = (typeof CHECKLIST_SEED !== 'undefined' ? JSON.parse(JSON.stringify(CHECKLIST_SEED)) : []);
    saveK(CKEY, checklist);
  }

  const tl = load(TLKEY);
  if (Array.isArray(tl)) { timeline = tl; }
  else {
    timeline = (typeof TIMELINE_SEED !== 'undefined' ? JSON.parse(JSON.stringify(TIMELINE_SEED)) : []);
    saveK(TLKEY, timeline);
  }
}

const saveG = () => saveK(GKEY, guests);
const saveB = () => saveK(BKEY, budget);
const saveV = () => saveK(VKEY, vendors);
const saveS = () => {
  saveK(SKEY, seserahan);
  syncSeserahanToBudget();
};
const saveM = () => {
  saveK(MKEY, mahar);
  syncMaharToBudget();
};
const saveA = () => saveK(AKEY, admin);
const saveCK = () => saveK(CKEY, checklist);
const saveTL = () => saveK(TLKEY, timeline);

function syncSeserahanToBudget() {
  const tBudget = seserahan.reduce((sum, x) => sum + (parseInt(x.budget) || 0), 0);
  const tHarga = seserahan.reduce((sum, x) => sum + (parseInt(x.harga) || 0), 0);
  const bIdx = budget.findIndex(b => b.id === 'seserahan_auto' || b.item === 'Total Seserahan');

  if (tBudget === 0 && tHarga === 0) {
    // Tidak ada nilai → jangan tampilkan baris kosong di Budget
    if (bIdx > -1) budget.splice(bIdx, 1);
  } else if (bIdx > -1) {
    budget[bIdx].estimasi = tBudget;
    budget[bIdx].aktual = tHarga;
    budget[bIdx].item = 'Total Seserahan';
  } else {
    budget.push({
      id: 'seserahan_auto', item: 'Total Seserahan', kategori: 'lainnya',
      estimasi: tBudget, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: "",
      remarks: "Sinkronisasi otomatis dari tab Seserahan"
    });
  }
  saveB();
  if (window.renderBudget) renderBudget();
}

function syncMaharToBudget() {
  const tHarga = mahar.reduce((sum, x) => sum + (parseInt(x.harga) || 0), 0);
  const bIdx = budget.findIndex(b => b.id === 'mahar_auto' || b.item === 'Total Mahar');

  if (tHarga === 0) {
    if (bIdx > -1) budget.splice(bIdx, 1);
  } else if (bIdx > -1) {
    budget[bIdx].estimasi = tHarga;
    budget[bIdx].aktual = tHarga;
    budget[bIdx].item = 'Total Mahar';
  } else {
    budget.push({
      id: 'mahar_auto', item: 'Total Mahar', kategori: 'lainnya',
      estimasi: tHarga, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: "",
      remarks: "Sinkronisasi otomatis dari tab Mahar"
    });
  }
  saveB();
  if (window.renderBudget) renderBudget();
}
