<template>
  <div class="mg-list">
    <div v-if="!rows.length" class="mg-empty">
      <div class="mg-empty-big">Belum ada tamu</div>
      <div>Tidak ada yang cocok, atau tambah tamu baru.</div>
    </div>

    <div v-if="rows.length && !isSelecting" class="mg-hint">Tekan lama kartu untuk pilih banyak</div>

    <div
      v-for="g in rows"
      :key="g.id"
      class="mg-card"
      :class="{ unconf: (g.kehadiran || 'belum') === 'tidak', 'mg-sel': store.isSelected(g.id), 'mg-picking': isSelecting }"
      @click="onCardClick(g)"
      @touchstart.passive="onTouchStart(g.id)"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @touchmove="onTouchEnd"
    >
      <!-- Checkbox (selection mode) -->
      <div v-if="isSelecting" class="mg-cbx" :class="{ on: store.isSelected(g.id) }">
        <svg v-if="store.isSelected(g.id)" viewBox="0 0 20 20" fill="none">
          <path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="mg-main">
        <div class="mg-title">
          <span class="mg-name">{{ g.nama }}</span>
          <span class="mg-pax">({{ g.jumlah }} orang)</span>
        </div>
        <span class="mg-badge" :style="{ background: META[g.relasi]?.bg, color: META[g.relasi]?.text }">
          {{ META[g.relasi]?.label }}{{ g.undangan && g.undangan !== 'keduanya' ? ` · ${g.undangan}` : '' }}
        </span>
        <span class="mg-keh-badge" :class="'ks-' + (g.kehadiran || 'belum')">
          {{ KEHADIRAN_STATUS[g.kehadiran || 'belum'].label }}
        </span>
      </div>

      <!-- Aksi normal (hanya tampil saat bukan selection mode) -->
      <div v-if="!isSelecting" class="mg-actions" @click.stop>
        <select
          class="mg-keh-sel"
          :class="'ks-' + (g.kehadiran || 'belum')"
          :value="g.kehadiran || 'belum'"
          @change="e => setKehadiran(g, e.target.value)"
        >
          <option v-for="k in KEHADIRAN_ORDER" :key="k" :value="k">{{ KEHADIRAN_STATUS[k].label }}</option>
        </select>
        <button class="mg-act item-action-btn" title="Edit" @click="$emit('edit', g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="mg-act del item-action-btn" title="Hapus" @click="store.delGuest(g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { META, KEHADIRAN_STATUS, KEHADIRAN_ORDER } from '../data/constants'

defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['edit'])

const store = useWeddingStore()
const isSelecting = computed(() => store.selectedCount > 0)

let _pressTimer  = null
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

function onCardClick(g) {
  if (_didLongPress) { _didLongPress = false; return }
  if (isSelecting.value) {
    store.toggleSelected(g.id, !store.isSelected(g.id))
  }
}

function setKehadiran(g, val) {
  g.kehadiran = val
  store.saveG()
}
</script>

<style scoped>
.mg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mg-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  transition: border-color .15s, background .15s;
  -webkit-user-select: none;
  user-select: none;
}

.mg-card.unconf { opacity: .72; }

.mg-card.mg-sel {
  border-color: var(--wine);
  background: rgba(129,1,0,.04);
  opacity: 1;
}

.mg-card.mg-picking {
  padding-left: 50px;
}

/* Checkbox */
.mg-cbx {
  position: absolute;
  left: 14px;
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

.mg-cbx.on {
  background: var(--wine);
  border-color: var(--wine);
}

.mg-cbx svg { width: 13px; height: 13px; }

.mg-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mg-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.mg-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
  word-break: break-word;
}

.mg-pax {
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
}

.mg-badge {
  align-self: flex-start;
  max-width: 100%;
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  line-height: 1.3;
}

.mg-keh-badge {
  align-self: flex-start;
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  line-height: 1.3;
}
.mg-keh-badge.ks-belum   { color: #6b4848; background: #EDE5E2; }
.mg-keh-badge.ks-hadir   { color: #2b5010; background: #EAF3DE; }
.mg-keh-badge.ks-tidak   { color: #7a1a1a; background: #F8E8E8; }
.mg-keh-badge.ks-virtual { color: #0A1D4B; background: #E3E8F2; }

.mg-keh-sel {
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 6px 9px;
  cursor: pointer;
  background: var(--paper);
  margin-right: 2px;
}
.mg-keh-sel.ks-belum   { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.mg-keh-sel.ks-hadir   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.mg-keh-sel.ks-tidak   { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }
.mg-keh-sel.ks-virtual { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }

.mg-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mg-act {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  background: var(--ivory);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.mg-act:active { background: var(--gold-soft); }
.mg-act.del { color: var(--rose); }
.mg-act.del:active { background: var(--rose-soft); }

.mg-hint {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 2px 0 4px;
  letter-spacing: .01em;
}

.mg-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
.mg-empty-big { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
</style>
