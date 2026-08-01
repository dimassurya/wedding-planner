<template>
  <section class="panel active" id="panel-gifts">
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="26" height="18" viewBox="0 0 26 18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6.5"/><circle cx="17" cy="9" r="6.5"/></svg></div>
        <div class="num">{{ store.gifts.length }}</div><div class="lbl">Total item</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ selesai }}</div><div class="lbl">Sudah diserahkan</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
        <div class="num">{{ fmt(totalNilai) }}</div><div class="lbl">Total nilai</div>
      </div>
    </div>

    <div class="controls" :class="{ sticky: !isMobile }" ref="toolbarRef">
      <div class="chips">
        <button class="fchip" :class="{ on: filter === 'all' }" @click="filter = 'all'">Semua</button>
        <button class="fchip" :class="{ on: filter === 'mahar' }" @click="filter = 'mahar'">💍 Mahar</button>
        <button class="fchip" :class="{ on: filter === 'seserahan' }" @click="filter = 'seserahan'">🎁 Seserahan</button>
      </div>
      <button class="icon-btn solid" @click="addItem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Item
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('gifts')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="GIFT_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileGiftList v-if="isMobile" :rows="filteredRows" v-model:editId="mobileEditId" />

    <!-- Card grid (PC) -->
    <div v-else>
      <div v-if="!filteredRows.length" class="empty">
        <div class="big">Belum ada item</div>
        <div>Klik Tambah Item untuk mulai.</div>
      </div>

      <div v-else class="g-grid">
        <div v-for="g in filteredRows" :key="g.id" class="g-card" :class="{ done: g.status === 'sudah_diserahkan' }" @click="openDetail(g.id)">
          <div class="g-card-top">
            <span class="g-type">{{ g.type === 'seserahan' ? '🎁 Seserahan' : '💍 Mahar' }}</span>
            <span v-if="g.includeInBudget" class="g-linked" title="Masuk Budget">🔗</span>
          </div>
          <div class="g-name">{{ g.item || 'Tanpa nama' }}</div>
          <div class="g-price">Rp {{ grp(g.hargaAktual || g.hargaEstimasi) }}</div>
          <div class="g-status" :class="{ ok: g.status === 'sudah_diserahkan' }">
            <span class="g-dot"></span>{{ GIFT_STATUS_OPTIONS[g.status]?.label || g.status }}
          </div>
        </div>
      </div>
    </div>

    <GiftDetailModal :show="detailOpen" :gift-id="detailId" @close="detailOpen = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, grp } from '../utils/index'
import { GIFT_STATUS_OPTIONS } from '../data/constants'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileGiftList from '../mobile layout/MobileGiftList.vue'
import GiftDetailModal from '../components/modals/GiftDetailModal.vue'
import TourBtn from '../components/TourBtn.vue'
import { useStickyThead } from '../composables/useStickyThead'

const store        = useWeddingStore()
const importRef    = ref(null)
const isMobile     = useIsMobile()
const mobileEditId = ref(null)
const { toolbarRef } = useStickyThead()

const filter    = ref('all')
const detailOpen = ref(false)
const detailId   = ref(null)

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'gifts') addItem()
})

const GIFT_STEPS = computed(() => [
  {
    selector: '#panel-gifts .stat-grid',
    icon: '💍',
    title: 'Ringkasan Mahar & Seserahan',
    desc: 'Total item, berapa yang sudah diserahkan, dan total nilai keseluruhan.',
  },
  {
    selector: '#panel-gifts .chips',
    icon: '🔀',
    title: 'Filter Jenis',
    desc: 'Lihat semua item, atau saring khusus Mahar atau Seserahan saja.',
  },
  {
    selector: '#panel-gifts .controls',
    icon: '➕',
    title: 'Tambah Item',
    desc: 'Tambahkan item satu per satu — cincin, kebaya, mukena, dll. Isi harga, status, dan kalau perlu masukkan ke Budget.',
  },
  {
    selector: isMobile.value ? '.mg-card' : '.g-card',
    icon: '📋',
    title: 'Detail Item',
    desc: 'Ketuk item untuk lihat & ubah detail lengkap — kategori, harga estimasi/aktual, tanggal beli, catatan, dan info toko.',
  },
])

const selesai    = computed(() => store.gifts.filter(g => g.status === 'sudah_diserahkan').length)
const totalNilai = computed(() => store.gifts.reduce((s, g) => s + (g.hargaAktual || g.hargaEstimasi || 0), 0))

const filteredRows = computed(() => filter.value === 'all' ? store.gifts : store.gifts.filter(g => g.type === filter.value))

async function addItem() {
  const type = filter.value === 'seserahan' ? 'seserahan' : 'mahar'
  const row = await store.addGift(type)
  if (!row) return
  if (isMobile.value) { mobileEditId.value = row.id; return }
  openDetail(row.id)
}

function openDetail(id) {
  detailId.value = id
  detailOpen.value = true
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('gifts', f)
  e.target.value = ''
}
</script>

<style scoped>
.g-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.g-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.g-card:hover { border-color: var(--gold); box-shadow: 0 4px 12px rgba(36, 8, 8, .08); }
.g-card.done { border-color: var(--green); }
.g-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.g-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
}
.g-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--plum);
}
.g-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}
.g-status .g-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
  background: transparent;
}
.g-status.ok { color: var(--green); }
.g-status.ok .g-dot { background: var(--green); border-color: var(--green); }
</style>
