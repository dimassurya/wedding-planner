<template>
  <Teleport to="body">
    <div class="pt-root" @wheel.prevent @touchmove.prevent>
      <!-- SVG dark overlay with spotlight cutout -->
      <svg class="pt-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="pt-mask" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10000" height="10000" fill="white"/>
            <rect v-if="spot"
              class="pt-hole"
              :x="spot.x" :y="spot.y" :width="spot.w" :height="spot.h"
              rx="14" fill="black"/>
          </mask>
        </defs>
        <rect x="0" y="0" width="10000" height="10000"
          fill="rgba(10,13,25,.75)" mask="url(#pt-mask)"/>
      </svg>

      <!-- Tooltip card -->
      <Transition name="pt-tip">
        <div v-if="ready" class="pt-tip" :key="stepIdx" :style="tipStyle">
          <div class="pt-header">
            <span class="pt-icon">{{ step.icon }}</span>
            <span class="pt-prog">{{ stepIdx + 1 }}&thinsp;/&thinsp;{{ steps.length }}</span>
          </div>
          <div class="pt-title">{{ step.title }}</div>
          <div class="pt-desc">{{ step.desc }}</div>
          <div class="pt-nav">
            <button class="pt-skip" @click="finish">Lewati</button>
            <div class="pt-dots">
              <span v-for="(_, i) in steps" :key="i" class="pt-dot" :class="{ on: i === stepIdx }"></span>
            </div>
            <button class="pt-next" @click="next">
              {{ isLast ? 'Selesai ✓' : 'Lanjut →' }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { useIsMobile } from '../mobile layout/useIsMobile'

const store    = useWeddingStore()
const isMobile = useIsMobile()

// Tabs yang hanya ada di sidebar mobile (bukan bottom nav)
const SIDEBAR_TABS = new Set(['vendor', 'seserahan', 'mahar', 'admin'])

const ALL_STEPS = [
  {
    tab: 'checklist',
    icon: '✅',
    title: 'Checklist Persiapan',
    desc: 'Mulai dari sini. Buat daftar tugas per fase — 6 bulan, 3 bulan, sampai H-1.',
  },
  {
    tab: 'budget',
    icon: '💰',
    title: 'Anggaran',
    desc: 'Catat semua estimasi biaya. Vendor yang kamu aktifkan otomatis masuk ke sini.',
  },
  {
    tab: 'tamu',
    icon: '👥',
    title: 'Daftar Tamu',
    desc: 'Tambah tamu dan kelola undangan. Pantau siapa yang sudah konfirmasi hadir.',
  },
  {
    tab: 'timeline',
    icon: '📅',
    title: 'Agenda',
    desc: 'Semua tugas & pembayaran yang bertanggal dalam satu garis waktu menuju hari-H.',
  },
  {
    tab: 'vendor',
    icon: '🤝',
    title: 'Vendor',
    desc: 'Cari dan bandingkan vendor. Aktifkan "Dipakai" untuk sync harga ke Anggaran otomatis.',
  },
  {
    tab: 'seserahan',
    icon: '🎁',
    title: 'Seserahan',
    desc: 'Daftar item seserahan lengkap dengan status dan estimasi harga.',
  },
  {
    tab: 'mahar',
    icon: '💍',
    title: 'Mahar',
    desc: 'Catat dan kelola rincian mahar yang akan diserahkan.',
  },
  {
    tab: 'admin',
    icon: '📄',
    title: 'Dokumen Nikah',
    desc: 'Kelola syarat dan dokumen administrasi KUA. Template sudah tersedia.',
  },
  {
    tab: 'home',
    icon: '🏠',
    title: 'Dashboard',
    desc: 'Semua ringkasan ada di sini — progres, budget, tamu, dan deadline terdekat.',
  },
]

const stepIdx  = ref(0)
const spot     = ref(null)
const tipStyle = ref({})
const ready    = ref(false)

// Gunakan tab-specific steps kalau store.tourSteps di-set, fallback ke global
const steps = ref(store.tourSteps ? [...store.tourSteps] : [...ALL_STEPS])

const step   = computed(() => steps.value[stepIdx.value] ?? steps.value[0])
const isLast = computed(() => stepIdx.value >= steps.value.length - 1)

const PAD     = 10
const TIP_W   = 300
const TIP_GAP = 16

function findTarget(tab) {
  return document.querySelector(`button.tab[data-tab="${tab}"]`)
    || document.querySelector(`[data-tour="${tab}"]`)
}

function findStepEl(s) {
  if (s.selector) return document.querySelector(s.selector)
  return findTarget(s.tab)
}

function applySpot(el, s) {
  const r  = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const isMobNav = isMobile.value && el.matches('[data-tour]') && s.tab && !SIDEBAR_TABS.has(s.tab)
  const padTop   = isMobNav ? PAD + 20 : PAD

  spot.value = {
    x:  r.left - PAD,
    y:  r.top  - padTop,
    w:  r.width  + PAD * 2,
    h:  r.height + PAD + padTop,
    cx: r.left + r.width  / 2,
    cy: r.top  + r.height / 2,
  }

  const left = Math.max(TIP_GAP, Math.min(spot.value.cx - TIP_W / 2, vw - TIP_W - TIP_GAP))

  // Hitung ruang kosong di atas dan bawah spotlight
  const TIP_H      = 250
  const spaceAbove = spot.value.y - TIP_GAP
  const spaceBelow = vh - (spot.value.y + spot.value.h) - TIP_GAP

  let tipTop
  if (spaceBelow >= spaceAbove) {
    // Lebih banyak ruang di bawah → tampilkan di bawah, diklem agar tidak keluar viewport
    tipTop = Math.min(spot.value.y + spot.value.h + TIP_GAP, vh - TIP_H - TIP_GAP)
    tipTop = Math.max(tipTop, TIP_GAP)
  } else {
    // Lebih banyak ruang di atas → tampilkan di atas
    tipTop = Math.max(spot.value.y - TIP_H - TIP_GAP, TIP_GAP)
  }

  tipStyle.value = { left: left + 'px', top: tipTop + 'px', bottom: 'auto' }
  ready.value = true
}

async function measure() {
  ready.value = false
  const s = step.value
  if (!s) return

  if (s.tab) store.activeTab = s.tab

  const needsSidebar = s.tab && isMobile.value && SIDEBAR_TABS.has(s.tab)
  if (needsSidebar) {
    store.tourSidebarOpen = true
    await new Promise(r => setTimeout(r, 310))
  }

  await nextTick()

  const el = findStepEl(s)
  if (!el) {
    // Elemen tidak ada di DOM → loncat ke step berikutnya otomatis
    if (stepIdx.value < steps.value.length - 1) {
      stepIdx.value++
      await measure()
    } else {
      finish()
    }
    return
  }

  // Scroll instant (fixed elements tidak bergerak), ukur langsung
  el.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
  requestAnimationFrame(() => applySpot(el, s))
}

function center() {
  tipStyle.value = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
}

function closeSidebarIfOpen() {
  if (store.tourSidebarOpen) store.tourSidebarOpen = false
}

async function next() {
  closeSidebarIfOpen()
  if (isLast.value) { finish(); return }
  stepIdx.value++
  await measure()
}

function finish() {
  closeSidebarIfOpen()
  // Global tour berakhir di home; per-tab tour tetap di tab saat ini
  if (!store.tourSteps) store.activeTab = 'home'
  store.dismissWelcomeGuide()
}

onMounted(async () => {
  await nextTick()
  // Pre-filter: buang step yang selector-nya tidak ada di DOM
  // (step dengan `tab` selalu valid — nav button selalu ada)
  steps.value = steps.value.filter(s => {
    if (!s.selector) return true
    return !!document.querySelector(s.selector)
  })
  if (!steps.value.length) { store.dismissWelcomeGuide(); return }
  await measure()
  window.addEventListener('resize', measure)
})

onUnmounted(() => {
  window.removeEventListener('resize', measure)
  closeSidebarIfOpen()
})
</script>

<style scoped>
.pt-root {
  position: fixed;
  inset: 0;
  z-index: 9500;
  pointer-events: all;
  user-select: none;
}

.pt-svg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.pt-hole {
  transition: x .38s cubic-bezier(.4,0,.2,1),
              y .38s cubic-bezier(.4,0,.2,1),
              width  .38s cubic-bezier(.4,0,.2,1),
              height .38s cubic-bezier(.4,0,.2,1);
}

/* ── Tooltip ─────────────────────────────────────────────── */
.pt-tip {
  position: fixed;
  width: 300px;
  background: var(--paper);
  border: 1px solid var(--gold-soft);
  border-top: 3px solid var(--gold);
  border-radius: 16px;
  padding: 18px 20px 16px;
  box-shadow: 0 24px 64px rgba(10,13,25,.45), 0 4px 12px rgba(10,13,25,.2);
  pointer-events: all;
  z-index: 9501;
}

.pt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pt-icon { font-size: 1.3rem; line-height: 1; }

.pt-prog {
  font-size: .72rem;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: .04em;
}

.pt-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--plum);
  margin-bottom: 6px;
  line-height: 1.2;
}

.pt-desc {
  font-size: .83rem;
  color: var(--ink);
  line-height: 1.55;
  margin-bottom: 16px;
}

.pt-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pt-skip {
  font-size: .75rem;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: color .15s;
}
.pt-skip:hover { color: var(--plum); }

.pt-dots {
  display: flex;
  gap: 5px;
  flex: 1;
  justify-content: center;
}

.pt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--line);
  transition: background .2s, transform .2s;
}
.pt-dot.on { background: var(--plum); transform: scale(1.3); }

.pt-next {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--plum), var(--wine));
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(110,21,26,.25);
  transition: filter .15s, transform .1s;
}
.pt-next:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* ── Tooltip transition ───────────────────────────────────── */
.pt-tip-enter-active { transition: opacity .2s ease, transform .2s ease; }
.pt-tip-leave-active { transition: opacity .15s ease, transform .15s ease; }
.pt-tip-enter-from   { opacity: 0; transform: translateY(6px); }
.pt-tip-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
