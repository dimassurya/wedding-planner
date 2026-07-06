<template>
  <header class="m-header">
    <div class="m-brand">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1.5" stroke-linejoin="round"/></svg>
      <span>Wedding Planner</span>
    </div>
    <div class="m-header-actions">
      <button class="m-guide-btn" aria-label="Panduan" @click="store.startTour()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .83c0 1.67-2.5 2.5-2.5 2.5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
      </button>
      <button class="m-burger" aria-label="Buka menu" @click="$emit('toggle-menu')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
defineEmits(['toggle-menu'])
const store = useWeddingStore()
</script>

<style scoped>
.m-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 1px 0 var(--line);
}
.m-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--plum);
  white-space: nowrap;
}
.m-burger {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s;
}
.m-burger:active { background: var(--gold-soft); }
.m-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.m-guide-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--muted);
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.m-guide-btn:active {
  background: var(--gold-soft);
  border-color: var(--gold);
  color: var(--plum);
}
</style>
