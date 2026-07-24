<template>
  <section class="panel active" id="panel-budget">
    <!-- Summary bar -->
    <div class="b-summary">
      <div class="b-sum-item"><div class="b-sum-lbl">Estimasi</div><div class="b-sum-val" id="bEst">{{ fmt(tEst) }}</div></div>
      <div class="b-sum-item"><div class="b-sum-lbl">Aktual</div><div class="b-sum-val">{{ fmt(tAkt) }}</div></div>
      <div class="b-sum-item"><div class="b-sum-lbl">Dibayar</div><div class="b-sum-val">{{ fmt(tDib) }}</div></div>
      <div class="b-sum-item"><div class="b-sum-lbl">Belum Dibayar</div><div class="b-sum-val rose">{{ fmt(tSis) }}</div></div>
    </div>
    <div class="b-prog-wrap">
      <div class="b-prog-bar"><div class="b-prog-fill" :style="{ width: pctPaid + '%' }"></div></div>
      <span class="b-prog-pct">{{ pctPaid }}% terbayar</span>
      <span v-if="tEstSet > 0" class="b-prog-selisih" :class="tSelisih >= 0 ? 'hemat' : 'lebih'">
        {{ tSelisih >= 0 ? 'Hemat ' + fmt(tSelisih) : 'Lebih ' + fmt(-tSelisih) }} dari rencana
      </span>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="chips view-switch">
        <button class="fchip" :class="{ on: view === 'table' }" @click="view = 'table'">📋 Tabel</button>
        <button class="fchip" :class="{ on: view === 'jadwal' }" @click="view = 'jadwal'">📅 Jadwal</button>
      </div>
      <div v-if="view === 'table'" id="bChips" class="chips">
        <button v-for="chip in CHIPS" :key="chip.f" class="fchip" :class="{ on: store.bFilter === chip.f }" @click="store.bFilter = chip.f">{{ chip.label }}</button>
      </div>
      <button class="icon-btn solid" @click="addItem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Item
      </button>
      <button class="icon-btn" @click="store.exportBudgetCSV()">Ekspor CSV</button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('budget')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="BUDGET_STEPS" />
    </div>

    <!-- Jadwal pembayaran -->
    <BudgetSchedule v-if="view === 'jadwal'" @open="openDetail" />

    <template v-else>
    <!-- Guide card (web saja) -->
    <div v-if="!isMobile" class="card b-guide">
      <div class="b-guide-title">Panduan kolom</div>
      <dl class="b-guide-list">
        <div><dt>Estimasi</dt><dd>anggaran rencana</dd></div>
        <div><dt>Aktual</dt><dd>harga jadi / nyata</dd></div>
        <div><dt>Dibayar</dt><dd>total termin yang sudah lunas</dd></div>
        <div><dt>Belum Dibayar</dt><dd>sisa tagihan (Aktual − Dibayar)</dd></div>
      </dl>
      <div class="b-guide-foot">
        Klik kolom Dibayar atau ikon <svg style="vertical-align:middle" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg> untuk buka buku pembayaran — catat termin, tanggal, & siapa yang bayar.
      </div>
    </div>

    <!-- Mobile: kartu kecil -->
    <MobileBudgetList v-if="isMobile" :rows="visRows" @open="openDetail" />

    <!-- Table (PC) -->
    <div v-else class="card b-table-card">
      <div class="b-table-inner">
      <div class="b-head">
        <div class="b-cbx"><input type="checkbox" class="cbx" :checked="allVisSel" :indeterminate.prop="someVisSel && !allVisSel" @change="toggleAll"></div>
        <div>Item</div>
        <div class="b-head-c">Harga</div>
        <div class="b-head-c">Pembayaran</div>
        <div class="b-head-c">Jatuh Tempo</div>
        <div></div>
        <div class="b-actions"></div>
      </div>

      <div v-if="!visRows.length" class="empty">
        <div class="big">Tidak ada item</div>
        <div>{{ store.budget.length ? 'Tidak ada item pada filter ini.' : 'Klik Tambah Item untuk mulai.' }}</div>
      </div>

      <template v-for="b in visRows" :key="b.id">
      <div class="b-row" :class="{ paid: store.bStatus(b).key === 'lunas', sel: store.isSelected(b.id) }" :data-id="b.id">
        <div class="b-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(b.id)" @change="e => store.toggleSelected(b.id, e.target.checked)"></div>
        <div class="b-item">
          <input type="text" :data-bid="b.id" data-f="item" :value="b.item" placeholder="Nama item..." @input="onItemInput($event, b)" @blur="onItemBlur(b)">
          <span v-if="store.budgetOrigin(b)" class="b-origin" :class="store.budgetOrigin(b).cls" :title="store.budgetOrigin(b).tip">{{ store.budgetOrigin(b).label }}</span>
        </div>
        <div class="b-price" @click="openDetail(b.id)" title="Kelola item">
          <template v-if="store.bDisplayPrice(b)">
            <div class="b-price-main">{{ fmt(store.bDisplayPrice(b).value) }}</div>
            <div class="b-price-label" :class="store.bDisplayPrice(b).kind">{{ store.bDisplayPrice(b).label }}</div>
            <div v-if="store.bDisplayPrice(b).kind === 'aktual' && selisihBadge(b)" class="b-selisih" :class="selisihBadge(b).cls">{{ selisihBadge(b).label }}</div>
          </template>
          <div v-else class="b-price-empty">Belum diisi</div>
        </div>
        <div class="b-progress">
          <div class="b-seg-bar">
            <div v-for="(s, i) in rowSegments(b)" :key="i" class="b-seg" :class="s.cls" :style="{ flex: s.amount }"></div>
          </div>
          <div class="b-progress-txt">{{ b.aktual > 0 ? fmt(store.paidTotal(b.id)) + ' dari ' + fmt(b.aktual) : '—' }}</div>
        </div>
        <div class="b-due">
          <span v-if="dueBadge(b)" class="b-due-badge" :class="dueBadge(b).cls">{{ dueBadge(b).label }}</span>
          <span v-else class="b-due-empty">—</span>
        </div>
        <button class="b-expand-btn" :class="{ open: expandedIds.has(b.id) }" @click="toggleExpand(b.id)" :aria-expanded="expandedIds.has(b.id)" :aria-label="expandedIds.has(b.id) ? 'Tutup daftar termin' : 'Lihat daftar termin'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="b-actions r">
          <button class="act item-action-btn" @click="openDetail(b.id)" title="Detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E151A" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1" stroke-linecap="round"/></svg>
          </button>
          <button v-if="store.budgetOrigin(b)?.managed" class="act del locked item-action-btn" disabled :title="store.budgetOrigin(b)?.tipDel">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D4B0B0" stroke-width="2"><rect x="5" y="10" width="14" height="9" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </button>
          <button v-else class="act del item-action-btn" @click="store.delBudget(b.id)" title="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B32E33" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
      <div v-if="expandedIds.has(b.id)" class="b-termin-panel">
        <div v-if="!store.itemPayments(b.id).length" class="b-termin-empty">Belum ada termin pembayaran.</div>
        <div v-for="p in store.itemPayments(b.id)" :key="p.id" class="b-termin-row">
          <span class="b-termin-dot" :class="{ on: p.paid }"></span>
          <span class="b-termin-note">{{ p.note || 'Termin' }}</span>
          <span class="b-termin-date">{{ p.paid ? 'Lunas ' + fmtDate(p.paidDate) : (p.dueDate ? 'Jatuh tempo ' + fmtDate(p.dueDate) : 'Belum ada tanggal') }}</span>
          <span class="b-termin-amt">{{ fmt(p.amount) }}</span>
        </div>
        <button class="b-termin-manage" @click="openDetail(b.id)">Kelola pembayaran →</button>
      </div>
      </template>

      <!-- Footer totals -->
      <div v-if="visRows.length" class="b-foot">
        <div class="b-foot-lbl">Total</div>
        <div class="r">{{ fmt(tAkt) }}</div>
        <div class="b-foot-progress">{{ fmt(tDib) }} dari {{ fmt(tAkt) }}</div>
        <div class="r">{{ fmt(tSis) }}</div>
      </div>
      </div>
    </div>
    </template>

    <BudgetDetailModal :show="detailShow" :item-id="detailId" @close="onDetailClose" />
  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate, daysLeft } from '../utils/index'
import BudgetDetailModal from '../components/modals/BudgetDetailModal.vue'
import BudgetSchedule from '../components/BudgetSchedule.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileBudgetList from '../mobile layout/MobileBudgetList.vue'
import TourBtn from '../components/TourBtn.vue'

const store       = useWeddingStore()
const importRef   = ref(null)
const detailShow  = ref(false)
const detailId    = ref(null)
const newItemId   = ref(null)
const isMobile    = useIsMobile()
const detailIsNew = ref(false)
const view        = ref('table')
const expandedIds = ref(new Set())

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'budget') addItem()
})

const BUDGET_STEPS = computed(() => [
  {
    selector: '#panel-budget .b-summary',
    icon: '💰',
    title: 'Ringkasan Anggaran',
    desc: 'Empat angka utama: Estimasi (rencana awal), Aktual (harga nyata), Dibayar (uang yang sudah keluar), dan Belum Dibayar (sisa tagihan). Progress bar di bawahnya menunjukkan persentase yang sudah terbayar.',
  },
  {
    selector: '#panel-budget #bChips',
    icon: '🏷️',
    title: 'Filter Status',
    desc: 'Saring item berdasarkan status pembayaran — Semua, Belum Bayar, Sebagian (DP), atau Lunas. Berguna untuk fokus ke item yang masih perlu dilunasi.',
  },
  {
    selector: '#panel-budget .controls button.icon-btn.solid',
    icon: '➕',
    title: 'Tambah Item',
    desc: 'Tambahkan pos pengeluaran baru secara manual. Isi nama, estimasi anggaran, harga aktual, dan jumlah yang sudah dibayar.',
  },
  {
    selector: '#panel-budget .b-guide',
    icon: '📖',
    title: 'Panduan Kolom',
    desc: 'Penjelasan singkat tiap kolom — Estimasi: anggaran yang direncanakan. Aktual: harga nyata setelah deal. Dibayar: uang yang sudah benar-benar keluar. Belum Dibayar: sisa tagihan (Aktual − Dibayar), dihitung otomatis.',
  },
  {
    selector: isMobile.value ? '.mb-card' : '.b-row',
    icon: '📋',
    title: isMobile.value ? 'Kartu Item' : 'Baris Item',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama, status, harga aktual, sisa tagihan, dan jatuh tempo. Ketuk untuk buka detail lengkap dan edit semua kolom.'
      : 'Edit nama langsung di baris. Klik kolom Harga atau Pembayaran untuk buka detail & catat termin. Panah di kanan bisa dibuka buat mengintip daftar termin tanpa buka detail penuh.',
  },
  {
    selector: isMobile.value ? '.mb-origin' : '.b-origin',
    icon: '🔖',
    title: 'Label Asal Item',
    desc: 'Badge kecil yang menandai dari mana item ini berasal — template bawaan, dari tab Vendor, Seserahan, atau Mahar. Item dari tab lain dikelola di sumber asalnya dan tidak bisa dihapus langsung dari sini.',
  },
  {
    selector: isMobile.value ? '.mb-status' : '.b-progress',
    icon: '💳',
    title: 'Progress Pembayaran',
    desc: 'Bar bersegmen menunjukkan tiap termin — hijau (lunas), kuning (akan datang), merah (telat). Dihitung otomatis dari buku pembayaran, tidak perlu diset manual.',
  },
  {
    selector: '.b-actions .act',
    icon: 'ℹ️',
    title: 'Buku Pembayaran',
    desc: 'Klik ikon ini untuk membuka detail item — catat termin pembayaran (DP, cicilan, pelunasan), tanggal, siapa yang bayar, dan tandai lunas satu per satu. Kolom Dibayar terisi otomatis dari sini.',
  },
])

const CHIPS = [
  { f: 'all',    label: 'Semua' },
  { f: 'kosong', label: 'Belum Diisi' },
  { f: 'belum',  label: 'Belum Bayar' },
  { f: 'dp',     label: 'Sebagian (DP)' },
  { f: 'lunas',  label: 'Lunas' },
]

function selisihBadge(b) {
  // Dua-duanya harus keisi — kalau aktual masih 0, "selisih"-nya bukan
  // hemat beneran, itu cuma estimasi yang belum direalisasi.
  if (!b.estimasi || !b.aktual) return null
  const d = store.bSelisih(b)
  if (d === 0) return null
  return d > 0
    ? { label: `Hemat ${fmt(d)}`, cls: 'hemat' }
    : { label: `Lebih ${fmt(-d)}`, cls: 'lebih' }
}

// Progress bar tersegmen: satu segmen per termin, warna dari statusnya.
// Sisa yang belum ada termin sama sekali dapat segmen netral, biar
// kelihatan "ada duit yang belum direncanakan" — bukan seolah lunas.
function rowSegments(b) {
  const total = b.aktual || 0
  if (total <= 0) return [{ amount: 1, cls: 'seg-empty' }]
  const segs = store.itemPayments(b.id)
    .filter(p => (p.amount || 0) > 0)
    .map(p => {
      let cls = 'seg-neutral'
      if (p.paid) cls = 'seg-paid'
      else if (p.dueDate) {
        const d = daysLeft(p.dueDate)
        cls = d < 0 ? 'seg-overdue' : (d <= 7 ? 'seg-soon' : 'seg-neutral')
      }
      return { amount: p.amount, cls }
    })
  const planned = segs.reduce((s, x) => s + x.amount, 0)
  const remainder = total - planned
  if (remainder > 0.5) segs.push({ amount: remainder, cls: 'seg-neutral' })
  return segs.length ? segs : [{ amount: 1, cls: 'seg-empty' }]
}

function dueBadge(b) {
  if ((b.aktual || 0) <= 0) return null
  if (store.bSisa(b) <= 0) return { label: 'Lunas', cls: 'due-paid' }
  const due = store.nextDue(b.id)
  if (!due) return { label: 'Belum ada termin', cls: 'due-none' }
  const d = daysLeft(due)
  if (d < 0) return { label: `Telat ${-d} hari`, cls: 'due-overdue' }
  if (d === 0) return { label: 'Hari ini', cls: 'due-soon' }
  if (d <= 7) return { label: `${d} hari lagi`, cls: 'due-soon' }
  return { label: fmtDate(due), cls: 'due-later' }
}

function toggleExpand(id) {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}

const tEst    = computed(() => store.budget.reduce((s, b) => s + (b.estimasi || 0), 0))
const tEstSet = computed(() => store.budgetEstimasiSetCount)
const tSelisih = computed(() => store.budgetSelisihTotal)
const tAkt = computed(() => store.budget.reduce((s, b) => s + (b.aktual || 0), 0))
const tDib = computed(() => store.budget.reduce((s, b) => s + (b.dibayar || 0), 0))
const tSis = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))
const pctPaid = computed(() => tAkt.value ? Math.round(tDib.value / tAkt.value * 100) : 0)

// Urutan tampil: Vendor > Seserahan > Mahar > manual (nggak ada origin) >
// Template paling bawah. Pengurutan cuma buat tampilan (visRows), array
// asli store.budget nggak diubah — jadi nggak perlu persist apa-apa.
const ORIGIN_RANK = { 'bo-vendor': 0, 'bo-ser': 1, 'bo-mahar': 2, 'bo-tpl': 4 }
function originRank(b) {
  const cls = store.budgetOrigin(b)?.cls
  return cls != null ? (ORIGIN_RANK[cls] ?? 3) : 3
}

const visRows = computed(() =>
  store.budget
    .filter(b => store.bFilter === 'all' || store.bStatus(b).key === store.bFilter)
    .sort((a, b) => originRank(a) - originRank(b))
)

const allVisSel  = computed(() => visRows.value.length > 0 && visRows.value.every(b => store.isSelected(b.id)))
const someVisSel = computed(() => visRows.value.some(b => store.isSelected(b.id)))

function toggleAll(e) {
  visRows.value.forEach(b => store.toggleSelected(b.id, e.target.checked))
}

async function addItem() {
  const id = await store.addBudgetItem()
  if (!id) return
  newItemId.value = id
  // Mobile: langsung buka detail untuk item baru
  if (isMobile.value) {
    detailIsNew.value = true
    openDetail(id)
    return
  }
  await nextTick()
  const inp = document.querySelector(`.b-row[data-id="${id}"] input[data-f="item"]`)
  if (inp) { inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); inp.focus() }
}

function onItemInput(e, b) {
  b.item = e.target.value
  store.saveB()
}

function onItemBlur(b) {
  if (!b.item?.trim()) store.removeBudgetEmptyItem(b.id)
}

function openDetail(id) {
  detailId.value = id
  detailShow.value = true
}

function onDetailClose() {
  detailShow.value = false
  // kalau item baru ditutup tanpa diisi nama, buang
  if (detailIsNew.value) {
    store.removeBudgetEmptyItem(detailId.value)
    detailIsNew.value = false
  }
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('budget', f)
  e.target.value = ''
}
</script>

<style scoped>
.view-switch { padding-right: 10px; border-right: 1px solid var(--line); }
.b-head-c { text-align: center; }

/* margin negatif = padding: hover box kelihatan "empuk" tanpa nggeser
   posisi teks dari tepi kolom aslinya — biar tetap presisi sejajar
   sama header "Harga" yang nggak punya padding tambahan. */
.b-price { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; cursor: pointer; padding: 7px 9px; margin: -7px -9px; border-radius: 8px; border: 1.5px solid transparent; transition: .15s; }
.b-price:hover { background: var(--ivory); border-color: var(--line); }
.b-price-main { font-weight: 600; font-size: 14px; color: var(--ink); font-variant-numeric: tabular-nums; }
.b-price-empty { font-size: 13px; color: var(--muted); font-style: italic; }
.b-price-label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.b-price-label.estimasi { color: #8a6d2f; font-style: italic; }

.b-progress { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.b-seg-bar { display: flex; gap: 2px; height: 6px; border-radius: 20px; overflow: hidden; }
.b-seg { flex: 1; }
.seg-paid    { background: var(--green); }
.seg-soon    { background: #CD9F65; }
.seg-overdue { background: var(--rose); }
.seg-neutral { background: var(--line); }
.seg-empty   { background: var(--ivory); }
.b-progress-txt { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }

.b-due { display: flex; justify-content: flex-end; }
.b-due-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.due-overdue { color: #7a1a1a; background: var(--rose-soft); }
.due-soon    { color: #7a5c28; background: var(--gold-soft); }
.due-paid    { color: #2b5010; background: #EAF3DE; }
.due-later   { color: var(--muted); font-weight: 500; }
.due-none    { color: var(--muted); font-weight: 500; font-style: italic; }
.b-due-empty { color: var(--muted); }

.b-expand-btn {
  flex: none; width: 28px; height: 28px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--muted); border-radius: 6px; transition: background .15s, color .15s;
}
.b-expand-btn:hover { background: var(--ivory); color: var(--plum); }
.b-expand-btn svg { transition: transform .15s; }
.b-expand-btn.open svg { transform: rotate(180deg); }

.b-termin-panel { padding: 10px 20px 14px 58px; background: var(--ivory); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 7px; }
.b-termin-empty { font-size: 12.5px; color: var(--muted); font-style: italic; }
.b-termin-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.b-termin-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line); flex: none; }
.b-termin-dot.on { background: var(--green); }
.b-termin-note { flex: 1; min-width: 0; color: var(--ink); }
.b-termin-date { color: var(--muted); font-size: 12px; white-space: nowrap; }
.b-termin-amt { font-weight: 600; font-variant-numeric: tabular-nums; flex: none; }
.b-termin-manage { align-self: flex-start; margin-top: 2px; font-size: 12px; font-weight: 600; color: var(--plum); background: none; border: none; cursor: pointer; padding: 2px 0; }
.b-termin-manage:hover { text-decoration: underline; }

.b-foot-progress { font-size: 13px; font-weight: 600; color: var(--plum); }
</style>
