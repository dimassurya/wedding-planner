<template>
  <div class="mb-wrap">
    <div v-if="!rows.length" class="mb-empty">
      <div class="mb-empty-big">Tidak ada item</div>
      <div>{{ hasItems ? 'Tidak ada item pada filter ini.' : 'Klik Tambah Item untuk mulai.' }}</div>
    </div>

    <div v-if="rows.length && !isSelecting" class="mb-hint">Tekan lama kartu untuk pilih banyak</div>

    <button
      v-for="b in rows"
      :key="b.id"
      class="mb-card"
      :class="['st-' + store.bStatus(b).key, { 'mb-sel': store.isSelected(b.id), 'mb-picking': isSelecting }]"
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

      <div class="mb-head">
        <span class="mb-name">{{ b.item || 'Tanpa nama' }}</span>
        <span
          v-if="store.budgetOrigin(b)"
          class="mb-origin"
          :style="originStyle(store.budgetOrigin(b))"
        >{{ store.budgetOrigin(b).label }}</span>
        <span class="mb-status" :style="{ background: store.bStatus(b).bg, color: store.bStatus(b).text }">
          <span class="mb-sdot" :style="{ background: store.bStatus(b).color }"></span>{{ store.bStatus(b).label }}
        </span>
      </div>

      <div class="mb-stats">
        <div class="mb-stat">
          <span class="mb-lbl">Aktual</span>
          <span class="mb-val">Rp {{ grp(b.aktual) }}</span>
        </div>
        <div class="mb-stat">
          <span class="mb-lbl">Belum Dibayar</span>
          <span class="mb-val" :class="store.bSisa(b) > 0 ? 'due' : 'ok'">Rp {{ grp(store.bSisa(b)) }}</span>
        </div>
        <div class="mb-stat">
          <span class="mb-lbl">Jatuh Tempo</span>
          <span class="mb-val" :class="{ muted: !b.jatuhTempo }">{{ fmtDate(b.jatuhTempo) }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, fmtDate } from '../utils/index'

const props = defineProps({ rows: { type: Array, default: () => [] } })
const emit  = defineEmits(['open'])

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

function originStyle(o) {
  const map = {
    'bo-tpl':    { background: 'var(--gold-soft)', color: '#7a5c28' },
    'bo-vendor': { background: '#0A1D4B', color: '#fff' },
    'bo-ser':    { background: 'var(--rose-soft)', color: '#7a1a1a' },
    'bo-mahar':  { background: '#6E151A', color: '#fff' },
  }
  return map[o.cls] || { background: 'var(--ivory)', color: 'var(--muted)' }
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
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 13px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  cursor: pointer;
  font-family: inherit;
  transition: border-color .15s, background .15s, transform .1s;
  -webkit-user-select: none;
  user-select: none;
}

.mb-card.st-lunas { border-left-color: #CD9F65; }
.mb-card.st-dp    { border-left-color: #CD9F65; }
.mb-card.st-belum { border-left-color: #B32E33; }

.mb-card.mb-sel {
  border-color: var(--wine);
  background: rgba(129,1,0,.04);
}

.mb-card.mb-picking {
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

.mb-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.mb-name {
  flex: 1;
  min-width: 90px;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
  word-break: break-word;
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

.mb-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--line);
}

.mb-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mb-lbl {
  font-size: var(--m-label);
  text-transform: uppercase;
  letter-spacing: .03em;
  color: var(--muted);
}

.mb-val {
  font-size: var(--m-value);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.mb-val.due   { color: var(--wine); }
.mb-val.ok    { color: var(--green); }
.mb-val.muted { color: var(--muted); font-weight: 500; }

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
