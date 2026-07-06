<template>
  <transition name="m-drawer">
    <div v-if="open" class="m-overlay" @click.self="$emit('close')">
      <aside class="m-sidebar">
        <div class="m-side-head">
          <span>Menu Lainnya</span>
          <button class="m-close" aria-label="Tutup menu" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <nav class="m-side-nav">
          <button
            v-for="t in items"
            :key="t.tab"
            class="m-side-item"
            :data-tour="t.tab"
            :class="{ active: store.activeTab === t.tab }"
            @click="go(t.tab)"
          >{{ t.label }}</button>
        </nav>

        <div class="m-side-foot">
          <button class="m-side-act" @click="onExport">Ekspor Data</button>
          <button class="m-side-act" @click="importRef?.click()">Impor Data</button>
          <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
        </div>
      </aside>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { WP_TABS } from '../data/constants'
import { BOTTOM_TABS } from './mobileNav'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const importRef = ref(null)

// Menu yang sudah ada di bottom navbar — sisanya masuk sidebar.
const items = WP_TABS.filter(t => !BOTTOM_TABS.includes(t.tab))

function go(tab) {
  if (store.activeTab !== tab) {
    store.clearSelected()
    store.activeTab = tab
  }
  emit('close')
}

function onExport() {
  store.exportAll()
  emit('close')
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importAll(f)
  e.target.value = ''
  emit('close')
}
</script>

<style scoped>
.m-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(36, 8, 8, .38);
  display: flex;
}
.m-sidebar {
  width: min(82vw, 320px);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  box-shadow: 2px 0 24px rgba(36, 8, 8, .18);
}
.m-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--plum);
}
.m-close {
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
.m-close:active { background: var(--gold-soft); }
.m-side-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-side-item {
  text-align: left;
  padding: 13px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--ink);
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.m-side-item:active { background: var(--ivory); }
.m-side-item.active {
  background: var(--gold-soft);
  color: var(--plum);
  font-weight: 600;
}
.m-side-foot {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--line);
}
.m-side-act {
  flex: 1;
  padding: 11px 10px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.m-side-act:active { background: var(--gold-soft); border-color: var(--gold); }

/* Transisi: overlay fade + panel slide dari kiri */
.m-drawer-enter-active,
.m-drawer-leave-active { transition: opacity .25s ease; }
.m-drawer-enter-active .m-sidebar,
.m-drawer-leave-active .m-sidebar { transition: transform .25s ease; }
.m-drawer-enter-from,
.m-drawer-leave-to { opacity: 0; }
.m-drawer-enter-from .m-sidebar,
.m-drawer-leave-to .m-sidebar { transform: translateX(-100%); }
</style>
