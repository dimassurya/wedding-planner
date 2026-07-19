<template>
  <section class="panel active" id="panel-vendor">
    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5H3z"/><path d="M21 9v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9"/><path d="M9 21V12h6v9"/></svg></div>
        <div class="num">{{ store.vendors.length }}</div><div class="lbl">Total vendor</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ dipakaiList.length }}</div><div class="lbl">Vendor dipakai</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="16" cy="12" r="2"/></svg></div>
        <div class="num">{{ fmt(totalBiaya) }}</div><div class="lbl">Total biaya vendor</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg></div>
        <div class="num">{{ store.vendors.length - dipakaiList.length }}</div><div class="lbl">Belum diputuskan</div>
      </div>
    </div>

    <!-- Used vendors list -->
    <div v-if="dipakaiList.length" class="card vd-card">
      <div class="vd-head">✓ Vendor yang Dipakai <span class="vd-count">{{ dipakaiList.length }}</span></div>
      <div class="vd-list">
        <button v-for="v in dipakaiList" :key="v.id" class="vd-item" @click="store.vFilter = v.category">
          <span class="vd-cat">{{ catLabel(v.category) }}</span>
          <span class="vd-name">{{ v.nama }}</span>
          <span class="vd-price">Rp {{ grp(v.harga) }}</span>
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="controls">
      <div id="vChips" class="chips">
        <button v-for="c in VENDOR_CATEGORIES" :key="c.id" class="fchip" :class="{ on: store.vFilter === c.id }" @click="store.vFilter = c.id">{{ c.label }}</button>
      </div>
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Vendor
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('vendor')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="VENDOR_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileVendorList v-if="isMobile" :rows="catRows" @edit="openEdit" />

    <!-- Card grid (PC) -->
    <div v-else>
      <div v-if="!catRows.length" class="card"><div class="empty">
        <div class="big">Tidak ada vendor</div>
        <div>Belum ada data vendor untuk kategori ini.</div>
      </div></div>

      <div v-else class="vt-table">
        <div class="vt-headrow">
          <span></span>
          <span>Vendor</span>
          <span>Kapasitas</span>
          <span>Harga</span>
          <span>Status</span>
        </div>

        <div
          v-for="v in catRows"
          :key="v.id"
          class="vt-row-wrap"
          :class="['vs-l-' + statusOf(v), { expanded: expandedId === v.id, sel: store.isSelected(v.id) }]"
        >
          <div class="vt-row" @click="toggleExpand(v.id)">
            <button type="button" class="vt-exp-btn" @click.stop="toggleExpand(v.id)" :aria-label="expandedId === v.id ? 'Tutup detail' : 'Buka detail'">
              <svg class="vt-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            <div class="vt-name">
              <label class="vt-cbx" @click.stop>
                <input type="checkbox" class="cbx" :checked="store.isSelected(v.id)" @change="e => store.toggleSelected(v.id, e.target.checked)">
              </label>
              <span>{{ v.nama || 'Tanpa nama' }}</span>
            </div>

            <div class="vt-cap">
              <span v-if="capInfo(v)" :class="{ over: capInfo(v).over }">{{ v.kapasitas }} <small>tamu {{ capInfo(v).tamu }}</small></span>
              <span v-else class="vt-muted">—</span>
            </div>

            <div class="vt-harga">
              <span class="vt-price">Rp {{ grp(v.harga) }}</span>
              <span class="vt-tag">{{ v.tipeHarga === 'pax' ? 'Per pax' : 'All in' }}</span>
            </div>

            <select
              class="v-status-sel vt-status"
              :class="'vs-' + statusOf(v)"
              :value="statusOf(v)"
              @click.stop
              @change="e => store.setVendorStatus(v, e.target.value)"
            >
              <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
            </select>
          </div>

          <!-- Detail info (expand ke bawah) -->
          <div v-if="expandedId === v.id" class="vt-body">
            <div v-if="v.tipeHarga === 'pax'" class="vt-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ paxMultText(v) }}</div>

            <div v-if="v.hp || v.website || v.email || v.alamat" class="vt-info">
              <span v-if="v.hp"><span class="vt-info-lbl">📱 Telepon</span> {{ v.hp }}</span>
              <span v-if="v.website"><span class="vt-info-lbl">🌐 Website/IG</span> <a :href="v.website.startsWith('http') ? v.website : 'https://' + v.website" target="_blank" rel="noopener" class="vt-link">{{ v.website }}</a></span>
              <span v-if="v.email"><span class="vt-info-lbl">✉️ Email</span> {{ v.email }}</span>
              <span v-if="v.alamat" class="vt-span2"><span class="vt-info-lbl">📍 Alamat</span> {{ v.alamat }}</span>
            </div>
            <div v-if="v.deskripsi" class="vt-desc">{{ v.deskripsi }}</div>
            <div v-if="!v.hp && !v.website && !v.email && !v.alamat && !v.deskripsi" class="vt-empty-info">Belum ada info tambahan — lengkapi lewat tombol Edit.</div>

            <div v-if="payInfo(v)" class="vt-payblock">
              <div class="vt-payblock-top">
                <span>{{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}</span>
                <span class="vt-payblock-sub">dibayar Rp {{ grp(payInfo(v).dibayar) }} / Rp {{ grp(payInfo(v).total) }}</span>
              </div>
              <div class="vt-paybar"><span :style="{ width: payInfo(v).pct + '%' }"></span></div>
              <div v-if="payInfo(v).jatuhTempo" class="vt-due">⏰ Jatuh tempo {{ fmtDate(payInfo(v).jatuhTempo) }}</div>
            </div>

            <div class="vt-actions">
              <button v-if="v.hp" class="vt-btn wa" @click="openWa(v)">WhatsApp</button>
              <button v-if="payInfo(v)" class="vt-btn" @click="openPay(v)">Catat pembayaran</button>
              <button class="vt-btn" @click="openEdit(v.id)">Edit</button>
              <button class="vt-btn del" @click="delVendor(v)">Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <VendorModal :show="modalShow" :edit-id="editId" :default-category="store.vFilter" @close="modalShow = false" />
    <BudgetDetailModal :show="payShow" :item-id="payItemId" @close="payShow = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER } from '../data/constants'
import { fmt, grp, fmtDate } from '../utils/index'
import { openWa } from '../mobile layout/waLink'
import VendorModal from '../components/modals/VendorModal.vue'
import BudgetDetailModal from '../components/modals/BudgetDetailModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileVendorList from '../mobile layout/MobileVendorList.vue'
import TourBtn from '../components/TourBtn.vue'

const store     = useWeddingStore()
const modalShow = ref(false)
const editId    = ref(null)
const importRef = ref(null)
const isMobile  = useIsMobile()

const expandedId = ref(null)
const payShow    = ref(false)
const payItemId  = ref(null)

const statusOf = v => v.status || (v.jadi ? 'dipakai' : 'incar')
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }
function openPay(v) {
  const b = store.budget.find(x => x.vendorId === v.id)
  if (!b) return
  payItemId.value = b.id
  payShow.value = true
}

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'vendor') openAdd()
})

const VENDOR_STEPS = computed(() => [
  {
    selector: '#panel-vendor .stat-grid',
    icon: '🤝',
    title: 'Ringkasan Vendor',
    desc: 'Empat angka penting: total vendor yang dicatat, berapa yang sudah dipilih, total biaya semua vendor aktif, dan berapa yang belum diputuskan.',
  },
  {
    selector: '#panel-vendor .vd-card',
    icon: '✅',
    title: 'Vendor yang Dipakai',
    desc: 'Panel ini muncul setelah ada vendor yang diaktifkan. Berisi ringkasan cepat — kategori, nama, dan harga. Ketuk salah satunya untuk langsung filter ke kategori itu.',
  },
  {
    selector: '#panel-vendor #vChips',
    icon: '🏷️',
    title: 'Filter Kategori',
    desc: 'Vendor dikelompokkan per kategori: Katering, Foto & Video, Gedung, dan lainnya. Pilih kategori untuk fokus ke satu jenis sekaligus.',
  },
  {
    selector: '#panel-vendor .controls button.icon-btn.solid',
    icon: '➕',
    title: 'Tambah Vendor',
    desc: 'Isi nama, alamat, nomor HP, deskripsi, dan pilih tipe harga. Ada dua tipe: All In (harga tetap) atau Per Pax (dikalikan jumlah tamu otomatis).',
  },
  {
    selector: isMobile.value ? '.mv-card' : '.vt-row-wrap',
    icon: '📋',
    title: isMobile.value ? 'Kartu Vendor' : 'Baris Vendor',
    desc: 'Klik tombol panah di kiri untuk buka detail — alamat, HP, email, website/Instagram, dan deskripsi lengkap.',
  },
  {
    selector: isMobile.value ? '.mv-sub' : '.vt-harga',
    icon: '💰',
    title: 'Sistem Harga Vendor',
    desc: 'All In berarti harga tetap terlepas dari jumlah tamu. Per Pax dikalikan otomatis dari jumlah tamu terkonfirmasi di tab Tamu — angkanya update sendiri kalau tamu bertambah.',
  },
  {
    selector: isMobile.value ? '.mv-status-sel' : '.vt-status',
    icon: '🔄',
    title: 'Status Vendor → Budget',
    desc: 'Ubah status ke "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dibatalkan, otomatis dihapus dari Budget. Tidak perlu input manual.',
  },
  ...(isMobile.value ? [{
    selector: '.mv-act-btn.wa',
    icon: '📱',
    title: 'Hubungi via WhatsApp',
    desc: 'Tombol WA langsung membuka chat ke nomor vendor yang sudah diisi. Aktif hanya kalau nomor HP terisi. Berguna untuk follow up tanpa perlu keluar dari aplikasi.',
  }] : []),
])

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }

// Info kapasitas — venue (fisik) atau paket All In yang cuma nyakup
// sekian tamu. null kalau kapasitas belum diisi.
function capInfo(v) {
  if (!v.kapasitas) return null
  const tamu = store.totalGuestPax
  const diff = tamu - v.kapasitas
  return { muat: v.kapasitas, tamu, over: diff > 0, delta: Math.abs(diff) }
}

const dipakaiList = computed(() => store.vendors.filter(v => v.jadi))
const totalBiaya  = computed(() => dipakaiList.value.reduce((s, v) => s + (v.harga || 0), 0))
const catRows     = computed(() => store.vendors.filter(v => v.category === store.vFilter))

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

function paxMultText(v) {
  if (v.paxPengali === 'orang') return `${tOrang.value} org`
  if (v.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  if (v.paxPengali === 'hampers') return `${store.hampersCount} hampers`
  return v.paxManualVal
}

function payInfo(v) {
  return store.vendorPayInfo(v)
}

function delVendor(v) {
  store.delVendor(v.id)
}

function openAdd()    { editId.value = null; modalShow.value = true }
function openEdit(id) { editId.value = id;   modalShow.value = true }

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('vendor', f)
  e.target.value = ''
}
</script>

<style scoped>
.v-status-sel {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 5px 10px;
  cursor: pointer;
  background: var(--paper);
}
.v-status-sel.vs-incar     { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.v-status-sel.vs-dihubungi { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }
.v-status-sel.vs-dipakai   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.v-status-sel.vs-batal     { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }

/* ── Row grid (desktop) ── */
.vt-table {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.vt-headrow {
  display: grid;
  grid-template-columns: 34px minmax(0,1.6fr) 120px 170px 150px;
  gap: 0 10px;
  padding: 10px 15px;
  background: var(--ivory);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.vt-row-wrap { border-left: 3px solid var(--line); }
.vt-row-wrap + .vt-row-wrap { border-top: 1px solid var(--line); }
.vt-row-wrap.sel { background: rgba(129,1,0,.04); }
.vt-row-wrap.vs-l-dihubungi { border-left-color: #0A1D4B; }
.vt-row-wrap.vs-l-dipakai   { border-left-color: var(--green); }
.vt-row-wrap.vs-l-batal     { border-left-color: var(--rose); }

.vt-row {
  display: grid;
  grid-template-columns: 34px minmax(0,1.6fr) 120px 170px 150px;
  align-items: center;
  gap: 0 10px;
  padding: 12px 15px 12px 12px;
  cursor: pointer;
}

.vt-exp-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
}
.vt-chev { transition: transform .2s; }
.vt-row-wrap.expanded .vt-chev { transform: rotate(180deg); }

.vt-name {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  font-family: 'Jost', sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--ink);
}
.vt-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vt-cbx { display: inline-flex; flex: none; }

.vt-cap { font-size: 13px; color: var(--ink); }
.vt-cap small { color: var(--muted); font-weight: 400; }
.vt-cap .over { color: var(--rose); font-weight: 600; }
.vt-muted { color: var(--muted); }

.vt-harga { display: flex; flex-direction: column; gap: 2px; }
.vt-price { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: var(--ink); }
.vt-tag { font-size: 11px; color: var(--muted); }

.vt-status { justify-self: start; padding: 4px 9px; font-size: 11.5px; }

/* Body (expand ke bawah) */
.vt-body { padding: 0 15px 15px 46px; border-top: 1px dashed var(--line); }
.vt-paxinfo { padding-top: 12px; font-size: 12px; color: var(--muted); }

.vt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-top: 12px; font-size: 13px; color: var(--ink); }
.vt-info > span { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.vt-info-lbl { color: var(--muted); font-size: 11px; letter-spacing: .03em; margin-right: 4px; white-space: nowrap; }
.vt-span2 { grid-column: 1 / -1; }
.vt-link { color: var(--plum); text-decoration: none; word-break: break-all; }
.vt-link:hover { text-decoration: underline; }
.vt-desc { margin-top: 8px; font-size: 13px; color: #5f4a4a; font-style: italic; line-height: 1.5; }
.vt-empty-info { margin-top: 12px; font-size: 12.5px; color: var(--muted); }

.vt-payblock { margin-top: 12px; padding: 11px 13px; background: var(--ivory); border-radius: 12px; }
.vt-payblock-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink); }
.vt-payblock-sub { font-size: 11.5px; font-weight: 500; color: var(--muted); }
.vt-paybar { height: 6px; background: var(--line); border-radius: 100px; overflow: hidden; margin: 8px 0 6px; }
.vt-paybar > span { display: block; height: 100%; background: var(--gold); border-radius: 100px; }
.vt-due { font-size: 12px; color: #7a5c28; }

.vt-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.vt-btn {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 13px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.vt-btn:hover { background: var(--gold-soft); border-color: var(--gold); }
.vt-btn.wa { background: #25D366; color: #fff; border-color: #25D366; }
.vt-btn.wa:hover { filter: brightness(1.05); background: #25D366; }
.vt-btn.del { color: var(--rose); }
.vt-btn.del:hover { background: var(--rose-soft); border-color: var(--rose); }
</style>
