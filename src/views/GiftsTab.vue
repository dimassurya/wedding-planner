<template>
  <section class="panel active" id="panel-gifts">
    <!-- Hero — satu-satunya card besar, fokus ke progress persiapan -->
    <div class="gh-hero">
      <div class="gh-hero-title">💍 Mahar &amp; Seserahan</div>

      <div class="gh-hero-progress">
        <div class="gh-hero-bar"><div class="gh-hero-bar-fill" :style="{ width: prepPct + '%' }"></div></div>
        <div class="gh-hero-pct-row">
          <span class="gh-hero-pct">{{ prepPct }}%</span>
          <span class="gh-hero-pct-lbl">persiapan selesai</span>
        </div>
      </div>

      <div class="gh-hero-stats">
        <div class="gh-hero-stat">
          <div class="gh-hero-stat-val">{{ sudahDibeli }}</div>
          <div class="gh-hero-stat-lbl">Sudah Dibeli</div>
        </div>
        <div class="gh-hero-stat">
          <div class="gh-hero-stat-val">{{ belumDibeli }}</div>
          <div class="gh-hero-stat-lbl">Belum Dibeli</div>
        </div>
        <div class="gh-hero-stat">
          <div class="gh-hero-stat-val">{{ selesai }}</div>
          <div class="gh-hero-stat-lbl">Sudah Diserahkan</div>
        </div>
      </div>

      <div class="gh-hero-insight" :class="'tone-' + insight.tone">
        <span>{{ insight.icon }}</span>{{ insight.text }}
      </div>
    </div>

    <!-- Mini card — info pendukung, sengaja kecil & sekunder dari Hero -->
    <div class="gh-mini-grid">
      <div class="gh-mini">
        <span class="gh-mini-ico">💰</span>
        <div><div class="gh-mini-val">{{ fmt(totalNilai) }}</div><div class="gh-mini-lbl">Total Nilai</div></div>
      </div>
      <div class="gh-mini">
        <span class="gh-mini-ico">🛍</span>
        <div><div class="gh-mini-val">{{ sudahDibeli }}</div><div class="gh-mini-lbl">Sudah Dibeli</div></div>
      </div>
      <div class="gh-mini">
        <span class="gh-mini-ico">🎁</span>
        <div><div class="gh-mini-val">{{ selesai }}</div><div class="gh-mini-lbl">Sudah Diserahkan</div></div>
      </div>
    </div>

    <div class="controls" :class="{ sticky: !isMobile }" ref="toolbarRef">
      <div class="chips">
        <button class="fchip" :class="{ on: typeFilter === 'all' }" @click="typeFilter = 'all'">Semua</button>
        <button class="fchip" :class="{ on: typeFilter === 'mahar' }" @click="typeFilter = 'mahar'">💍 Mahar</button>
        <button class="fchip" :class="{ on: typeFilter === 'seserahan' }" @click="typeFilter = 'seserahan'">🎁 Seserahan</button>
      </div>
      <select class="filter" v-model="statusFilter">
        <option value="all">Semua Status</option>
        <option v-for="s in ALL_STATUS_KEYS" :key="s" :value="s">{{ GIFT_STATUS_OPTIONS[s].label }}</option>
      </select>
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
    <div v-else class="g-area">
      <div v-if="!filteredRows.length" class="empty">
        <div class="big">Belum ada item</div>
        <div>Klik Tambah Item untuk mulai.</div>
      </div>

      <div v-else class="g-grid">
        <div v-for="g in filteredRows" :key="g.id" class="g-card" :class="{ done: g.status === 'sudah_diserahkan' }" @click="openDetail(g.id)">
          <div class="g-top">
            <span class="g-badge" :class="g.type">{{ g.type === 'seserahan' ? '🎁 Seserahan' : '💍 Mahar' }}</span>
            <span class="g-chip" :class="statusClass(g.status)">{{ GIFT_STATUS_OPTIONS[g.status]?.label }}</span>
            <div class="g-menu-wrap" @click.stop>
              <button class="g-menu-btn" @click="toggleMenu(g.id)" title="Menu">⋯</button>
              <div v-if="openMenuId === g.id" class="pop-menu g-menu-pop">
                <button class="pop-item" @click="openDetail(g.id); openMenuId = null">Lihat Detail</button>
                <button class="pop-item" @click="toggleBudget(g)">{{ g.includeInBudget ? 'Keluarkan dari Budget' : 'Masukkan ke Budget' }}</button>
                <div class="pop-sep"></div>
                <button class="pop-item danger" @click="removeItem(g)">Hapus</button>
              </div>
            </div>
          </div>

          <div class="g-name">{{ g.item || 'Tanpa nama' }}</div>

          <div class="g-stages">
            <span v-for="(st, i) in stagesFor(g)" :key="st" class="g-stage" :class="{ done: giftStageIndex(g) > i }">
              {{ giftStageIndex(g) > i ? '✓' : '○' }} {{ STAGE_SHORT[st] }}
            </span>
          </div>

          <div class="g-meta">
            <span class="g-price">Rp {{ grp(g.hargaAktual || g.hargaEstimasi) }}</span>
            <span v-if="g.tanggalPembelian" class="g-meta-item">{{ fmtDate(g.tanggalPembelian) }}</span>
            <span v-if="g.namaToko" class="g-meta-item">{{ g.namaToko }}</span>
            <span v-if="g.includeInBudget" class="g-linked" title="Masuk Budget">🔗</span>
          </div>
        </div>
      </div>

      <div v-if="openMenuId" class="g-menu-backdrop" @click="openMenuId = null"></div>
    </div>

    <GiftDetailModal :show="detailOpen" :gift-id="detailId" @close="detailOpen = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, grp, fmtDate } from '../utils/index'
import { GIFT_STATUS_OPTIONS, GIFT_STATUS_BY_TYPE } from '../data/constants'
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

const typeFilter   = ref('all')
const statusFilter = ref('all')
const detailOpen   = ref(false)
const detailId     = ref(null)
const openMenuId   = ref(null)

const ALL_STATUS_KEYS = Object.keys(GIFT_STATUS_OPTIONS)
const STAGE_SHORT = { sudah_dibeli: 'Dibeli', sudah_dikemas: 'Dikemas', sudah_diserahkan: 'Diserahkan' }

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'gifts') addItem()
})

const GIFT_STEPS = computed(() => [
  {
    selector: '#panel-gifts .gh-hero',
    icon: '💍',
    title: 'Ringkasan Persiapan',
    desc: 'Progress persiapan keseluruhan, ringkasan sudah/belum dibeli & diserahkan, plus insight otomatis di bagian bawah.',
  },
  {
    selector: '#panel-gifts .chips',
    icon: '🔀',
    title: 'Filter',
    desc: 'Saring per jenis (Mahar/Seserahan) lewat chip, atau per status lewat dropdown di sebelahnya.',
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
    title: 'Kartu Item',
    desc: 'Ketuk item untuk lihat & ubah detail lengkap. Titik tiga di kartu buka aksi cepat: lihat detail, masukkan ke Budget, atau hapus.',
  },
])

// ── Stage progress (dipakai buat ringkasan & mini-progress kartu) ──
// belum_dibeli dianggap "belum mulai", stage sesudahnya berjenjang beda
// jumlah per type (mahar 2 tahap, seserahan 3 tahap) — lihat GIFT_STATUS_BY_TYPE.
function giftStages(type) { return GIFT_STATUS_BY_TYPE[type] || GIFT_STATUS_BY_TYPE.mahar }
function giftStageIndex(g) {
  const idx = giftStages(g.type).indexOf(g.status)
  return idx < 0 ? 0 : idx
}
function stagesFor(g) { return giftStages(g.type).slice(1) }
function statusClass(status) {
  if (status === 'sudah_diserahkan') return 'st-done'
  if (status === 'belum_dibeli') return 'st-todo'
  return 'st-progress'
}

const belumDibeli = computed(() => store.gifts.filter(g => g.status === 'belum_dibeli').length)
const sudahDibeli = computed(() => store.gifts.length - belumDibeli.value)
const selesai     = computed(() => store.gifts.filter(g => g.status === 'sudah_diserahkan').length)
const totalNilai  = computed(() => store.gifts.reduce((s, g) => s + (g.hargaAktual || g.hargaEstimasi || 0), 0))

const prepPct = computed(() => {
  if (!store.gifts.length) return 0
  const sum = store.gifts.reduce((s, g) => {
    const stages = giftStages(g.type)
    return s + giftStageIndex(g) / (stages.length - 1)
  }, 0)
  return Math.round(sum / store.gifts.length * 100)
})

// Insight dinamis — baca kondisi Mahar & Seserahan terpisah biar bisa kasih
// kalimat spesifik ("Mahar sudah siap, tinggal Seserahan") bukan cuma angka.
const insight = computed(() => {
  const total = store.gifts.length
  if (!total) return { icon: '💍', tone: 'info', text: 'Belum ada item Mahar & Seserahan yang dicatat.' }

  const maharItems     = store.gifts.filter(g => g.type === 'mahar')
  const seserahanItems = store.gifts.filter(g => g.type === 'seserahan')
  const allDelivered   = list => list.length > 0 && list.every(g => g.status === 'sudah_diserahkan')
  const maharDone      = allDelivered(maharItems)
  const seserahanDone  = allDelivered(seserahanItems)

  if (selesai.value === total) return { icon: '🎉', tone: 'good', text: 'Selamat! Semua persiapan telah selesai.' }
  if (maharDone && seserahanItems.length) return { icon: '✨', tone: 'good', text: 'Seluruh Mahar telah siap, tinggal menyelesaikan Seserahan.' }
  if (seserahanDone && maharItems.length) return { icon: '✨', tone: 'good', text: 'Seluruh Seserahan telah siap, tinggal menyelesaikan Mahar.' }
  if (belumDibeli.value === 0) return { icon: '📦', tone: 'info', text: 'Semua item sudah dibeli, tinggal menyelesaikan penyerahan.' }
  return { icon: '⏳', tone: 'info', text: `Masih ada ${belumDibeli.value} item yang perlu dipersiapkan.` }
})

const filteredRows = computed(() => store.gifts.filter(g =>
  (typeFilter.value === 'all' || g.type === typeFilter.value) &&
  (statusFilter.value === 'all' || g.status === statusFilter.value)
))

async function addItem() {
  const type = typeFilter.value === 'seserahan' ? 'seserahan' : 'mahar'
  const row = await store.addGift(type)
  if (!row) return
  if (isMobile.value) { mobileEditId.value = row.id; return }
  openDetail(row.id)
}

function openDetail(id) {
  detailId.value = id
  detailOpen.value = true
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function toggleBudget(g) {
  g.includeInBudget = !g.includeInBudget
  store.saveGifts()
  openMenuId.value = null
}

function removeItem(g) {
  openMenuId.value = null
  store.delGift(g.id)
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('gifts', f)
  e.target.value = ''
}
</script>

<style scoped>
/* ── Hero — satu-satunya card besar, fokus ke progress persiapan ── */
.gh-hero {
  position: relative;
  background: linear-gradient(135deg, var(--paper) 55%, var(--gold-soft) 160%);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 24px 24px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05), 0 14px 34px rgba(36, 8, 8, .07);
}
.gh-hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 18px;
}
.gh-hero-progress { margin-bottom: 18px; }
.gh-hero-bar { height: 9px; background: var(--ivory); border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
.gh-hero-bar-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--wine)); border-radius: 100px; transition: width .5s cubic-bezier(.22,1,.36,1); }
.gh-hero-pct-row { display: flex; align-items: baseline; gap: 7px; }
.gh-hero-pct { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 700; color: var(--ink); }
.gh-hero-pct-lbl { font-size: 12.5px; color: var(--muted); }

.gh-hero-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  margin-bottom: 16px;
}
.gh-hero-stat { flex: 1; min-width: 96px; }
.gh-hero-stat-val { font-family: 'Jost', sans-serif; font-size: 19px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
.gh-hero-stat-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; }

.gh-hero-insight {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  padding: 11px 14px;
  border-radius: 12px;
}
.gh-hero-insight.tone-info { background: var(--gold-soft); color: #6b4f1f; }
.gh-hero-insight.tone-good { background: #EAF3DE; color: #2b5010; }

/* ── Mini card — info pendukung, sengaja kecil & sekunder dari Hero ── */
.gh-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.gh-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
}
.gh-mini-ico { flex: none; font-size: 19px; }
.gh-mini-val { font-family: 'Jost', sans-serif; font-size: 15.5px; font-weight: 700; color: var(--ink); line-height: 1.15; font-variant-numeric: tabular-nums; }
.gh-mini-lbl { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; margin-top: 2px; }

@media (max-width: 650px) {
  .gh-mini-grid { grid-template-columns: 1fr 1fr; }
  .gh-hero-stats { gap: 14px; }
}

/* ── Card grid ── */
.g-area { position: relative; }
.g-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px;
}
.g-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 13px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.g-card:hover { border-color: var(--gold); box-shadow: 0 3px 10px rgba(36, 8, 8, .07); }
.g-card.done { border-color: var(--green); }

.g-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.g-badge {
  flex: none;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 100px;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
}
.g-chip {
  flex: none;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2.5px 8px;
  border-radius: 100px;
}
.g-chip.st-todo     { color: var(--muted); background: var(--ivory); }
.g-chip.st-progress { color: #7a5c28; background: var(--gold-soft); }
.g-chip.st-done      { color: #2b5010; background: #EAF3DE; }

.g-menu-wrap { position: relative; margin-left: auto; }
.g-menu-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity .12s, background .12s, color .12s;
}
.g-card:hover .g-menu-btn, .g-menu-btn:focus { opacity: 1; }
.g-menu-btn:hover { background: var(--gold-soft); color: var(--plum); }
.g-menu-pop { top: calc(100% + 4px); right: 0; min-width: 190px; }
.g-menu-backdrop { position: fixed; inset: 0; z-index: 150; }

.g-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
}

.g-stages {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
}
.g-stage.done { color: var(--green); font-weight: 600; }

.g-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding-top: 4px;
  border-top: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--muted);
}
.g-price {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--plum);
  margin-right: 2px;
}
.g-meta-item::before { content: '·'; margin-right: 8px; color: var(--line); }
.g-linked { margin-left: auto; font-size: 12px; }
</style>
