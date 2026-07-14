<template>
  <div class="mqaf" :class="{ open }">
    <transition name="mqaf-fade">
      <div v-if="open" class="mqaf-backdrop" @click="open = false"></div>
    </transition>

    <transition name="mqaf-sheet">
      <div v-if="open" class="mqaf-menu">
        <div class="mqaf-menu-head">
          <span>Tambah Cepat</span>
          <button class="mqaf-x" aria-label="Tutup" @click="open = false">&times;</button>
        </div>
        <button v-for="item in items" :key="item.tab" class="mqaf-item" @click="choose(item.tab)">
          <span class="mqaf-ico">{{ item.icon }}</span>
          <span>
            <b>{{ item.title }}</b>
            <small>{{ item.hint }}</small>
          </span>
        </button>
      </div>
    </transition>

    <button class="mqaf-btn" :aria-expanded="open" aria-label="Tambah cepat" @click="open = !open">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'

const store = useWeddingStore()
const open = ref(false)

const items = [
  { tab: 'tamu',      icon: '👥', title: 'Tambah Tamu',      hint: 'Isi undangan baru' },
  { tab: 'budget',    icon: '💰', title: 'Tambah Budget',    hint: 'Catat pos biaya' },
  { tab: 'vendor',    icon: '🤝', title: 'Tambah Vendor',    hint: 'Simpan kandidat vendor' },
  { tab: 'seserahan', icon: '🎁', title: 'Tambah Seserahan', hint: 'Catat item seserahan' },
  { tab: 'mahar',     icon: '💍', title: 'Tambah Mahar',     hint: 'Catat item mahar' },
]

async function choose(tab) {
  open.value = false
  store.clearSelected()
  store.activeTab = tab
  await nextTick()
  store.requestQuickAdd(tab)
}
</script>

<style scoped>
.mqaf {
  position: fixed;
  right: max(18px, calc((100vw - 440px) / 2 + 18px));
  bottom: calc(92px + env(safe-area-inset-bottom, 0px));
  z-index: 120;
}

.mqaf-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(36, 8, 8, .18);
  z-index: -1;
}

.mqaf-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 3px solid var(--paper);
  background: linear-gradient(135deg, var(--rose), var(--plum));
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px rgba(110, 21, 26, .38);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
}

.mqaf-btn:active { transform: scale(.96); }
.mqaf.open .mqaf-btn { transform: rotate(45deg); }

.mqaf-menu {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: min(82vw, 310px);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 14px 36px rgba(36, 8, 8, .22);
  padding: 10px;
  overflow: hidden;
}

.mqaf-menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 10px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--plum);
}

.mqaf-x {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--ivory);
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
}

.mqaf-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 10px;
  border: none;
  border-radius: 13px;
  background: transparent;
  text-align: left;
  font-family: 'Jost', sans-serif;
  color: var(--ink);
  cursor: pointer;
}

.mqaf-item:active { background: var(--gold-soft); }

.mqaf-ico {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--ivory);
  font-size: 18px;
  flex-shrink: 0;
}

.mqaf-item b {
  display: block;
  font-size: 14px;
  color: var(--plum);
  line-height: 1.2;
}

.mqaf-item small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.3;
}

.mqaf-fade-enter-active,
.mqaf-fade-leave-active { transition: opacity .18s ease; }
.mqaf-fade-enter-from,
.mqaf-fade-leave-to { opacity: 0; }

.mqaf-sheet-enter-active,
.mqaf-sheet-leave-active { transition: opacity .18s ease, transform .18s ease; }
.mqaf-sheet-enter-from,
.mqaf-sheet-leave-to { opacity: 0; transform: translateY(8px) scale(.97); }
</style>
