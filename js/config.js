/* =============================================================
   config.js — Sumber tunggal untuk label & susunan komponen UI
   -------------------------------------------------------------
   Semua teks tab, kartu statistik, progress bar, dan tombol
   "Tambah" didefinisikan di sini. Mau ganti label? Cukup edit
   objek di file ini, tidak perlu ngutak-atik HTML.
   Dipakai oleh components.js (WPUI.mountUI) saat halaman dimuat.
   ============================================================= */

/* ── Daftar tab (urutan awal; user tetap bisa drag untuk mengurutkan ulang) ── */
const WP_TABS = [
  { tab: "home",       label: "Home" },
  { tab: "tamu",       label: "Tamu" },
  { tab: "vendor",     label: "Vendor" },
  { tab: "seserahan",  label: "Seserahan" },
  { tab: "mahar",      label: "Mahar" },
  { tab: "admin",      label: "Administrasi" },
  { tab: "checklist",  label: "Checklist" },
  { tab: "budget",     label: "Budget" },
  { tab: "timeline",   label: "Timeline" },
];

/* ── Kartu statistik per panel ──────────────────────────────
   id     : id elemen angka (dibaca oleh render masing-masing tab)
   label  : teks kecil di bawah angka
   accent : warna garis kiri (a-plum / a-gold / a-teal / a-rose / a-green)
   init   : nilai awal sebelum data dihitung
   cols   : (opsional) jumlah kolom grid untuk panel tsb.        */
const WP_STATS = {
  tamu: [
    { id: "sEntri",  label: "Undangan Dikonfirmasi", accent: "a-plum", init: "0" },
    { id: "sOrang",  label: "Total Tamu (orang)",    accent: "a-gold", init: "0" },
    { id: "sPria",   label: "Pihak Pria (orang)",    accent: "a-teal", init: "0" },
    { id: "sWanita", label: "Pihak Wanita (orang)",  accent: "a-rose", init: "0" },
  ],
  budget: [
    { id: "bEst",  label: "Total Estimasi", accent: "a-plum",  init: "Rp0" },
    { id: "bAkt",  label: "Total Aktual",   accent: "a-gold",  init: "Rp0" },
    { id: "bPaid", label: "Sudah Dibayar",  accent: "a-green", init: "Rp0" },
    { id: "bDue",  label: "Sisa Tagihan",   accent: "a-rose",  init: "Rp0" },
  ],
  vendor: [
    { id: "vsTotal",   label: "Total Kandidat Vendor", accent: "a-plum",  init: "0" },
    { id: "vsDipakai", label: "Vendor Dipakai",        accent: "a-green", init: "0" },
    { id: "vsBiaya",   label: "Biaya Vendor Dipakai",  accent: "a-gold",  init: "Rp0" },
    { id: "vsBelum",   label: "Belum Diputuskan",      accent: "a-rose",  init: "0" },
  ],
  seserahan: [
    { id: "sTotalItems",  label: "Total Item",         accent: "a-gold", init: "0" },
    { id: "sTotalSudah",  label: "Sudah Dibeli",       accent: "a-teal", init: "0" },
    { id: "sTotalBudget", label: "Total Budget",       accent: "a-rose", init: "Rp0" },
    { id: "sTotalHarga",  label: "Total Harga Aktual", accent: "a-plum", init: "Rp0" },
  ],
  mahar: [
    { id: "mTotalItems", label: "Total Item",       accent: "a-gold", init: "0" },
    { id: "mTotalSudah", label: "Sudah Disiapkan",  accent: "a-teal", init: "0" },
    { id: "mTotalHarga", label: "Total Harga",      accent: "a-rose", init: "Rp0" },
  ],
  admin: [
    { id: "aTotalItems", label: "Total Syarat",    accent: "a-gold",  init: "0" },
    { id: "aTotalDone",  label: "Sudah Lengkap",   accent: "a-green", init: "0" },
    { id: "aTotalLeft",  label: "Belum Lengkap",   accent: "a-rose",  init: "0" },
  ],
  checklist: [
    { id: "ckTotalItems", label: "Total Tugas",    accent: "a-gold",  init: "0" },
    { id: "ckTotalDone",  label: "Selesai",        accent: "a-green", init: "0" },
    { id: "ckTotalLeft",  label: "Belum Selesai",  accent: "a-rose",  init: "0" },
  ],
  timeline: [
    { id: "tlTotal",    label: "Total Tugas",    accent: "a-gold",  init: "0" },
    { id: "tlDone",     label: "Selesai",        accent: "a-green", init: "0" },
    { id: "tlProgress", label: "Sedang Proses",  accent: "a-teal",  init: "0" },
    { id: "tlOverdue",  label: "Lewat Deadline", accent: "a-rose",  init: "0" },
  ],
};

/* ── Progress bar per panel ─────────────────────────────────
   left  : teks di kiri
   pctId : id angka persen (dibaca render masing-masing tab)
   barId : id <span> bar
   suffix: teks setelah persen (mis. "terbayar")               */
const WP_PROGRESS = {
  budget:    { left: "Progres pembayaran", pctId: "bPct",  barId: "bBar",  suffix: "terbayar" },
  admin:     { left: "Kelengkapan berkas", pctId: "aPct",  barId: "aBar",  suffix: "lengkap" },
  checklist: { left: "Progres persiapan",  pctId: "ckPct", barId: "ckBar", suffix: "selesai" },
  timeline:  { left: "Progres tugas",      pctId: "tlPct", barId: "tlBar", suffix: "selesai" },
};

/* ── Label tombol "Tambah" per panel (dipakai add-button component) ── */
const WP_LABELS = {
  addGuestBtn:         "Tambah Tamu",
  addBudgetBtn:        "Tambah Item",
  addVendorBtn:        "Tambah Vendor",
  addSeserahanBtn:     "Tambah Item",
  addMaharBtn:         "Tambah Item",
  addAdminGroupBtn:    "Tambah Bagian",
  addChecklistGroupBtn:"Tambah Fase",
  addTimelineBtn:      "Tambah Tugas",
};
