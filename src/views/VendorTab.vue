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

      <div v-else class="vg-grid">
        <div
          v-for="v in catRows"
          :key="v.id"
          class="vg-card"
          :class="['vs-l-' + statusOf(v), { expanded: expandedId === v.id, sel: store.isSelected(v.id) }]"
        >
          <!-- Header (klik buka/tutup) -->
          <div class="vg-head" @click="toggleExpand(v.id)">
            <label class="vg-cbx" @click.stop>
              <input type="checkbox" class="cbx" :checked="store.isSelected(v.id)" @change="e => store.toggleSelected(v.id, e.target.checked)">
            </label>
            <span class="vg-ico">{{ CAT_ICON[v.category] || '🏷️' }}</span>
            <span class="vg-cat">{{ catLabel(v.category) }}</span>
            <select
              class="v-status-sel vg-status"
              :class="'vs-' + statusOf(v)"
              :value="statusOf(v)"
              @click.stop
              @change="e => store.setVendorStatus(v, e.target.value)"
            >
              <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
            </select>

            <div class="vg-name">{{ v.nama || 'Tanpa nama' }}</div>

            <div class="vg-price-row">
              <span class="vg-price">Rp {{ grp(v.harga) }}</span>
              <span v-if="payInfo(v)" class="vg-pay" :class="{ lunas: payInfo(v).lunas }">
                {{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}
              </span>
              <span v-else-if="v.tipeHarga === 'pax'" class="vg-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ paxMultText(v) }}</span>
              <svg class="vg-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            <span v-if="capInfo(v)" class="v-cap vg-capchip" :class="{ over: capInfo(v).over }">
              👥 muat {{ capInfo(v).muat }} · tamu {{ capInfo(v).tamu }}
              <template v-if="capInfo(v).over">· lebih {{ capInfo(v).delta }}</template>
              <template v-else>· sisa {{ capInfo(v).delta }}</template>
            </span>
          </div>

          <!-- Body (expand) -->
          <div v-if="expandedId === v.id" class="vg-body">
            <div v-if="payInfo(v)" class="vg-payblock">
              <div class="vg-payblock-top">
                <span>{{ payInfo(v).lunas ? 'Lunas' : 'sisa Rp ' + grp(payInfo(v).sisa) }}</span>
                <span class="vg-payblock-sub">dibayar Rp {{ grp(payInfo(v).dibayar) }} / Rp {{ grp(payInfo(v).total) }}</span>
              </div>
              <div class="vg-paybar"><span :style="{ width: payInfo(v).pct + '%' }"></span></div>
              <div v-if="payInfo(v).jatuhTempo" class="vg-due">⏰ Jatuh tempo {{ fmtDate(payInfo(v).jatuhTempo) }}</div>
            </div>

            <div class="vg-info">
              <span v-if="v.hp"><span class="vg-info-lbl">HP</span> {{ v.hp }}</span>
              <span v-if="v.alamat"><span class="vg-info-lbl">Alamat</span> {{ v.alamat }}</span>
              <span v-if="v.email"><span class="vg-info-lbl">Email</span> {{ v.email }}</span>
            </div>
            <div v-if="v.deskripsi" class="vg-desc">{{ v.deskripsi }}</div>

            <div class="vg-actions">
              <button v-if="v.hp" class="vg-btn wa" @click="openWa(v)">WhatsApp</button>
              <button v-if="payInfo(v)" class="vg-btn" @click="openPay(v)">Catat pembayaran</button>
              <button class="vg-btn" @click="openEdit(v.id)">Edit</button>
              <button class="vg-btn del" @click="delVendor(v)">Hapus</button>
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

const CAT_ICON = {
  wo: '🎯', venue: '🏛️', catering: '🍽️', dekorasi: '🌸', musik: '🎵',
  fotografer: '📷', video: '🎬', mua: '💄', mc: '🎤', souvenir: '🎁',
}

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
    selector: isMobile.value ? '.mv-card' : '.v-row',
    icon: '📋',
    title: isMobile.value ? 'Kartu Vendor' : 'Baris Vendor',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama, harga, tipe harga, dan status. Ketuk kartu untuk lihat detail lengkap — alamat, HP, dan deskripsi.'
      : 'Setiap baris berisi nama, alamat, nomor HP, harga, dan deskripsi. Klik ikon pensil untuk edit detail lengkap.',
  },
  {
    selector: isMobile.value ? '.mv-price-row' : '.v-cell.v-harga',
    icon: '💰',
    title: 'Sistem Harga Vendor',
    desc: 'All In berarti harga tetap terlepas dari jumlah tamu. Per Pax dikalikan otomatis dari jumlah tamu terkonfirmasi di tab Tamu — angkanya update sendiri kalau tamu bertambah.',
  },
  {
    selector: isMobile.value ? '.mv-actions' : '.v-decide',
    icon: '🔄',
    title: 'Toggle "Dipakai" → Budget',
    desc: 'Fitur utama tab ini. Aktifkan "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dimatikan, otomatis dihapus dari Budget. Tidak perlu input manual.',
  },
  ...(isMobile.value ? [{
    selector: '.mv-act.wa',
    icon: '📱',
    title: 'Hubungi via WhatsApp',
    desc: 'Tombol WA langsung membuka chat ke nomor vendor yang sudah diisi. Aktif hanya kalau nomor HP terisi. Berguna untuk follow up tanpa perlu keluar dari aplikasi.',
  }] : []),
])

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }

// Info kapasitas per venue — dipakai buat bantu milih venue yang muat.
// null kalau bukan venue / kapasitas belum diisi.
function capInfo(v) {
  if (v.category !== 'venue' || !v.kapasitas) return null
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
.v-cap {
  display: inline-block;
  margin-top: 3px;
  font-size: 11.5px;
  font-weight: 600;
  color: #3b6d11;
  background: var(--green-soft);
  border-radius: 100px;
  padding: 1px 8px;
  white-space: nowrap;
}
.v-cap.over { color: #7a1a1a; background: var(--rose-soft); }

.v-pay { margin-top: 3px; font-size: 11.5px; font-weight: 600; color: var(--rose); white-space: nowrap; }
.v-pay.lunas { color: var(--green); }

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

/* ── Card grid (desktop) ── */
.vg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.vg-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: box-shadow .15s;
}
.vg-card:hover { box-shadow: 0 4px 16px rgba(36,8,8,.09); }
.vg-card.expanded { grid-column: 1 / -1; }
.vg-card.sel { border-color: var(--wine); }
.vg-card.vs-l-dihubungi { border-left-color: #0A1D4B; }
.vg-card.vs-l-dipakai   { border-left-color: var(--green); }
.vg-card.vs-l-batal     { border-left-color: var(--rose); }

.vg-head {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 8px 10px;
  padding: 13px 15px;
  cursor: pointer;
}
.vg-cbx { display: inline-flex; }
.vg-ico { font-size: 17px; line-height: 1; }
.vg-cat { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.vg-status { justify-self: end; padding: 4px 9px; font-size: 11.5px; }

.vg-name {
  grid-column: 1 / -1;
  font-family: 'Jost', sans-serif;
  font-weight: 600;
  font-size: 15.5px;
  color: var(--ink);
}
.vg-price-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
}
.vg-price { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 700; color: var(--ink); }
.vg-pay { font-size: 12px; font-weight: 600; color: var(--rose); }
.vg-pay.lunas { color: var(--green); }
.vg-paxinfo { font-size: 11.5px; color: var(--muted); }
.vg-chev { margin-left: auto; color: var(--muted); transition: transform .2s; flex: none; }
.vg-card.expanded .vg-chev { transform: rotate(180deg); }
.vg-capchip { grid-column: 1 / -1; justify-self: start; margin-top: 0; }

/* Body */
.vg-body { padding: 0 15px 15px; border-top: 1px solid var(--line); }
.vg-payblock { margin-top: 12px; padding: 11px 13px; background: var(--ivory); border-radius: 12px; }
.vg-payblock-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink); }
.vg-payblock-sub { font-size: 11.5px; font-weight: 500; color: var(--muted); }
.vg-paybar { height: 6px; background: var(--line); border-radius: 100px; overflow: hidden; margin: 8px 0 6px; }
.vg-paybar > span { display: block; height: 100%; background: var(--gold); border-radius: 100px; }
.vg-due { font-size: 12px; color: #7a5c28; }

.vg-info { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 12px; font-size: 13px; color: var(--ink); }
.vg-info-lbl { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .03em; margin-right: 4px; }
.vg-desc { margin-top: 8px; font-size: 13px; color: #5f4a4a; font-style: italic; line-height: 1.5; }

.vg-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.vg-btn {
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
.vg-btn:hover { background: var(--gold-soft); border-color: var(--gold); }
.vg-btn.wa { background: #25D366; color: #fff; border-color: #25D366; }
.vg-btn.wa:hover { filter: brightness(1.05); background: #25D366; }
.vg-btn.del { color: var(--rose); }
.vg-btn.del:hover { background: var(--rose-soft); border-color: var(--rose); }
</style>
