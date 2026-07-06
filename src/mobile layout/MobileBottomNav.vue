<template>
  <nav class="mbn">
    <button class="mbn-item" data-tour="home" :class="{ active: store.activeTab === 'home' }" @click="go('home')">
      <span class="mbn-ic">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
      </span>
      <span class="mbn-lbl">Home</span>
    </button>

    <button class="mbn-item" data-tour="tamu" :class="{ active: store.activeTab === 'tamu' }" @click="go('tamu')">
      <span class="mbn-ic">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9"/></svg>
      </span>
      <span class="mbn-lbl">Tamu</span>
    </button>

    <button class="mbn-item" data-tour="budget" :class="{ active: store.activeTab === 'budget' }" @click="go('budget')">
      <span class="mbn-ic">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18M7 15h4"/></svg>
      </span>
      <span class="mbn-lbl">Budget</span>
    </button>

    <button class="mbn-item" data-tour="checklist" :class="{ active: store.activeTab === 'checklist' }" @click="go('checklist')">
      <span class="mbn-ic">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>
      </span>
      <span class="mbn-lbl">Checklist</span>
    </button>

    <button class="mbn-item" data-tour="timeline" :class="{ active: store.activeTab === 'timeline' }" @click="go('timeline')">
      <span class="mbn-ic">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>
      </span>
      <span class="mbn-lbl">Timeline</span>
    </button>
  </nav>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'

const store = useWeddingStore()

function go(tab) {
  if (store.activeTab === tab) return
  store.clearSelected()
  store.activeTab = tab
}
</script>

<style scoped>
.mbn {
  position: fixed;
  left: 50%;
  bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 90;
  width: min(94vw, 440px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 2px;
  padding: 9px 10px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: 0 10px 28px rgba(36, 8, 8, .16), 0 2px 6px rgba(36, 8, 8, .07);
  overflow: visible;
}
.mbn-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--muted);
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
}
.mbn-ic {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
}
.mbn-lbl {
  line-height: 1;
  transition: color .2s ease, opacity .2s ease;
}
/* Item aktif: lingkaran terangkat (floating) */
.mbn-item.active { color: var(--plum); font-weight: 600; }
.mbn-item.active .mbn-ic {
  background: linear-gradient(135deg, var(--rose), var(--plum));
  color: #fff;
  transform: translateY(-16px);
  border: 3px solid var(--paper);
  box-shadow: 0 7px 16px rgba(110, 21, 26, .42);
}
/* label item aktif ikut naik sedikit biar rapat ke lingkaran */
.mbn-item.active .mbn-lbl { transform: translateY(-8px); }
.mbn-item:not(.active):active .mbn-ic { background: var(--gold-soft); color: var(--plum); }
</style>
