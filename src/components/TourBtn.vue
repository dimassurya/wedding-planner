<template>
  <button class="tour-btn" @click="store.startTour(steps)" title="Panduan tab ini">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .83c0 1.67-2.5 2.5-2.5 2.5"/>
      <circle cx="12" cy="17" r=".5" fill="currentColor"/>
    </svg>
    Panduan
  </button>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
defineProps({ steps: { type: Array, default: null } })
const store = useWeddingStore()
</script>

<style scoped>
.tour-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--muted);
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
  white-space: nowrap;
}
.tour-btn:hover {
  border-color: var(--gold);
  color: var(--plum);
  background: var(--gold-soft);
}
</style>
