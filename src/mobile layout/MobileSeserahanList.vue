<template>
  <div class="ms-wrap">
    <div v-if="!rows.length" class="ms-empty">
      <div class="ms-empty-big">Belum ada item seserahan</div>
      <div>Klik "Tambah Item" untuk mulai.</div>
    </div>

    <div v-for="s in rows" :key="s.id" class="ms-card" :class="{ done: s.status }" @click="emit('update:editId', s.id)">
      <div class="ms-main">
        <div class="ms-title">
          <span class="ms-name">{{ s.item || 'Tanpa nama' }}</span>
          <a v-if="s.link" class="ms-link" :href="s.link" target="_blank" rel="noopener" title="Buka link" @click.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        <div class="ms-price-row">
          <span class="ms-price">Rp {{ grp(s.harga) }}</span>
          <span class="ms-badge">Budget Rp {{ grp(s.budget) }}</span>
        </div>
        <div class="ms-status" :class="{ ok: s.status }">
          <span class="ms-dot"></span>{{ s.status ? 'Sudah Dibeli' : 'Belum Dibeli' }}
        </div>
      </div>

      <div class="ms-actions" @click.stop>
        <SwitchToggle :model-value="!!s.status" title="Sudah dibeli?" @update:model-value="val => toggleStatus(s, val)" />
        <button class="ms-act item-action-btn" title="Edit" @click="emit('update:editId', s.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="ms-act del item-action-btn" title="Hapus" @click="store.delSeserahan(s.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <MobileSeserahanEdit :id="editId" @close="emit('update:editId', null)" />
  </div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
import { grp } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'
import MobileSeserahanEdit from './MobileSeserahanEdit.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:editId'])

const store = useWeddingStore()

function toggleStatus(s, val) {
  s.status = val
  store.saveS()
}
</script>

<style scoped>
.ms-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ms-card {
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
.ms-card.done { border-color: var(--green); }

.ms-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ms-title {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
}
.ms-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
  word-break: break-word;
}
.ms-link {
  flex: none;
  align-self: center;
  color: var(--plum);
  display: inline-grid;
  place-items: center;
}
.ms-price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.ms-price {
  font-size: var(--m-value);
  font-weight: 700;
  color: var(--plum);
}
.ms-badge {
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
  line-height: 1.3;
}
.ms-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
}
.ms-status .ms-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
  background: transparent;
}
.ms-status.ok { color: var(--green); }
.ms-status.ok .ms-dot { background: var(--green); border-color: var(--green); }

.ms-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ms-act {
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
.ms-act:active { background: var(--gold-soft); }
.ms-act.del { color: var(--rose); }
.ms-act.del:active { background: var(--rose-soft); }
</style>
