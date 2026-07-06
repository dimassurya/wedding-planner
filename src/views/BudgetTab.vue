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
    </div>

    <!-- Controls -->
    <div class="controls">
      <div id="bChips" class="chips">
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

    <!-- Guide card (web saja) -->
    <div v-if="!isMobile" class="card b-guide">
      <div class="b-guide-title">Panduan kolom</div>
      <dl class="b-guide-list">
        <div><dt>Estimasi</dt><dd>anggaran rencana</dd></div>
        <div><dt>Aktual</dt><dd>harga jadi / nyata</dd></div>
        <div><dt>Dibayar</dt><dd>uang yang sudah keluar</dd></div>
        <div><dt>Belum Dibayar</dt><dd>sisa tagihan (Aktual − Dibayar)</dd></div>
      </dl>
      <div class="b-guide-foot">
        Klik ikon <svg style="vertical-align:middle" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg> untuk detail & catatan.
      </div>
    </div>

    <!-- Mobile: kartu kecil -->
    <MobileBudgetList v-if="isMobile" :rows="visRows" @open="openDetail" />

    <!-- Table (PC) -->
    <div v-else class="card table-card">
      <div class="b-head">
        <div><input type="checkbox" class="cbx" :checked="allVisSel" :indeterminate.prop="someVisSel && !allVisSel" @change="toggleAll"></div>
        <div>Item</div>
        <div class="r">Status</div>
        <div class="lE r">Estimasi</div>
        <div class="lA r">Aktual</div>
        <div class="lD r">Dibayar</div>
        <div class="lS r">Belum Dibayar</div>
        <div class="lT r">Jatuh Tempo</div>
        <div></div>
      </div>

      <div v-if="!visRows.length" class="empty">
        <div class="big">Tidak ada item</div>
        <div>{{ store.budget.length ? 'Tidak ada item pada filter ini.' : 'Klik Tambah Item untuk mulai.' }}</div>
      </div>

      <div v-for="b in visRows" :key="b.id" class="b-row" :class="{ paid: store.bStatus(b).key === 'lunas', sel: store.isSelected(b.id) }" :data-id="b.id">
        <div class="b-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(b.id)" @change="e => store.toggleSelected(b.id, e.target.checked)"></div>
        <div class="b-item">
          <input type="text" :data-bid="b.id" data-f="item" :value="b.item" placeholder="Nama item..." @input="onItemInput($event, b)" @blur="onItemBlur(b)">
          <span v-if="store.budgetOrigin(b)" class="b-origin" :class="store.budgetOrigin(b).cls" :title="store.budgetOrigin(b).tip">{{ store.budgetOrigin(b).label }}</span>
        </div>
        <div class="b-status cStat">
          <span class="chip" :style="{ background: store.bStatus(b).bg, color: store.bStatus(b).text }">
            <span class="cdot" :style="{ background: store.bStatus(b).color }"></span>
            {{ store.bStatus(b).label }}
          </span>
        </div>
        <div class="bm-lbl lE">Estimasi</div>
        <div class="bcell cE"><span class="rp">Rp</span><input type="text" inputmode="numeric" :value="grp(b.estimasi)" @input="onCurInput($event, b, 'estimasi')"></div>
        <div class="bm-lbl lA">Aktual</div>
        <div class="bcell cA"><span class="rp">Rp</span><input type="text" inputmode="numeric" :value="grp(b.aktual)" @input="onCurInput($event, b, 'aktual')"></div>
        <div class="bm-lbl lD">Dibayar</div>
        <div class="bcell cD"><span class="rp">Rp</span><input type="text" inputmode="numeric" :value="grp(b.dibayar)" @input="onCurInput($event, b, 'dibayar')"></div>
        <div class="bm-lbl lS">Belum Dibayar</div>
        <div class="b-sisa cS">{{ fmt(store.bSisa(b)) }}</div>
        <div class="bm-lbl lT">Jatuh Tempo</div>
        <div class="cT r" :style="{ fontSize: '13px', color: b.jatuhTempo ? 'var(--ink)' : 'var(--muted)' }">{{ fmtDate(b.jatuhTempo) }}</div>
        <div class="b-actions r">
          <button class="act" @click="openDetail(b.id)" title="Detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E151A" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1" stroke-linecap="round"/></svg>
          </button>
          <button v-if="store.budgetOrigin(b)?.managed" class="act del locked" disabled :title="store.budgetOrigin(b)?.tipDel">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D4B0B0" stroke-width="2"><rect x="5" y="10" width="14" height="9" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </button>
          <button v-else class="act del" @click="store.delBudget(b.id)" title="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B32E33" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Footer totals -->
      <div v-if="visRows.length" class="b-foot">
        <div class="b-foot-lbl">Total</div>
        <div class="fEst r">{{ fmt(tEst) }}</div>
        <div class="fAkt r">{{ fmt(tAkt) }}</div>
        <div class="fDib r">{{ fmt(tDib) }}</div>
        <div class="fSis r">{{ fmt(tSis) }}</div>
      </div>
    </div>

    <BudgetDetailModal :show="detailShow" :item-id="detailId" @close="onDetailClose" />
  </section>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, grp, num, fmtDate } from '../utils/index'
import BudgetDetailModal from '../components/modals/BudgetDetailModal.vue'
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
      : 'Edit nama, estimasi, aktual, dan dibayar langsung di baris. Kolom Belum Dibayar dan status pembayaran terhitung otomatis.',
  },
  {
    selector: isMobile.value ? '.mb-origin' : '.b-origin',
    icon: '🔖',
    title: 'Label Asal Item',
    desc: 'Badge kecil yang menandai dari mana item ini berasal — template bawaan, dari tab Vendor, Seserahan, atau Mahar. Item dari tab lain dikelola di sumber asalnya dan tidak bisa dihapus langsung dari sini.',
  },
  {
    selector: isMobile.value ? '.mb-status' : '.b-status',
    icon: '💳',
    title: 'Status Otomatis',
    desc: 'Status dihitung sendiri: Belum Bayar (dibayar = 0), Sebagian / DP (sudah bayar sebagian), Lunas (dibayar ≥ aktual). Tidak perlu diset manual — cukup update kolom Dibayar.',
  },
  {
    selector: '.b-actions .act',
    icon: 'ℹ️',
    title: 'Detail & Catatan',
    desc: 'Klik ikon ini untuk membuka panel detail — isi jatuh tempo pembayaran, tambahkan catatan khusus, dan informasi tambahan untuk item ini.',
  },
])

const CHIPS = [
  { f: 'all',   label: 'Semua' },
  { f: 'belum', label: 'Belum Bayar' },
  { f: 'dp',    label: 'Sebagian (DP)' },
  { f: 'lunas', label: 'Lunas' },
]

const tEst = computed(() => store.budget.reduce((s, b) => s + (b.estimasi || 0), 0))
const tAkt = computed(() => store.budget.reduce((s, b) => s + (b.aktual || 0), 0))
const tDib = computed(() => store.budget.reduce((s, b) => s + (b.dibayar || 0), 0))
const tSis = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))
const pctPaid = computed(() => tAkt.value ? Math.round(tDib.value / tAkt.value * 100) : 0)

const visRows = computed(() =>
  store.budget.filter(b => store.bFilter === 'all' || store.bStatus(b).key === store.bFilter)
)

const allVisSel  = computed(() => visRows.value.length > 0 && visRows.value.every(b => store.isSelected(b.id)))
const someVisSel = computed(() => visRows.value.some(b => store.isSelected(b.id)))

function toggleAll(e) {
  visRows.value.forEach(b => store.toggleSelected(b.id, e.target.checked))
}

async function addItem() {
  const id = store.addBudgetItem()
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

function onCurInput(e, b, field) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  b[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveB()
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
