// js/sync.js — export/import semua data (backup & berbagi dengan pasangan)

const SYNC_APP = "wedding-planner";
const SYNC_VERSION = 1;
const TAB_ORDER_STORAGE = "wp_tabOrder";

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function downloadJSON(obj, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
  a.download = filename;
  a.click();
}

function exportAllData() {
  const payload = {
    app: SYNC_APP,
    version: SYNC_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      guests, budget, vendors, seserahan, mahar, admin, checklist, timeline,
    },
    settings: {
      tabOrder: (() => { try { return JSON.parse(localStorage.getItem(TAB_ORDER_STORAGE)); } catch (e) { return null; } })(),
    },
  };
  downloadJSON(payload, `wedding-planner-${dateStamp()}.json`);
  toast("Semua data diekspor");
}

function importAllData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    let payload;
    try { payload = JSON.parse(e.target.result); }
    catch (err) { toast("File tidak bisa dibaca"); return; }

    if (!payload || payload.app !== SYNC_APP || !payload.data) {
      toast("Bukan file backup Wedding Planner");
      return;
    }

    const counts = [];
    const d = payload.data;
    [["guests", "tamu"], ["budget", "budget"], ["vendors", "vendor"], ["seserahan", "seserahan"],
     ["mahar", "mahar"], ["admin", "administrasi"], ["checklist", "checklist"], ["timeline", "timeline"]]
      .forEach(([k, label]) => { if (Array.isArray(d[k])) counts.push(`${d[k].length} ${label}`); });

    const when = payload.exportedAt ? new Date(payload.exportedAt).toLocaleDateString("id-ID") : "tidak diketahui";
    if (!confirm(`Impor data dari file (dibuat ${when})?\n\nIsi: ${counts.join(", ")}.\n\nSEMUA data kamu saat ini akan DIGANTI dengan data dari file ini.`)) return;

    // Tulis langsung ke localStorage, lalu reload supaya semua tab & setting termuat ulang bersih
    const put = (key, val) => { if (Array.isArray(val)) localStorage.setItem(key, JSON.stringify(val)); };
    put(GKEY, d.guests);
    put(BKEY, d.budget);
    put(VKEY, d.vendors);
    put(SKEY, d.seserahan);
    put(MKEY, d.mahar);
    put(AKEY, d.admin);
    put(CKEY, d.checklist);
    put(TLKEY, d.timeline);
    if (payload.settings && Array.isArray(payload.settings.tabOrder)) {
      localStorage.setItem(TAB_ORDER_STORAGE, JSON.stringify(payload.settings.tabOrder));
    }

    toast("Data berhasil diimpor — memuat ulang…");
    setTimeout(() => location.reload(), 800);
  };
  reader.readAsText(file);
}

// Bind tombol (statis di panel Home, jadi cukup sekali)
document.getElementById("exportAllBtn")?.addEventListener("click", exportAllData);
document.getElementById("importAllBtn")?.addEventListener("click", () => document.getElementById("importFile")?.click());
document.getElementById("importFile")?.addEventListener("change", e => {
  const f = e.target.files[0];
  if (f) importAllData(f);
  e.target.value = "";
});

/* ── Export / Import per-tab ── */
// Tiap tab punya dataset sendiri: cara baca + cara terapkan data hasil import.
const TAB_IO = {
  tamu:      { label: "tamu",         key: GKEY,  get: () => guests,    apply: v => { guests = v; if (typeof selected !== "undefined") selected.clear(); saveG(); renderGuests(); } },
  vendor:    { label: "vendor",       key: VKEY,  get: () => vendors,   apply: v => { vendors = v; saveV(); if (typeof renderVendors === "function") renderVendors(); } },
  seserahan: { label: "seserahan",    key: SKEY,  get: () => seserahan, apply: v => { seserahan = v; saveS(); if (typeof renderSeserahan === "function") renderSeserahan(); } },
  mahar:     { label: "mahar",        key: MKEY,  get: () => mahar,     apply: v => { mahar = v; saveM(); if (typeof renderMahar === "function") renderMahar(); } },
  admin:     { label: "administrasi", key: AKEY,  get: () => admin,     apply: v => { admin = v; saveA(); if (typeof renderAdmin === "function") renderAdmin(); } },
  checklist: { label: "checklist",    key: CKEY,  get: () => checklist, apply: v => { checklist = v; saveCK(); if (typeof renderChecklist === "function") renderChecklist(); } },
  budget:    { label: "budget",       key: BKEY,  get: () => budget,    apply: v => { budget = v; saveB(); renderBudget(); } },
  timeline:  { label: "timeline",     key: TLKEY, get: () => timeline,  apply: v => { timeline = v; saveTL(); if (typeof renderTimeline === "function") renderTimeline(); } },
};

function exportTab(tab) {
  const cfg = TAB_IO[tab];
  if (!cfg) return;
  const payload = { app: SYNC_APP, tab, version: SYNC_VERSION, exportedAt: new Date().toISOString(), data: cfg.get() };
  downloadJSON(payload, `wedding-planner-${tab}-${dateStamp()}.json`);
  toast(`Data ${cfg.label} diekspor`);
}

function importTab(tab, file) {
  const cfg = TAB_IO[tab];
  if (!cfg) return;
  const reader = new FileReader();
  reader.onload = e => {
    let payload;
    try { payload = JSON.parse(e.target.result); }
    catch (err) { toast("File tidak bisa dibaca"); return; }

    if (!payload || payload.app !== SYNC_APP || !Array.isArray(payload.data)) {
      toast("Bukan file data Wedding Planner");
      return;
    }
    if (payload.tab && payload.tab !== tab) {
      toast(`File ini untuk tab "${payload.tab}", bukan "${cfg.label}"`);
      return;
    }
    if (!confirm(`Ganti semua data ${cfg.label} dengan ${payload.data.length} item dari file ini?`)) return;
    cfg.apply(payload.data);
    toast(`Data ${cfg.label} diimpor`);
  };
  reader.readAsText(file);
}

// Inject tombol Export/Import ke controls tiap tab
const TIO_ICON_EXP = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" style="vertical-align:-2px;margin-right:4px"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TIO_ICON_IMP = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" style="vertical-align:-2px;margin-right:4px"><path d="M12 21V9m0 0l-4 4m4-4l4 4M5 3h14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function mountTabIO() {
  Object.keys(TAB_IO).forEach(tab => {
    const controls = document.querySelector(`#panel-${tab} .controls`);
    if (!controls) return;
    const wrap = document.createElement("div");
    wrap.className = "tab-io";
    wrap.innerHTML = `
      <button class="icon-btn tio-btn" data-act="export" title="Export data tab ini ke file">${TIO_ICON_EXP}Export</button>
      <button class="icon-btn tio-btn" data-act="import" title="Import data tab ini dari file">${TIO_ICON_IMP}Import</button>
      <input type="file" accept=".json,application/json" hidden>`;
    controls.appendChild(wrap);
    const fileInput = wrap.querySelector("input");
    wrap.querySelector('[data-act="export"]').addEventListener("click", () => exportTab(tab));
    wrap.querySelector('[data-act="import"]').addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", e => { if (e.target.files[0]) importTab(tab, e.target.files[0]); e.target.value = ""; });
  });
}
mountTabIO();
