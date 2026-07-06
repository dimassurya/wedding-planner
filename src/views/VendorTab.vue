<template>
  <section class="panel active" id="panel-vendor">
    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5H3z"/><path d="M21 9v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9"/><path d="M9 21V12h6v9"/></svg></div>
        <div class="num">{{ store.vendors.length }}</div><div class="lbl">Total vendor</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ dipakaiList.length }}</div><div class="lbl">Vendor dipakai</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="16" cy="12" r="2"/></svg></div>
        <div class="num">{{ fmt(totalBiaya) }}</div><div class="lbl">Total biaya vendor</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg></div>
        <div class="num">{{ store.vendors.length - dipakaiList.length }}</div><div class="lbl">Belum diputuskan</div>
      </div>
    </div>

    <!-- Used vendors list -->
    <div v-if="dipakaiList.length" class="card vd-card">
      <div class="vd-head">✓ Vendor yang Dipakai <span class="vd-count">{{ dipakaiList.length }}</span></div>
      <div class="vd-list">
        <button v-for="v in dipakaiList" :key="v.id" class="vd-item" @click="store.vFilter = v.category">
          <span class="vd-cat">{{ catLabel(v.category) }}</span>
          <span class="vd-name">{{ v.nama }}</span>
          <span class="vd-price">Rp {{ grp(v.harga) }}</span>
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="controls">
      <div id="vChips" class="chips">
        <button v-for="c in VENDOR_CATEGORIES" :key="c.id" class="fchip" :class="{ on: store.vFilter === c.id }" @click="store.vFilter = c.id">{{ c.label }}</button>
      </div>
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Vendor
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('vendor')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="VENDOR_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileVendorList v-if="isMobile" :rows="catRows" @edit="openEdit" />

    <!-- Table (PC) -->
    <div v-else class="card table-card">
      <div class="v-head">
        <div><input type="checkbox" class="cbx" :checked="allVisSel" :indeterminate.prop="someVisSel && !allVisSel" @change="toggleAll"></div>
        <div>Nama</div><div>Alamat</div><div>No HP</div><div class="r">Harga</div><div>Deskripsi</div><div>Dipakai?</div><div></div>
      </div>

      <div v-if="!catRows.length" class="empty">
        <div class="big">Tidak ada vendor</div>
        <div>Belum ada data vendor untuk kategori ini.</div>
      </div>

      <div v-for="v in catRows" :key="v.id" class="v-row" :class="{ sel: store.isSelected(v.id) }" :data-id="v.id">
        <div class="v-cell v-cbx"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(v.id)" @change="e => store.toggleSelected(v.id, e.target.checked)"></div>
        <div class="v-cell v-nama">{{ v.nama }}</div>
        <div class="v-cell v-alamat">{{ v.alamat }}</div>
        <div class="v-cell v-hp">{{ v.hp }}</div>
        <div class="v-cell v-harga cE">
          <div>Rp {{ grp(v.harga) }}</div>
          <div v-if="v.tipeHarga === 'pax'" class="v-pax-info">@ Rp {{ grp(v.hargaPax) }} &times; {{ paxMultText(v) }}</div>
        </div>
        <div class="v-cell v-desc">{{ v.deskripsi }}</div>
        <div class="v-decide">
          <SwitchToggle :model-value="!!v.jadi" title="Aktifkan jika vendor ini dipakai" @update:model-value="val => toggleJadi(v, val)" />
          <span class="v-lbl" :class="{ on: v.jadi }">{{ v.jadi ? 'Dipakai' : 'Belum' }}</span>
        </div>
        <div class="v-actions r">
          <button class="icon-btn" @click="openEdit(v.id)" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
          <button class="icon-btn" @click="delVendor(v)" title="Hapus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <VendorModal :show="modalShow" :edit-id="editId" :default-category="store.vFilter" @close="modalShow = false" />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES } from '../data/constants'
import { fmt, grp } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'
import VendorModal from '../components/modals/VendorModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileVendorList from '../mobile layout/MobileVendorList.vue'
import TourBtn from '../components/TourBtn.vue'

const store     = useWeddingStore()
const modalShow = ref(false)
const editId    = ref(null)
const importRef = ref(null)
const isMobile  = useIsMobile()

const VENDOR_STEPS = computed(() => [
  {
    selector: '#panel-vendor .stat-grid',
    icon: '🤝',
    title: 'Ringkasan Vendor',
    desc: 'Empat angka penting: total vendor yang dicatat, berapa yang sudah dipilih, total biaya semua vendor aktif, dan berapa yang belum diputuskan.',
  },
  {
    selector: '#panel-vendor .vd-card',
    icon: '✅',
    title: 'Vendor yang Dipakai',
    desc: 'Panel ini muncul setelah ada vendor yang diaktifkan. Berisi ringkasan cepat — kategori, nama, dan harga. Ketuk salah satunya untuk langsung filter ke kategori itu.',
  },
  {
    selector: '#panel-vendor #vChips',
    icon: '🏷️',
    title: 'Filter Kategori',
    desc: 'Vendor dikelompokkan per kategori: Katering, Foto & Video, Gedung, dan lainnya. Pilih kategori untuk fokus ke satu jenis sekaligus.',
  },
  {
    selector: '#panel-vendor .controls button.icon-btn.solid',
    icon: '➕',
    title: 'Tambah Vendor',
    desc: 'Isi nama, alamat, nomor HP, deskripsi, dan pilih tipe harga. Ada dua tipe: All In (harga tetap) atau Per Pax (dikalikan jumlah tamu otomatis).',
  },
  {
    selector: isMobile.value ? '.mv-card' : '.v-row',
    icon: '📋',
    title: isMobile.value ? 'Kartu Vendor' : 'Baris Vendor',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama, harga, tipe harga, dan status. Ketuk kartu untuk lihat detail lengkap — alamat, HP, dan deskripsi.'
      : 'Setiap baris berisi nama, alamat, nomor HP, harga, dan deskripsi. Klik ikon pensil untuk edit detail lengkap.',
  },
  {
    selector: isMobile.value ? '.mv-price-row' : '.v-cell.v-harga',
    icon: '💰',
    title: 'Sistem Harga Vendor',
    desc: 'All In berarti harga tetap terlepas dari jumlah tamu. Per Pax dikalikan otomatis dari jumlah tamu terkonfirmasi di tab Tamu — angkanya update sendiri kalau tamu bertambah.',
  },
  {
    selector: isMobile.value ? '.mv-actions' : '.v-decide',
    icon: '🔄',
    title: 'Toggle "Dipakai" → Budget',
    desc: 'Fitur utama tab ini. Aktifkan "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dimatikan, otomatis dihapus dari Budget. Tidak perlu input manual.',
  },
  ...(isMobile.value ? [{
    selector: '.mv-act.wa',
    icon: '📱',
    title: 'Hubungi via WhatsApp',
    desc: 'Tombol WA langsung membuka chat ke nomor vendor yang sudah diisi. Aktif hanya kalau nomor HP terisi. Berguna untuk follow up tanpa perlu keluar dari aplikasi.',
  }] : []),
])

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }

const dipakaiList = computed(() => store.vendors.filter(v => v.jadi))
const totalBiaya  = computed(() => dipakaiList.value.reduce((s, v) => s + (v.harga || 0), 0))
const catRows     = computed(() => store.vendors.filter(v => v.category === store.vFilter))

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

function paxMultText(v) {
  if (v.paxPengali === 'orang') return `${tOrang.value} org`
  if (v.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  return v.paxManualVal
}

const allVisSel  = computed(() => catRows.value.length > 0 && catRows.value.every(v => store.isSelected(v.id)))
const someVisSel = computed(() => catRows.value.some(v => store.isSelected(v.id)))

function toggleAll(e) {
  catRows.value.forEach(v => store.toggleSelected(v.id, e.target.checked))
}

function toggleJadi(v, val) {
  v.jadi = val
  store.handleVendorDecision(v, val)
  store.saveV()
}

function delVendor(v) {
  store.delVendor(v.id)
}

function openAdd()    { editId.value = null; modalShow.value = true }
function openEdit(id) { editId.value = id;   modalShow.value = true }

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('vendor', f)
  e.target.value = ''
}
</script>
