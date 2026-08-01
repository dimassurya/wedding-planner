<template>
  <div class="mb-wrap">
    <div v-if="!rows.length" class="mb-empty">
      <div class="mb-empty-big">Tidak ada item</div>
      <div>{{ hasItems ? 'Tidak ada item pada filter ini.' : 'Klik Tambah Item untuk mulai.' }}</div>
    </div>

    <div v-if="rows.length && !isSelecting" class="mb-hint">Tekan lama kartu untuk pilih banyak</div>

    <div
      v-for="b in rows"
      :key="b.id"
      class="mb-card"
      :class="['st-' + store.bStatus(b).key, { 'mb-sel': store.isSelected(b.id), 'mb-picking': isSelecting }]"
    >
      <button
        class="mb-main"
        @click="onCardClick(b)"
        @touchstart.passive="onTouchStart(b.id)"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @touchmove="onTouchEnd"
      >
        <!-- Checkbox (hanya tampil saat selection mode) -->
        <div v-if="isSelecting" class="mb-cbx" :class="{ on: store.isSelected(b.id) }">
          <svg v-if="store.isSelected(b.id)" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="mb-top">
          <span class="mb-name">{{ b.item || 'Tanpa nama' }}</span>
          <span
            class="mb-expand-btn" :class="{ open: isExpanded(b.id) }"
            @click.stop="onToggleExpand(b.id)"
            role="button" :aria-expanded="isExpanded(b.id)"
            :aria-label="isExpanded(b.id) ? 'Tutup daftar termin' : 'Lihat daftar termin'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>

        <div class="mb-badges">
          <span
            v-if="store.budgetOrigin(b)"
            class="mb-origin"
            :style="originStyle(store.budgetOrigin(b))"
          >{{ store.budgetOrigin(b).label }}</span>
          <span class="mb-status" :style="{ background: store.bStatus(b).bg, color: store.bStatus(b).text }">
            <span class="mb-sdot" :style="{ background: store.bStatus(b).color }"></span>{{ store.bStatus(b).label }}
          </span>
          <span v-if="selisihBadge(b)" class="mb-selisih" :class="selisihBadge(b).cls">{{ selisihBadge(b).label }}</span>
        </div>

        <div class="mb-price-row">
          <div class="mb-price-col">
            <span class="mb-price-val" :class="{ estimasi: priceInfo(b)?.kind === 'estimasi' }">Rp {{ grp(priceInfo(b)?.value || 0) }}</span>
            <span class="mb-price-lbl">{{ priceInfo(b) ? (priceInfo(b).kind === 'estimasi' ? 'Estimasi' : 'Harga Aktual') : 'Belum diisi' }}</span>
          </div>
          <span v-if="dueInfo(b)" class="mb-due-badge" :class="dueInfo(b).cls">{{ dueInfo(b).label }}</span>
        </div>

        <div class="mb-progress">
          <div class="mb-seg-bar">
            <div v-for="(s, i) in rowSegments(b)" :key="i" class="mb-seg" :class="s.cls" :style="{ flex: s.amount }"></div>
          </div>
          <div class="mb-progress-txt">{{ b.aktual > 0 ? fmt(store.paidTotal(b.id)) + ' dari ' + fmt(b.aktual) : '—' }}</div>
        </div>
      </button>

      <!-- Termin & Pembayaran (ringkas, read-only) — sama persis dengan versi web -->
      <div v-if="isExpanded(b.id)" class="mb-termin-panel">
        <div v-if="!store.itemPayments(b.id).length" class="mb-termin-empty">Belum ada termin pembayaran.</div>
        <BudgetPaymentTimelineItem
          v-for="p in store.itemPayments(b.id)" :key="p.id"
          :payment="p" :editable="false"
        />
        <button class="mb-termin-manage" @click="$emit('open', b.id)">Kelola pembayaran →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, fmtDate, fmt, daysLeft } from '../utils/index'
import BudgetPaymentTimelineItem from '../components/BudgetPaymentTimelineItem.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  // Set berisi id item yang lagi diperluas — dikelola di BudgetTab.vue
  // (satu sumber state dipakai bareng PC & mobile, meski dua-duanya nggak
  // pernah tampil bersamaan).
  expandedIds: { type: Set, default: () => new Set() },
})
const emit = defineEmits(['open', 'toggle-expand'])

const store      = useWeddingStore()
const hasItems   = computed(() => store.budget.length > 0)
const isSelecting = computed(() => store.selectedCount > 0)

let _pressTimer   = null
let _didLongPress = false

function onTouchStart(id) {
  _pressTimer = setTimeout(() => {
    _didLongPress = true
    store.toggleSelected(id, true)
    if (navigator.vibrate) navigator.vibrate(30)
  }, 500)
}

function onTouchEnd() {
  clearTimeout(_pressTimer)
  _pressTimer = null
}

function onCardClick(b) {
  if (_didLongPress) { _didLongPress = false; return }
  if (isSelecting.value) {
    store.toggleSelected(b.id, !store.isSelected(b.id))
  } else {
    emit('open', b.id)
  }
}

function isExpanded(id) { return props.expandedIds.has(id) }
function onToggleExpand(id) { emit('toggle-expand', id) }

function priceInfo(b) {
  return store.bDisplayPrice(b)
}

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

function originStyle(o) {
  const map = {
    'bo-tpl':    { background: 'var(--gold-soft)', color: '#7a5c28' },
    'bo-vendor': { background: '#0A1D4B', color: '#fff' },
    'bo-gift':   { background: '#6E151A', color: '#fff' },
  }
  return map[o.cls] || { background: 'var(--ivory)', color: 'var(--muted)' }
}

// Progress bar tersegmen & badge jatuh tempo — logic sama persis dengan
// versi web (BudgetTab.vue), biar informasinya konsisten di dua tempat.
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

function dueInfo(b) {
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
</script>

<style scoped>
.mb-wrap {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.mb-card {
  position: relative;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 13px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  overflow: hidden;
  transition: border-color .15s, background .15s;
}

.mb-card.st-lunas  { border-left-color: #CD9F65; }
.mb-card.st-dp     { border-left-color: #CD9F65; }
.mb-card.st-belum  { border-left-color: #B32E33; }
.mb-card.st-kosong { border-left-color: #9C7575; }

.mb-card.mb-sel {
  border-color: var(--wine);
  background: rgba(129,1,0,.04);
}

.mb-main {
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  -webkit-user-select: none;
  user-select: none;
}

.mb-picking .mb-main {
  padding-left: 44px;
}

/* Checkbox */
.mb-cbx {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background .15s, border-color .15s;
}

.mb-cbx.on {
  background: var(--wine);
  border-color: var(--wine);
}

.mb-cbx svg { width: 13px; height: 13px; }

.mb-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-name {
  flex: 1;
  min-width: 0;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
  word-break: break-word;
}

.mb-expand-btn {
  flex: none; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  color: var(--muted); border-radius: 6px; transition: background .15s, color .15s;
}
.mb-expand-btn:active { background: var(--ivory); color: var(--plum); }
.mb-expand-btn svg { transition: transform .15s; }
.mb-expand-btn.open svg { transform: rotate(180deg); }

.mb-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.mb-origin {
  flex: none;
  font-size: var(--m-label);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .03em;
  padding: 2px 6px;
  border-radius: 100px;
}

.mb-status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
}

.mb-sdot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.mb-selisih {
  flex: none;
  font-size: var(--m-label);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
}

.mb-selisih.hemat { color: #7a5c28; background: var(--gold-soft); }
.mb-selisih.lebih { color: #7a1a1a; background: var(--rose-soft); }

.mb-price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--line);
}

.mb-price-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mb-price-val { font-size: var(--m-value); font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; word-break: break-word; }
.mb-price-val.estimasi { color: #8a6d2f; font-style: italic; }
.mb-price-lbl { font-size: var(--m-label); text-transform: uppercase; letter-spacing: .03em; color: var(--muted); }

.mb-due-badge { flex: none; font-size: var(--m-chip); font-weight: 700; padding: 3px 9px; border-radius: 100px; white-space: nowrap; }
.due-overdue { color: #7a1a1a; background: var(--rose-soft); }
.due-soon    { color: #7a5c28; background: var(--gold-soft); }
.due-paid    { color: #2b5010; background: #EAF3DE; }
.due-later   { color: var(--muted); font-weight: 500; background: var(--ivory); }
.due-none    { color: var(--muted); font-weight: 500; font-style: italic; background: var(--ivory); }

.mb-progress { display: flex; flex-direction: column; gap: 5px; }
.mb-seg-bar { display: flex; gap: 2px; height: 6px; border-radius: 20px; overflow: hidden; }
.mb-seg { flex: 1; }
.seg-paid    { background: var(--green); }
.seg-soon    { background: #CD9F65; }
.seg-overdue { background: var(--rose); }
.seg-neutral { background: var(--line); }
.seg-empty   { background: var(--ivory); }
.mb-progress-txt { font-size: var(--m-label); color: var(--muted); font-variant-numeric: tabular-nums; }

.mb-termin-panel {
  padding: 8px 12px 12px;
  background: var(--ivory);
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
.mb-termin-empty { font-size: var(--m-sub); color: var(--muted); font-style: italic; padding: 4px 0; }
.mb-termin-manage {
  align-self: flex-start; margin-top: 6px; font-size: var(--m-sub); font-weight: 600;
  color: var(--plum); background: none; border: none; cursor: pointer; padding: 2px 0;
}
.mb-termin-manage:hover { text-decoration: underline; }

.mb-hint {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 2px 0 4px;
  letter-spacing: .01em;
}

.mb-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
.mb-empty-big { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
</style>
