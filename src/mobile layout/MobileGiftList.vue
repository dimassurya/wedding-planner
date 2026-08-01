<template>
  <div class="mg-wrap">
    <div v-if="!rows.length" class="mg-empty">
      <div class="mg-empty-big">Belum ada item</div>
      <div>Klik "Tambah Item" untuk mulai.</div>
    </div>

    <div v-for="g in rows" :key="g.id" class="mg-card" :class="{ done: g.status === 'sudah_diserahkan' }" @click="emit('update:editId', g.id)">
      <div class="mg-main">
        <div class="mg-title">
          <span class="mg-type">{{ g.type === 'seserahan' ? '🎁' : '💍' }}</span>
          <span class="mg-name">{{ g.item || 'Tanpa nama' }}</span>
          <span v-if="g.includeInBudget" class="mg-linked" title="Masuk Budget">🔗</span>
        </div>
        <div class="mg-price-row">
          <span class="mg-price">Rp {{ grp(g.hargaAktual || g.hargaEstimasi) }}</span>
          <span class="mg-badge">{{ g.type === 'seserahan' ? 'Seserahan' : 'Mahar' }}</span>
        </div>
        <div class="mg-status" :class="{ ok: g.status === 'sudah_diserahkan' }">
          <span class="mg-dot"></span>{{ GIFT_STATUS_OPTIONS[g.status]?.label || g.status }}
        </div>
      </div>

      <div class="mg-actions" @click.stop>
        <button class="mg-act item-action-btn" title="Edit" @click="emit('update:editId', g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="mg-act del item-action-btn" title="Hapus" @click="store.delGift(g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <MobileGiftEdit :id="editId" @close="emit('update:editId', null)" />
  </div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
import { grp } from '../utils/index'
import { GIFT_STATUS_OPTIONS } from '../data/constants'
import MobileGiftEdit from './MobileGiftEdit.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:editId'])

const store = useWeddingStore()
</script>

<style scoped>
.mg-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mg-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  cursor: pointer;
}
.mg-card.done { border-color: var(--green); }

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
  gap: 7px;
  min-width: 0;
}
.mg-type { flex: none; font-size: 15px; }
.mg-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
  word-break: break-word;
}
.mg-linked { flex: none; font-size: 12px; }
.mg-price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mg-price {
  font-size: var(--m-value);
  font-weight: 700;
  color: var(--plum);
}
.mg-badge {
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
  line-height: 1.3;
}
.mg-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
}
.mg-status .mg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
  background: transparent;
}
.mg-status.ok { color: var(--green); }
.mg-status.ok .mg-dot { background: var(--green); border-color: var(--green); }

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
