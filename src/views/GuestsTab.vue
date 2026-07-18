<template>
  <section class="panel active" id="panel-tamu">
    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
        <div class="num">{{ confirmedList.length }}</div><div class="lbl">Undangan dikonfirmasi</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div class="num">{{ totalOrang }}</div><div class="lbl">Total tamu (orang)</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5z"/><rect x="5" y="18" width="14" height="2" rx="1"/></svg></div>
        <div class="num">{{ pria }}</div><div class="lbl">Pihak pria (orang)</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="5.5" rx="2" ry="3.5"/><ellipse cx="12" cy="18.5" rx="2" ry="3.5"/><ellipse cx="5.5" cy="12" rx="3.5" ry="2"/><ellipse cx="18.5" cy="12" rx="3.5" ry="2"/><ellipse cx="7.5" cy="7.5" rx="2" ry="3" transform="rotate(-45 7.5 7.5)"/><ellipse cx="16.5" cy="16.5" rx="2" ry="3" transform="rotate(-45 16.5 16.5)"/><ellipse cx="16.5" cy="7.5" rx="2" ry="3" transform="rotate(45 16.5 7.5)"/><ellipse cx="7.5" cy="16.5" rx="2" ry="3" transform="rotate(45 7.5 16.5)"/></svg></div>
        <div class="num">{{ wanita }}</div><div class="lbl">Pihak wanita (orang)</div>
      </div>
    </div>

    <!-- Breakdown -->
    <div class="gbreakdown">
      <div class="bg-grid">
        <div class="bgrp bgrp-pria">
          <div class="bgrp-head"><span>Pihak Pria</span><b>{{ pria }} org</b></div>
          <div v-for="k in ['cpp','teman_pria','tetangga_pria']" :key="k" class="bg-row">
            <span class="bg-dot" :style="{ background: META[k].color }"></span>
            <span class="bg-type">{{ META[k].group }}</span>
            <span class="bg-val">{{ byPax[k] || 0 }} org</span>
            <span class="bg-sub">{{ byCnt[k] || 0 }} und</span>
          </div>
        </div>
        <div class="bgrp bgrp-wanita">
          <div class="bgrp-head"><span>Pihak Wanita</span><b>{{ wanita }} org</b></div>
          <div v-for="k in ['cpw','teman_wanita','tetangga_wanita']" :key="k" class="bg-row">
            <span class="bg-dot" :style="{ background: META[k].color }"></span>
            <span class="bg-type">{{ META[k].group }}</span>
            <span class="bg-val">{{ byPax[k] || 0 }} org</span>
            <span class="bg-sub">{{ byCnt[k] || 0 }} und</span>
          </div>
        </div>
      </div>
      <div v-if="byPax.lainnya" class="bgrp bgrp-lain">
        <div class="bg-row">
          <span class="bg-dot" :style="{ background: META.lainnya.color }"></span>
          <span class="bg-type">Lainnya (tanpa pihak)</span>
          <span class="bg-val">{{ byPax.lainnya }} org</span>
          <span class="bg-sub">{{ byCnt.lainnya }} und</span>
        </div>
      </div>
    </div>

    <p v-if="belumKonfirmasi > 0" id="gConfirmInfo" class="g-confirm-info">
      Statistik dihitung dari {{ confirmedList.length }} undangan terkonfirmasi · {{ belumKonfirmasi }} belum dikonfirmasi
    </p>
    <p v-else class="g-confirm-info">Semua {{ confirmedList.length }} undangan sudah dikonfirmasi</p>

    <!-- Warning kapasitas venue (baca dari venue yang dipakai; null = belum ada) -->
    <button
      v-if="store.capacityOver !== null"
      class="g-cap" :class="store.capacityOver > 0 ? 'over' : 'ok'"
      @click="store.activeTab = 'vendor'"
    >
      <span class="g-cap-ico">
        <svg v-if="store.capacityOver > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </span>
      <span class="g-cap-body">
        <template v-if="store.capacityOver > 0">
          <b>Kelebihan {{ store.capacityOver }} orang</b> dari kapasitas venue
        </template>
        <template v-else>
          Masih muat · <b>sisa {{ -store.capacityOver }} kursi</b>
        </template>
        <span class="g-cap-sub">{{ store.totalGuestPax }} tamu / {{ store.venueCapacity }} kapasitas</span>
      </span>
      <svg class="g-cap-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>

    <!-- Controls -->
    <div class="controls">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9C7575" stroke-width="2"/><path d="M21 21l-4-4" stroke="#9C7575" stroke-width="2" stroke-linecap="round"/></svg>
        <input v-model="search" type="text" placeholder="Cari nama tamu...">
      </div>
      <select class="filter" v-model="filterStatus">
        <option value="all">Semua Relasi</option>
        <option v-for="k in ORDER" :key="k" :value="k">{{ META[k].label }}</option>
      </select>
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Tamu
      </button>
      <button class="icon-btn" @click="store.exportGuestsCSV()">Ekspor</button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('tamu')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json,application/json" hidden @change="onImport">
      </div>
      <TourBtn :steps="TAMU_STEPS" />
    </div>

    <!-- Daftar tamu: kartu untuk mobile -->
    <MobileGuestList v-if="isMobile" :rows="visRows" @edit="openEdit" />

    <!-- Table (PC) -->
    <div v-else class="card table-card">
      <div class="table-scroll">
      <div class="t-head">
        <div class="t-cbx"><input type="checkbox" class="cbx" :checked="allVisSelected" :indeterminate.prop="someVisSelected && !allVisSelected" @change="toggleAll"></div>
        <div>No</div><div>Nama Tamu</div><div>Jumlah Orang</div><div>Status Relasi</div><div>Konfirmasi</div><div class="t-actions"></div>
      </div>

      <div v-if="!visRows.length" class="empty">
        <div class="big">Belum ada tamu</div>
        <div>{{ search || filterStatus !== 'all' ? 'Tidak ada yang cocok.' : 'Klik Tambah Tamu untuk mulai.' }}</div>
      </div>

      <div v-for="(g, i) in visRows" :key="g.id" class="t-row" :class="{ sel: store.isSelected(g.id), unconfirmed: !isConf(g) }" :data-id="g.id">
        <div class="t-cbx"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(g.id)" @change="e => store.toggleSelected(g.id, e.target.checked)"></div>
        <div class="t-no">{{ i + 1 }}</div>
        <div class="t-name">{{ g.nama }}</div>
        <div class="t-pax-wrap"><span class="t-pax">{{ g.jumlah }}</span></div>
        <div class="t-meta">
          <span class="chip" :style="{ background: META[g.status]?.bg, color: META[g.status]?.text }">
            <span class="cdot" :style="{ background: META[g.status]?.color }"></span>
            {{ META[g.status]?.label }}{{ g.undangan && g.undangan !== 'keduanya' ? ` · ${g.undangan}` : '' }}
          </span>
        </div>
        <div class="t-konf">
          <SwitchToggle :model-value="isConf(g)" title="Konfirmasi undangan" @update:model-value="v => toggleKonfirmasi(g, v)" />
          <span class="t-konf-lbl">{{ isConf(g) ? 'Dikonfirmasi' : 'Belum' }}</span>
        </div>
        <div class="t-actions">
          <button class="act item-action-btn" @click="openEdit(g.id)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E151A" stroke-width="2"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
        </div>
      </div>
      </div>
    </div>

    <GuestModal :show="modalShow" :edit-id="editId" @close="modalShow = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { META, ORDER } from '../data/constants'
import SwitchToggle from '../components/SwitchToggle.vue'
import GuestModal from '../components/modals/GuestModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileGuestList from '../mobile layout/MobileGuestList.vue'
import TourBtn from '../components/TourBtn.vue'

const store = useWeddingStore()
const isMobile = useIsMobile()

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'tamu') openAdd()
})

const TAMU_STEPS = computed(() => [
  {
    selector: '#panel-tamu .stat-grid',
    icon: '📊',
    title: 'Ringkasan Tamu',
    desc: 'Empat angka utama di sini: undangan dikonfirmasi, total tamu (orang), dan pembagian antara pihak pria dan wanita.',
  },
  {
    selector: '#panel-tamu .gbreakdown',
    icon: '👥',
    title: 'Breakdown per Pihak',
    desc: 'Rincian per kategori relasi — calon pengantin, teman, tetangga. Angka ini dihitung hanya dari undangan yang sudah dikonfirmasi.',
  },
  {
    selector: '#panel-tamu .controls',
    icon: '🔍',
    title: 'Cari, Filter & Tambah',
    desc: 'Ketik nama untuk mencari, atau filter berdasarkan relasi. Ketuk "Tambah Tamu" untuk mengisi data undangan baru.',
  },
  {
    selector: '.t-row, .mg-card',
    icon: '📋',
    title: isMobile.value ? 'Kartu Tamu' : 'Baris Tamu',
    desc: isMobile.value
      ? 'Setiap kartu adalah satu undangan. Ketuk ikon pensil untuk edit, atau hapus kalau tidak jadi diundang.'
      : 'Setiap baris adalah satu undangan. Klik pensil untuk edit, atau duplikasi kalau ada tamu dengan rombongan besar.',
  },
  {
    selector: '.t-konf, .mg-toggle',
    icon: '✅',
    title: 'Konfirmasi Kehadiran',
    desc: 'Aktifkan saat tamu sudah pasti diundang atau sudah membalas konfirmasi. Statistik jumlah tamu hanya menghitung yang aktif di sini.',
  },
])
const search = ref('')
const filterStatus = ref('all')
const modalShow = ref(false)
const editId = ref(null)
const importRef = ref(null)

const isConf = g => g.konfirmasi !== false

const confirmedList = computed(() => store.guests.filter(isConf))
const totalOrang    = computed(() => confirmedList.value.reduce((s, g) => s + g.jumlah, 0))

const byPax = computed(() => {
  const m = {}
  ORDER.forEach(k => { m[k] = 0 })
  confirmedList.value.forEach(g => { m[g.status] = (m[g.status] || 0) + g.jumlah })
  return m
})
const byCnt = computed(() => {
  const m = {}
  ORDER.forEach(k => { m[k] = 0 })
  confirmedList.value.forEach(g => { m[g.status] = (m[g.status] || 0) + 1 })
  return m
})
const pria   = computed(() => ['cpp','teman_pria','tetangga_pria'].reduce((s, k) => s + (byPax.value[k] || 0), 0))
const wanita = computed(() => ['cpw','teman_wanita','tetangga_wanita'].reduce((s, k) => s + (byPax.value[k] || 0), 0))
const belumKonfirmasi = computed(() => store.guests.length - confirmedList.value.length)

const visRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.guests.filter(g => (filterStatus.value === 'all' || g.status === filterStatus.value) && g.nama.toLowerCase().includes(q))
})

const allVisSelected  = computed(() => visRows.value.length > 0 && visRows.value.every(g => store.isSelected(g.id)))
const someVisSelected = computed(() => visRows.value.some(g => store.isSelected(g.id)))

function toggleAll(e) {
  visRows.value.forEach(g => store.toggleSelected(g.id, e.target.checked))
}

function toggleKonfirmasi(g, val) {
  g.konfirmasi = val
  store.saveG()
}

function openAdd()     { editId.value = null; modalShow.value = true }
function openEdit(id)  { editId.value = id;   modalShow.value = true }

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('tamu', f)
  e.target.value = ''
}
</script>

<style scoped>
.g-cap {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--paper);
  cursor: pointer;
  margin-bottom: 14px;
  font-family: inherit;
  transition: transform .15s, box-shadow .15s;
}
.g-cap:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(36,8,8,.10); }
.g-cap.over  { border-left: 3px solid var(--rose); }
.g-cap.ok    { border-left: 3px solid var(--green); }
.g-cap-ico { flex: none; display: inline-flex; }
.g-cap.over .g-cap-ico { color: var(--rose); }
.g-cap.ok   .g-cap-ico { color: var(--green); }
.g-cap-body { flex: 1; min-width: 0; font-size: 13.5px; color: var(--ink); display: flex; flex-direction: column; gap: 1px; }
.g-cap-body b { color: var(--plum); }
.g-cap.over .g-cap-body b { color: var(--rose); }
.g-cap-sub { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.g-cap-arrow { flex: none; color: var(--muted); }
</style>
