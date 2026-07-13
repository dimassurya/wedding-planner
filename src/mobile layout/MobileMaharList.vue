<template>
  <div class="mm-wrap">
    <div v-if="!rows.length" class="mm-empty">
      <div class="mm-empty-big">Belum ada item mahar</div>
      <div>Klik "Tambah Item" untuk mulai.</div>
    </div>

    <div v-for="m in rows" :key="m.id" class="mm-card" :class="{ done: m.status }" @click="emit('update:editId', m.id)">
      <div class="mm-main">
        <div class="mm-name">{{ m.item || 'Tanpa nama' }}</div>
        <div class="mm-price">Rp {{ grp(m.harga) }}</div>
        <div class="mm-status" :class="{ ok: m.status }">
          <span class="mm-dot"></span>{{ m.status ? 'Sudah Disiapkan' : 'Belum Disiapkan' }}
        </div>
      </div>

      <div class="mm-actions" @click.stop>
        <SwitchToggle :model-value="!!m.status" title="Sudah disiapkan?" @update:model-value="val => toggleStatus(m, val)" />
        <button class="mm-act item-action-btn" title="Edit" @click="emit('update:editId', m.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="mm-act del item-action-btn" title="Hapus" @click="store.delMahar(m.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <MobileMaharEdit :id="editId" @close="emit('update:editId', null)" />
  </div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
import { grp } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'
import MobileMaharEdit from './MobileMaharEdit.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:editId'])

const store = useWeddingStore()

function toggleStatus(m, val) {
  m.status = val
  store.saveM()
}
</script>

<style scoped>
.mm-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mm-card {
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
.mm-card.done { border-color: var(--green); }

.mm-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mm-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
  word-break: break-word;
}
.mm-price {
  font-size: var(--m-value);
  font-weight: 700;
  color: var(--plum);
}
.mm-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
}
.mm-status .mm-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
  background: transparent;
}
.mm-status.ok { color: var(--green); }
.mm-status.ok .mm-dot { background: var(--green); border-color: var(--green); }

.mm-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.mm-act {
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
.mm-act:active { background: var(--gold-soft); }
.mm-act.del { color: var(--rose); }
.mm-act.del:active { background: var(--rose-soft); }
</style>
