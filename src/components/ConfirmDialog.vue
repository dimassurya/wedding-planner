<template>
  <transition name="cd-fade">
    <div v-if="store.confirmShow" class="cd-overlay" @click.self="cancel">
      <div class="cd-card" role="alertdialog" aria-modal="true">
        <div class="cd-icon" :class="{ danger: store.confirmDanger }">
          <svg v-if="store.confirmDanger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
        </div>
        <div class="cd-title">{{ store.confirmTitle }}</div>
        <div v-if="store.confirmMessage" class="cd-msg">{{ store.confirmMessage }}</div>
        <div class="cd-actions">
          <button class="cd-btn cd-cancel" @click="cancel">{{ store.confirmCancel }}</button>
          <button class="cd-btn cd-confirm" :class="{ danger: store.confirmDanger }" @click="confirm">{{ store.confirmOk }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useWeddingStore } from '../stores/wedding'

const store = useWeddingStore()

function confirm() { store.resolveConfirm(true) }
function cancel()  { store.resolveConfirm(false) }

function onKey(e) {
  if (!store.confirmShow) return
  if (e.key === 'Escape') cancel()
  else if (e.key === 'Enter') confirm()
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.cd-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  background: rgba(36, 8, 8, .42);
}
.cd-card {
  width: 100%;
  max-width: 340px;
  background: var(--paper);
  border-radius: 18px;
  padding: 24px 22px 20px;
  text-align: center;
  box-shadow: 0 18px 48px rgba(36, 8, 8, .28);
}
.cd-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  color: var(--plum);
  background: var(--gold-soft);
}
.cd-icon.danger {
  color: var(--rose);
  background: var(--rose-soft);
}
.cd-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
}
.cd-msg {
  margin-top: 7px;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.5;
}
.cd-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.cd-btn {
  flex: 1;
  padding: 12px 14px;
  border-radius: 12px;
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s, opacity .15s;
}
.cd-cancel {
  border: 1.5px solid var(--line);
  background: var(--paper);
  color: var(--ink);
}
.cd-cancel:hover { background: var(--ivory); }
.cd-confirm {
  border: 1.5px solid var(--plum);
  background: var(--plum);
  color: #fff;
}
.cd-confirm:hover { background: var(--maroon); }
.cd-confirm.danger {
  border-color: var(--rose);
  background: var(--rose);
}
.cd-confirm.danger:hover { background: var(--wine); }

.cd-fade-enter-active,
.cd-fade-leave-active { transition: opacity .18s ease; }
.cd-fade-enter-active .cd-card { transition: transform .18s ease; }
.cd-fade-enter-from,
.cd-fade-leave-to { opacity: 0; }
.cd-fade-enter-from .cd-card { transform: scale(.94); }
</style>
