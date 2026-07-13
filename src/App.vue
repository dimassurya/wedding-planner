<template>
  <div id="app">
    <!-- Loading awal (cek session) -->
    <div v-if="store.loading" class="auth-loading">
      <div class="auth-loading-inner">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <div class="auth-loading-dot"></div>
        <div class="auth-loading-hint">Menghubungkan ke server…</div>
      </div>
    </div>

    <!-- Belum login -->
    <LoginPage v-else-if="!store.user" />

    <!-- App utama (sudah onboarding) -->
    <template v-else-if="store.onboarded">
      <!-- ══ Header PC ══ -->
      <header v-if="!isMobile" class="app-header">
        <div class="app-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <span>Wedding Planner</span>
        </div>

        <nav class="tabs-nav" ref="tabsNav">
          <div class="tabs" ref="tabBar" @dragover.prevent="onTabBarDragOver">
            <button
              v-for="tab in visibleTabs"
              :key="tab.tab"
              class="tab"
              :class="{ active: store.activeTab === tab.tab }"
              :data-tab="tab.tab"
              draggable="true"
              @click="switchTab(tab.tab)"
              @dragstart="onTabDragStart($event, tab.tab)"
              @dragend="onTabDragEnd"
            >{{ tab.label }}</button>
          </div>

          <!-- Tab yang tidak muat dipindah ke sini -->
          <div v-if="overflowTabs.length" class="tab-more" ref="moreWrap">
            <button class="tab tab-more-btn" :class="{ active: overflowActive }" @click="showMoreMenu = !showMoreMenu">
              Lainnya
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="{ transform: showMoreMenu ? 'rotate(180deg)' : '' }"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div v-if="showMoreMenu" class="pop-menu tab-more-menu">
              <button
                v-for="tab in overflowTabs"
                :key="tab.tab"
                class="pop-item"
                :class="{ active: store.activeTab === tab.tab }"
                @click="switchTab(tab.tab); showMoreMenu = false"
              >{{ tab.label }}</button>
            </div>
          </div>
        </nav>

        <div class="app-actions">
          <div class="app-user">
            <img v-if="userAvatar" :src="userAvatar" class="user-avatar" :alt="userName" :title="store.user?.email">
            <span v-else class="user-initial" :title="store.user?.email">{{ userName?.[0]?.toUpperCase() }}</span>
          </div>
          <div class="act-menu" ref="actMenu">
            <button class="icon-btn act-menu-btn" :class="{ open: showActMenu }" @click="showActMenu = !showActMenu" title="Menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
            </button>
            <div v-if="showActMenu" class="pop-menu act-menu-pop">
              <button class="pop-item" @click="store.startTour(); showActMenu = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .83c0 1.67-2.5 2.5-2.5 2.5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
                Panduan
              </button>
              <button v-if="canInstall" class="pop-item" @click="install(); showActMenu = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 18h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1z"/></svg>
                Install aplikasi
              </button>
              <button class="pop-item" @click="store.exportAll(); showActMenu = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 18h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1z"/></svg>
                Ekspor data
              </button>
              <button class="pop-item" @click="importAllRef?.click(); showActMenu = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 16V3M8 7l4-4 4 4"/><path d="M3 18h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1z"/></svg>
                Impor data
              </button>
              <div class="pop-sep"></div>
              <button class="pop-item danger" @click="store.signOut()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Keluar
              </button>
            </div>
          </div>
          <input ref="importAllRef" type="file" accept=".json" hidden @change="onImportAll">
        </div>
      </header>

      <!-- ══ Header mobile ══ -->
      <MobileHeader v-else @toggle-menu="mobileMenuOpen = !mobileMenuOpen" />

      <main class="panels">
        <HomeTab      v-show="store.activeTab === 'home'" />
        <GuestsTab    v-show="store.activeTab === 'tamu'" />
        <BudgetTab    v-show="store.activeTab === 'budget'" />
        <VendorTab    v-show="store.activeTab === 'vendor'" />
        <SeserahanTab v-show="store.activeTab === 'seserahan'" />
        <MaharTab     v-show="store.activeTab === 'mahar'" />
        <AdminTab     v-show="store.activeTab === 'admin'" />
        <ChecklistTab v-show="store.activeTab === 'checklist'" />
        <TimelineTab  v-show="store.activeTab === 'timeline'" />
      </main>

      <!-- Single global BulkBar + BulkEditModal -->
      <template v-if="isBulkTab">
        <div v-if="store.selectedCount > 0" class="bulkbar show">
          <span class="count"><b>{{ store.selectedCount }}</b> dipilih</span>
          <button v-if="store.activeTab !== 'budget'" class="bbtn primary" @click="showBulk = true">Ubah Status</button>
          <button class="bbtn danger" @click="store.bulkDelete(store.activeTab)">Hapus</button>
          <button class="bbtn x" title="Batal pilih" @click="store.clearSelected()">&times;</button>
        </div>
        <BulkEditModal :show="showBulk" :tab="store.activeTab" @close="showBulk = false" @applied="showBulk = false" />
      </template>

      <!-- ══ Navigasi mobile ══ -->
      <template v-if="isMobile">
        <MobileQuickAddFab v-show="!isBulkActive" />
        <MobileBottomNav v-show="!isBulkActive" />
        <MobileSidebar :open="mobileMenuOpen || store.tourSidebarOpen" @close="mobileMenuOpen = false" />
      </template>

      <ConfirmDialog />
      <ToastNotif />
      <WelcomeGuide v-if="store.showWelcomeGuide" />
    </template>

    <!-- Onboarding (welcome) — dipicu dari tombol "Bayar Sekarang" -->
    <OnboardingFlow v-else-if="store.beginOnboarding" />

    <!-- Belum onboarding → paywall -->
    <PaymentPage v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useWeddingStore } from './stores/wedding'
import { WP_TABS } from './data/constants'
import { useInstallPWA } from './composables/useInstallPWA'

import LoginPage      from './views/LoginPage.vue'
import PaymentPage    from './views/PaymentPage.vue'
import OnboardingFlow from './views/OnboardingFlow.vue'
import WelcomeGuide   from './views/WelcomeGuide.vue'

import HomeTab      from './views/HomeTab.vue'
import GuestsTab    from './views/GuestsTab.vue'
import BudgetTab    from './views/BudgetTab.vue'
import VendorTab    from './views/VendorTab.vue'
import SeserahanTab from './views/SeserahanTab.vue'
import MaharTab     from './views/MaharTab.vue'
import AdminTab     from './views/AdminTab.vue'
import ChecklistTab from './views/ChecklistTab.vue'
import TimelineTab  from './views/TimelineTab.vue'
import BulkEditModal from './components/modals/BulkEditModal.vue'
import ToastNotif   from './components/ToastNotif.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

import { useIsMobile } from './mobile layout/useIsMobile'
import MobileHeader    from './mobile layout/MobileHeader.vue'
import MobileBottomNav from './mobile layout/MobileBottomNav.vue'
import MobileQuickAddFab from './mobile layout/MobileQuickAddFab.vue'
import MobileSidebar   from './mobile layout/MobileSidebar.vue'
import { useReminderNotifications } from './composables/useReminderNotifications'

const store        = useWeddingStore()
const { canInstall, install } = useInstallPWA() // desktop header only
const { checkReminders } = useReminderNotifications()
const tabBar       = ref(null)
const tabsNav      = ref(null)
const moreWrap     = ref(null)
const actMenu      = ref(null)
const importAllRef = ref(null)
const showBulk     = ref(false)
const showMoreMenu = ref(false)
const showActMenu  = ref(false)
const visibleCount = ref(WP_TABS.length)

const isMobile       = useIsMobile()
const mobileMenuOpen = ref(false)

const userAvatar = computed(() => store.user?.user_metadata?.avatar_url)
const userName   = computed(() => store.user?.user_metadata?.full_name || store.user?.email?.split('@')[0] || '')

const BULK_TABS   = ['tamu', 'vendor', 'budget', 'seserahan', 'mahar']
const isBulkTab   = computed(() => BULK_TABS.includes(store.activeTab))
const isBulkActive = computed(() => isBulkTab.value && store.selectedCount > 0)

let dragTabId      = null
let tabJustDragged = false

const orderedTabs = computed(() => {
  const order = store.tabOrder
  if (!order.length) return WP_TABS
  const known = order.map(id => WP_TABS.find(t => t.tab === id)).filter(Boolean)
  const rest  = WP_TABS.filter(t => !order.includes(t.tab))
  return [...known, ...rest]
})

// Tab yang muat vs yang dipindah ke menu "Lainnya" (dihitung dari lebar header)
const visibleTabs    = computed(() => orderedTabs.value.slice(0, visibleCount.value))
const overflowTabs   = computed(() => orderedTabs.value.slice(visibleCount.value))
const overflowActive = computed(() => overflowTabs.value.some(t => t.tab === store.activeTab))

// Lebar tiap tab (px), diukur dari DOM. Dipakai untuk hitung berapa yang muat.
let tabWidths = []

async function measureTabs() {
  if (isMobile.value || !store.onboarded) return
  visibleCount.value = orderedTabs.value.length   // tampilkan semua dulu utk diukur
  await nextTick()
  if (!tabBar.value) return
  const gap = 6
  tabWidths = [...tabBar.value.querySelectorAll('.tab')]
    .map(el => el.getBoundingClientRect().width + gap)
  recompute()
}

function recompute() {
  if (!tabsNav.value || !tabWidths.length) return
  const navW = tabsNav.value.clientWidth
  const PILL = 18    // padding + border pill .tabs
  const MORE = 112   // ruang tombol "Lainnya"
  const total = tabWidths.reduce((a, b) => a + b, 0) + PILL
  if (total <= navW) { visibleCount.value = tabWidths.length; return }
  let used = PILL + MORE, count = 0
  for (const w of tabWidths) {
    if (used + w <= navW) { used += w; count++ } else break
  }
  visibleCount.value = Math.max(count, 1)
}

function switchTab(tab) {
  if (tabJustDragged) return
  if (store.activeTab === tab) return
  store.clearSelected()
  showBulk.value = false
  store.activeTab = tab
}

function onTabDragStart(e, tabId) {
  dragTabId = tabId
  e.currentTarget?.classList.add('dragging')
  tabBar.value?.classList.add('reordering')
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onTabBarDragOver(e) {
  if (!dragTabId || !tabBar.value) return
  const dragging = tabBar.value.querySelector(`.tab[data-tab="${dragTabId}"]`)
  if (!dragging) return
  const tabs = [...tabBar.value.querySelectorAll('.tab:not(.dragging)')]
  const after = tabs.find(t => {
    const r = t.getBoundingClientRect()
    return e.clientX < r.left + r.width / 2
  })
  if (after) tabBar.value.insertBefore(dragging, after)
  else tabBar.value.appendChild(dragging)
}

function onTabDragEnd(e) {
  e.currentTarget?.classList.remove('dragging')
  tabBar.value?.classList.remove('reordering')
  if (tabBar.value) {
    // Gabung urutan tab yg terlihat (dari DOM) + tab di menu "Lainnya" (di akhir)
    const visibleOrder  = [...tabBar.value.querySelectorAll('.tab')].map(t => t.dataset.tab).filter(Boolean)
    const overflowOrder = overflowTabs.value.map(t => t.tab)
    store.saveTabOrder([...visibleOrder, ...overflowOrder])
  }
  dragTabId = null
  tabJustDragged = true
  setTimeout(() => { tabJustDragged = false }, 60)
}

function onImportAll(e) {
  const f = e.target.files[0]
  if (f) store.importAll(f)
  e.target.value = ''
}

let _ro = null

function onDocClick(e) {
  if (showMoreMenu.value && moreWrap.value && !moreWrap.value.contains(e.target)) showMoreMenu.value = false
  if (showActMenu.value && actMenu.value && !actMenu.value.contains(e.target)) showActMenu.value = false
}

// Re-observe & ukur ulang tiap header muncul (mis. pindah dari mobile ke desktop)
watch(() => store.onboarded && !isMobile.value, ok => {
  if (!ok) { _ro?.disconnect(); return }
  nextTick(() => {
    measureTabs()
    if (_ro && tabsNav.value) _ro.observe(tabsNav.value)
  })
}, { immediate: true })

// Susunan tab berubah (reorder) → ukur ulang
watch(orderedTabs, () => nextTick(measureTabs))

onMounted(() => {
  // Simpan token invite dari URL sebelum OAuth redirect membersihkannya
  const inviteToken = new URLSearchParams(window.location.search).get('invite')
  if (inviteToken) {
    sessionStorage.setItem('pending_invite', inviteToken)
    window.history.replaceState({}, '', window.location.pathname)
  }

  store.initAuth()
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      store.clearSelected()
      showBulk.value = false
      showMoreMenu.value = false
      showActMenu.value = false
    }
  })

  // Tutup dropdown header saat klik di luar
  document.addEventListener('click', onDocClick)

  // Hitung ulang overflow tab saat lebar header berubah
  _ro = new ResizeObserver(() => recompute())
  measureTabs()
  document.fonts?.ready.then(() => measureTabs())

  // PWA back button: track tab navigation in browser history
  history.replaceState({ tab: store.activeTab }, '')

  let _fromPop = false
  watch(() => store.activeTab, tab => {
    if (_fromPop) return
    history.pushState({ tab }, '')
  })

  window.addEventListener('popstate', e => {
    const tab = e.state?.tab
    if (tab) {
      _fromPop = true
      store.clearSelected()
      showBulk.value = false
      store.activeTab = tab
      _fromPop = false
    } else {
      history.replaceState({ tab: store.activeTab }, '')
    }
  })

  // Reminder: cek deadline dekat begitu data selesai dimuat, lalu tiap kali
  // app kembali aktif (tab difokus lagi / app dibuka dari background)
  watch(() => store.loading, done => {
    if (!done && store.user) checkReminders(store)
  })
  document.addEventListener('visibilitychange', onReminderVisible)
  window.addEventListener('focus', onReminderFocus)
})

function onReminderVisible() {
  if (document.visibilityState === 'visible') checkReminders(store)
}
function onReminderFocus() { checkReminders(store) }

onBeforeUnmount(() => {
  _ro?.disconnect()
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('visibilitychange', onReminderVisible)
  window.removeEventListener('focus', onReminderFocus)
})
</script>

<style>
.auth-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ivory);
  z-index: 9999;
}

.auth-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.auth-loading-dot {
  width: 8px;
  height: 8px;
  background: var(--wine);
  border-radius: 50%;
  animation: loadpulse 1s ease-in-out infinite;
}

@keyframes loadpulse {
  0%, 100% { opacity: .3; transform: scale(.8); }
  50%       { opacity: 1;  transform: scale(1.2); }
}
.auth-loading-hint {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-top: 10px;
  animation: loadpulse 2s ease-in-out infinite;
}

.app-user {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--line);
}

.user-initial {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--plum);
  color: #fff;
  font-size: .75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--line);
}

.user-signout {
  color: var(--muted);
  transition: color .15s;
}
.user-signout:hover { color: var(--rose); }

.tour-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.tour-trigger:hover {
  border-color: var(--gold) !important;
  color: var(--plum) !important;
}

.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-color: var(--gold-soft) !important;
  color: var(--plum) !important;
}
.install-btn:hover {
  background: var(--gold-soft) !important;
  color: var(--plum) !important;
}

</style>
