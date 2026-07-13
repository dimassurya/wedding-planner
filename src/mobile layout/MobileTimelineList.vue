<template>
  <div class="mtl-list">
    <div v-if="!rows.length" class="mtl-empty">
      <div class="mtl-empty-big">Belum ada tugas</div>
      <div>Klik "Tambah Tugas" untuk mulai.</div>
    </div>

    <div
      v-for="r in rows"
      :key="r.auto ? 'auto-' + r.tugas : r.id"
      class="mtl-card"
      :class="{ auto: r.auto, overdue: isOverdue(r) }"
      @click="onCardClick(r)"
    >
      <div class="mtl-main">
        <div class="mtl-name">{{ r.tugas }}</div>
        <div class="mtl-badges">
          <span class="mtl-badge" :style="statusStyle(r.status)">{{ TL_STATUS[r.status].label }}</span>
          <span v-if="r.pic" class="mtl-badge" :style="picStyle(r.pic)">{{ TL_PIC[r.pic].label }}</span>
          <span v-if="r.auto" class="mtl-src">Budget</span>
        </div>
      </div>

      <div class="mtl-right">
        <div class="mtl-dl">
          <span class="mtl-dl-lbl">Deadline</span>
          <span class="mtl-dl-val">{{ fmtDate(r.deadline) }}</span>
        </div>
        <template v-if="!r.auto">
          <button class="mtl-del item-action-btn" title="Hapus" @click.stop="store.delTimeline(r.id)">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
          <span class="mtl-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </span>
        </template>
      </div>
    </div>

    <MobileTimelineEdit :id="editId" @close="emit('update:editId', null)" />
  </div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
import { TL_STATUS, TL_PIC } from '../data/constants'
import { fmtDate } from '../utils/index'
import MobileTimelineEdit from './MobileTimelineEdit.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:editId'])

const store = useWeddingStore()

const STATUS_STYLE = {
  belum:   { background: '#B32E33', color: '#fff' },
  sedang:  { background: '#CD9F65', color: '#3A2000' },
  selesai: { background: '#CD9F65', color: '#3a2a10' },
}
const PIC_STYLE = {
  pria:     { background: '#0A1D4B', color: '#fff' },
  wanita:   { background: '#6E151A', color: '#fff' },
  keduanya: { background: '#CD9F65', color: '#3A2000' },
}
const statusStyle = k => STATUS_STYLE[k]
const picStyle = k => PIC_STYLE[k]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const today = todayISO()
const isOverdue = r => r.deadline && r.deadline < today && r.status !== 'selesai'

function onCardClick(r) {
  if (r.auto) return
  emit('update:editId', r.id)
}
</script>

<style scoped>
.mtl-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mtl-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  cursor: pointer;
}
.mtl-card.auto { cursor: default; opacity: .82; }
.mtl-card.overdue { border-color: var(--rose); }

.mtl-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.mtl-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
  word-break: break-word;
}
.mtl-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.mtl-badge {
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 100px;
  line-height: 1.3;
}
.mtl-src {
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 100px;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
}

.mtl-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mtl-dl {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.25;
}
.mtl-dl-lbl {
  font-size: var(--m-label);
  text-transform: uppercase;
  letter-spacing: .03em;
  color: var(--muted);
}
.mtl-dl-val {
  font-size: var(--m-value);
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
.mtl-del {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid var(--rose-soft);
  border-radius: 8px;
  background: var(--ivory);
  color: var(--rose);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.mtl-del:active { background: var(--rose-soft); }
.mtl-arrow {
  display: grid;
  place-items: center;
  color: var(--muted);
}
</style>
