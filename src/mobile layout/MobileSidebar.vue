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

        <button class="m-side-profile" @click="$emit('profile')">
          <img v-if="avatar" :src="avatar" class="m-side-ava" :alt="accountName">
          <span v-else class="m-side-ava m-side-ava-initial">{{ accountName?.[0]?.toUpperCase() || '?' }}</span>
          <span class="m-side-profile-main">
            <span class="m-side-profile-name">{{ accountName }}</span>
            <span class="m-side-profile-sub">Profil &amp; Informasi</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

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

        <div class="m-side-bottom">
          <button class="m-side-row" :disabled="syncing" @click="syncNow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'ic-spin': syncing }"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.6-4.2"/><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.6 4.2"/><path d="M20 3v5h-5M4 21v-5h5"/></svg>
            {{ syncing ? 'Menyinkronkan…' : 'Sinkronkan sekarang' }}
          </button>
          <button class="m-side-row" @click="showPartner = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {{ store.isPartner ? 'Dashboard Bersama' : store.partnerEmail ? 'Kelola Pasangan' : 'Tambah Pasangan' }}
            <span v-if="store.partnerEmail || store.isPartner" class="m-partner-dot"></span>
          </button>
          <button v-if="showInstall" class="m-side-row" @click="onInstall">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 18h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1z"/></svg>
            Install Aplikasi
          </button>
          <button class="m-side-row danger" @click="onSignOut">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Keluar
          </button>
        </div>

        <AddPartnerCard v-if="showPartner" @close="showPartner = false" />
        <InstallGuideModal v-if="showInstallGuide" @close="showInstallGuide = false" />
      </aside>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { WP_TABS } from '../data/constants'
import { BOTTOM_TABS } from './mobileNav'
import { useInstallPWA } from '../composables/useInstallPWA'
import AddPartnerCard from '../components/AddPartnerCard.vue'
import InstallGuideModal from '../components/InstallGuideModal.vue'

defineProps({ open: Boolean })
const emit = defineEmits(['close', 'profile'])

const store = useWeddingStore()
const { showInstall, needsManualGuide, install } = useInstallPWA()
const showInstallGuide = ref(false)
const importRef   = ref(null)
const showPartner = ref(false)
const syncing     = ref(false)

// Jaring pengaman manual kalau ada perubahan pasangan yang kelewat —
// jalur otomatisnya ada di store.refetchAll(). Sidebar sengaja TIDAK
// ditutup: user perlu lihat konfirmasi "Data tersinkron"-nya.
async function syncNow() {
  if (syncing.value) return
  syncing.value = true
  try {
    await store.refetchAll({ force: true, quiet: false })
  } finally {
    syncing.value = false
  }
}

const items = WP_TABS.filter(t => !BOTTOM_TABS.includes(t.tab))

const avatar      = computed(() => store.user?.user_metadata?.avatar_url)
const accountName = computed(() =>
  store.user?.user_metadata?.full_name || store.user?.email?.split('@')[0] || ''
)

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

async function onInstall() {
  // iOS nggak punya API install — tampilkan panduan manual, jangan tutup
  // sidebar-nya dulu biar modalnya kebaca.
  if (needsManualGuide.value) { showInstallGuide.value = true; return }
  await install()
  emit('close')
}

function onSignOut() {
  store.signOut()
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

/* Baris profil — pintu masuk "Profil & Informasi" di HP (di web lewat
   foto profil / menu titik tiga di header). */
.m-side-profile {
  display: flex;
  align-items: center;
  gap: 11px;
  width: calc(100% - 20px);
  margin: 10px 10px 2px;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--ivory);
  color: var(--muted);
  text-align: left;
  cursor: pointer;
  transition: background .15s;
}
.m-side-profile:active { background: var(--gold-soft); }
.m-side-ava {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--line);
}
.m-side-ava-initial {
  display: grid;
  place-items: center;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 600;
}
.m-side-profile-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.m-side-profile-name {
  font-family: 'Jost', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-side-profile-sub { font-size: 11.5px; color: var(--muted); }

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

.m-side-bottom {
  border-top: 1px solid var(--line);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-side-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
  text-align: left;
}
.m-side-row:active { background: var(--ivory); }
.m-side-row:disabled { opacity: .6; cursor: default; }
.m-side-row.danger { color: var(--rose); }
.m-side-row.danger:active { background: #fdf0f0; }
.m-partner-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--teal, #2a9d8f);
  margin-left: auto;
  flex-shrink: 0;
}

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
