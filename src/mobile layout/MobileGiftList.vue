<template>
  <div class="mg-wrap">
    <div v-if="!rows.length" class="mg-empty">
      <div class="mg-empty-big">Belum ada item</div>
      <div>Klik "Tambah Item" untuk mulai.</div>
    </div>

    <div v-for="g in rows" :key="g.id" class="mg-card" :class="{ done: g.status === 'sudah_diserahkan' }" @click="emit('update:editId', g.id)">
      <div class="mg-top">
        <span class="mg-badge">{{ g.type === 'seserahan' ? '🎁 Seserahan' : '💍 Mahar' }}</span>
        <span class="mg-chip" :class="statusClass(g.status)">{{ GIFT_STATUS_OPTIONS[g.status]?.label }}</span>
        <div class="mg-menu-wrap" @click.stop>
          <button class="mg-menu-btn" @click="toggleMenu(g.id)" title="Menu">⋯</button>
          <div v-if="openMenuId === g.id" class="pop-menu mg-menu-pop">
            <button class="pop-item" @click="emit('update:editId', g.id); openMenuId = null">Lihat Detail</button>
            <button class="pop-item" @click="toggleBudget(g)">{{ g.includeInBudget ? 'Keluarkan dari Budget' : 'Masukkan ke Budget' }}</button>
            <div class="pop-sep"></div>
            <button class="pop-item danger" @click="removeItem(g)">Hapus</button>
          </div>
        </div>
      </div>

      <div class="mg-name">{{ g.item || 'Tanpa nama' }}</div>

      <div class="mg-stages">
        <span v-for="(st, i) in stagesFor(g)" :key="st" class="mg-stage" :class="{ done: giftStageIndex(g) > i }">
          {{ giftStageIndex(g) > i ? '✓' : '○' }} {{ STAGE_SHORT[st] }}
        </span>
      </div>

      <div class="mg-meta">
        <span class="mg-price">Rp {{ grp(g.hargaAktual || g.hargaEstimasi) }}</span>
        <span v-if="g.tanggalPembelian" class="mg-meta-item">{{ fmtDate(g.tanggalPembelian) }}</span>
        <span v-if="g.namaToko" class="mg-meta-item">{{ g.namaToko }}</span>
        <span v-if="g.includeInBudget" class="mg-linked" title="Masuk Budget">🔗</span>
      </div>
    </div>

    <div v-if="openMenuId" class="mg-menu-backdrop" @click="openMenuId = null"></div>

    <MobileGiftEdit :id="editId" @close="emit('update:editId', null)" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, fmtDate } from '../utils/index'
import { GIFT_STATUS_OPTIONS, GIFT_STATUS_BY_TYPE } from '../data/constants'
import MobileGiftEdit from './MobileGiftEdit.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:editId'])

const store = useWeddingStore()
const openMenuId = ref(null)

const STAGE_SHORT = { sudah_dibeli: 'Dibeli', sudah_dikemas: 'Dikemas', sudah_diserahkan: 'Diserahkan' }

function giftStages(type) { return GIFT_STATUS_BY_TYPE[type] || GIFT_STATUS_BY_TYPE.mahar }
function giftStageIndex(g) {
  const idx = giftStages(g.type).indexOf(g.status)
  return idx < 0 ? 0 : idx
}
function stagesFor(g) { return giftStages(g.type).slice(1) }
function statusClass(status) {
  if (status === 'sudah_diserahkan') return 'st-done'
  if (status === 'belum_dibeli') return 'st-todo'
  return 'st-progress'
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}
function toggleBudget(g) {
  g.includeInBudget = !g.includeInBudget
  store.saveGifts()
  openMenuId.value = null
}
function removeItem(g) {
  openMenuId.value = null
  store.delGift(g.id)
}
</script>

<style scoped>
.mg-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}
.mg-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 13px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  cursor: pointer;
}
.mg-card.done { border-color: var(--green); }

.mg-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mg-badge {
  flex: none;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 100px;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
}
.mg-chip {
  flex: none;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2.5px 8px;
  border-radius: 100px;
}
.mg-chip.st-todo     { color: var(--muted); background: var(--ivory); }
.mg-chip.st-progress { color: #7a5c28; background: var(--gold-soft); }
.mg-chip.st-done      { color: #2b5010; background: #EAF3DE; }

.mg-menu-wrap { position: relative; margin-left: auto; }
.mg-menu-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}
.mg-menu-btn:active { background: var(--gold-soft); color: var(--plum); }
.mg-menu-pop { top: calc(100% + 4px); right: 0; min-width: 200px; }
.mg-menu-backdrop { position: fixed; inset: 0; z-index: 150; }

.mg-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
  word-break: break-word;
}

.mg-stages {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
}
.mg-stage.done { color: var(--green); font-weight: 600; }

.mg-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding-top: 4px;
  border-top: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--muted);
}
.mg-price {
  font-size: var(--m-value);
  font-weight: 700;
  color: var(--plum);
  margin-right: 2px;
}
.mg-meta-item::before { content: '·'; margin-right: 8px; color: var(--line); }
.mg-linked { margin-left: auto; font-size: 12px; }

.mg-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--muted);
}
.mg-empty-big {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 4px;
}
</style>
