<template>
  <transition name="mge-fade">
    <div v-if="id != null" class="mge-overlay" @click.self="close">
      <div class="mge-sheet">
        <div class="mge-head">
          <span>{{ gift?.item || 'Edit Item' }}</span>
          <button class="mge-x" aria-label="Tutup" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div v-if="gift" class="mge-body">
          <GiftForm :gift="gift" />
        </div>

        <div class="mge-foot">
          <button class="mge-del" @click="del">Hapus</button>
          <button class="mge-done" @click="close">Selesai</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import GiftForm from '../components/GiftForm.vue'

const props = defineProps({ id: { type: [Number, String], default: null } })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const gift = computed(() => store.gifts.find(x => x.id === props.id))

function close() {
  try { store.removeEmptyGift?.(props.id) } catch (_) {}
  emit('close')
}

async function del() {
  const g = gift.value
  if (!g) { emit('close'); return }
  await store.delGift(g.id)
  if (!gift.value) emit('close')
}
</script>

<style scoped>
.mge-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(36, 8, 8, .42);
}
.mge-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(36, 8, 8, .26);
}
.mge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--plum);
}
.mge-x {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
}
.mge-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 6px;
}
.mge-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
}
.mge-del {
  padding: 12px 18px;
  border: 1.5px solid var(--rose-soft);
  border-radius: 12px;
  background: var(--rose-soft);
  color: var(--rose);
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.mge-del:active { background: var(--rose); color: #fff; }
.mge-done {
  flex: 1;
  border: none;
  border-radius: 12px;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.mge-done:active { background: var(--maroon); }

.mge-fade-enter-active,
.mge-fade-leave-active { transition: opacity .22s ease; }
.mge-fade-enter-active .mge-sheet,
.mge-fade-leave-active .mge-sheet { transition: transform .22s ease; }
.mge-fade-enter-from,
.mge-fade-leave-to { opacity: 0; }
.mge-fade-enter-from .mge-sheet,
.mge-fade-leave-to .mge-sheet { transform: translateY(100%); }
</style>
