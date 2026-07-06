/* =============================================================
   components.js — Pustaka komponen UI reusable (WPUI)
   -------------------------------------------------------------
   Kumpulan fungsi kecil yang mengembalikan HTML string, biar
   markup berulang (kartu, toggle, dropdown, tombol, dll) cukup
   ditulis sekali. Semua render tab boleh memakainya.

   WPUI.mountUI() dipanggil sekali saat file ini dimuat untuk
   mengisi placeholder di index.html:
     - <div class="tabs" data-mount-tabs></div>
     - <div class="stat-grid" data-mount-stats="tamu"></div>
     - <div class="progress-wrap" data-mount-progress="budget"></div>
     - <button ... data-add-label="Tambah Tamu"></button>

   Catatan: file ini harus dimuat SETELAH config.js & utils.js,
   tapi SEBELUM script tiap fitur (guests.js, budget.js, dst)
   supaya elemen ber-id sudah ada saat script itu mengambilnya.
   ============================================================= */

const WPUI = (() => {
  // esc() sudah ada di utils.js; fallback kalau urutan load berubah.
  const _esc = (s) => (typeof esc === "function"
    ? esc(s)
    : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));

  /* ── Ikon SVG terpusat (biar tidak ditulis ulang di banyak tempat) ── */
  const ICONS = {
    plus: (stroke = "#fff") =>
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>`,
    edit: (stroke = "currentColor") =>
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: (stroke = "currentColor") =>
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    link: (stroke = "currentColor") =>
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    info: (stroke = "currentColor") =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  };

  /* ── Card: pembungkus .card standar ── */
  const card = (inner, extraClass = "") =>
    `<div class="card${extraClass ? " " + extraClass : ""}">${inner}</div>`;

  /* ── Stat card: satu kotak statistik ── */
  const statCard = ({ id, label, accent = "a-plum", init = "0" }) =>
    `<div class="stat"><div class="accent ${accent}"></div><div class="num" id="${id}">${init}</div><div class="lbl">${_esc(label)}</div></div>`;

  /* ── Stat grid: kumpulan stat card dari daftar konfigurasi ── */
  const statGrid = (items = []) => items.map(statCard).join("");

  /* ── Progress bar ── */
  const progressBar = ({ left, pctId, barId, suffix = "" }) =>
    `<div class="progress-top"><span>${_esc(left)}</span><span><b id="${pctId}">0%</b>${suffix ? " " + _esc(suffix) : ""}</span></div>
     <div class="pbar"><span id="${barId}" style="width:0%"></span></div>`;

  /* ── Tab button ── */
  const tab = ({ tab, label }, active = false) =>
    `<button class="tab${active ? " active" : ""}" data-tab="${tab}">${_esc(label)}</button>`;

  /* ── Tombol "Tambah" (icon-btn solid + ikon plus) ── */
  const addButton = (label) => `${ICONS.plus()}${_esc(label)}`;

  /* ── Toggle / switch (label.switch > input + .slider) ──
     inputHTML : markup <input> apa adanya (kelas & data-* dipertahankan)
     title     : tooltip opsional                                        */
  const switchToggle = ({ inputHTML, title = "" }) =>
    `<label class="switch"${title ? ` title="${_esc(title)}"` : ""}>${inputHTML}<span class="slider"></span></label>`;

  /* ── Dropdown / select terbungkus .select-wrap ──
     options : [{value, label, selected?, id?}] ATAU string HTML <option> siap pakai */
  const selectWrap = ({ id = "", attrs = "", options = "" }) => {
    const opts = Array.isArray(options)
      ? options.map(o =>
          `<option value="${_esc(o.value)}"${o.id ? ` id="${o.id}"` : ""}${o.selected ? " selected" : ""}>${_esc(o.label)}</option>`
        ).join("")
      : options;
    return `<div class="select-wrap"><select${id ? ` id="${id}"` : ""}${attrs ? " " + attrs : ""}>${opts}</select></div>`;
  };

  /* ── Chip berwarna (dipakai status budget, relasi tamu, dll) ── */
  const chip = ({ label, bg, text, dot, attrs = "" }) =>
    `<span class="chip"${attrs ? " " + attrs : ""} style="background:${bg};color:${text}">${dot ? `<span class="cdot" style="background:${dot}"></span>` : ""}${_esc(label)}</span>`;

  /* ── mountUI: isi semua placeholder di index.html dari config ── */
  function mountUI() {
    // Tabs
    const tabsBox = document.querySelector("[data-mount-tabs]");
    if (tabsBox && typeof WP_TABS !== "undefined") {
      tabsBox.innerHTML = WP_TABS.map((t, i) => tab(t, i === 0)).join("");
    }

    // Stat grid tiap panel
    if (typeof WP_STATS !== "undefined") {
      document.querySelectorAll("[data-mount-stats]").forEach(box => {
        const key = box.getAttribute("data-mount-stats");
        if (WP_STATS[key]) box.innerHTML = statGrid(WP_STATS[key]);
      });
    }

    // Progress bar tiap panel
    if (typeof WP_PROGRESS !== "undefined") {
      document.querySelectorAll("[data-mount-progress]").forEach(box => {
        const key = box.getAttribute("data-mount-progress");
        if (WP_PROGRESS[key]) box.innerHTML = progressBar(WP_PROGRESS[key]);
      });
    }

    // Tombol "Tambah": isi ikon + label. Label bisa dari atribut atau WP_LABELS[id].
    document.querySelectorAll("[data-add-label]").forEach(btn => {
      const label = btn.getAttribute("data-add-label")
        || (typeof WP_LABELS !== "undefined" && WP_LABELS[btn.id])
        || "Tambah";
      btn.innerHTML = addButton(label);
    });
  }

  return { ICONS, card, statCard, statGrid, progressBar, tab, addButton, switchToggle, selectWrap, chip, mountUI };
})();

// Isi placeholder segera setelah script ini dieksekusi (DOM <main> sudah ter-parse
// karena semua <script> berada di akhir <body>). Ini penting supaya elemen ber-id
// sudah tersedia sebelum guests.js/budget.js/dll mengambilnya.
WPUI.mountUI();
