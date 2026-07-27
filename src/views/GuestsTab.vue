<template>
  <section class="panel active" id="panel-tamu">

    <!-- ═══ 1. Hero Dashboard ═══ -->
    <div class="gh-hero">
      <div class="gh-hero-top">
        <span class="gh-hero-title">👥 Ringkasan Tamu</span>
      </div>
      <div class="gh-hero-nums">
        <div class="gh-hero-num-item">
          <div class="gh-hero-num">{{ totalUndangan }}</div>
          <div class="gh-hero-num-lbl">Undangan</div>
        </div>
        <div class="gh-hero-num-sep"></div>
        <div class="gh-hero-num-item">
          <div class="gh-hero-num">{{ totalOrangSemua }}</div>
          <div class="gh-hero-num-lbl">Orang</div>
        </div>
      </div>
      <div class="gh-hero-bar"><span :style="{ width: rsvpPct + '%' }"></span></div>
      <div class="gh-hero-bar-row">
        <span class="gh-hero-pct">{{ rsvpPct }}% RSVP</span>
        <span class="gh-hero-belum">⏳ {{ belumKonfirmasiCount }} belum konfirmasi</span>
      </div>

      <!-- Compact Summary — Interactive Statistic Chip, gantiin 4 Card besar
           Hadir/Tidak/Hampers/Belum yang lama. Sekaligus shortcut filter
           kehadiran buat Data Grid di bawah (klik lagi buat balik ke Semua). -->
      <div class="gh-hero-chips">
        <button type="button" class="gh-hchip" :class="{ on: filterKehadiran === 'all' }" @click="setFilterKehadiran('all')">Semua</button>
        <button v-for="k in KEHADIRAN_ORDER" :key="k" type="button" class="gh-hchip" :class="{ on: filterKehadiran === k }" @click="setFilterKehadiran(k)">
          {{ KEHADIRAN_ICONS[k] }} {{ kehOrangCounts[k] }} {{ KEHADIRAN_STATUS[k].label }}
        </button>
      </div>
    </div>

    <!-- ═══ 2. Statistik Lengkap (Collapsible) ═══
         Bagian dari Dashboard (bukan area kerja) — makanya ditaruh tepat
         di bawah Hero, sebelum Search/Filter/Toolbar/Data Grid. Tertutup
         default, dibuka lewat header-nya sendiri. Isi: Ringkasan Pihak
         Tamu, Yang Perlu Ditindaklanjuti. RSVP Breakdown (Hadir/Tidak
         Hadir/Hampers/Belum) SUDAH DIHAPUS — duplikat sama Progress Bar +
         Compact Summary Chip yang udah ada di Hero Dashboard. -->
    <div ref="detailRef" class="gh-detail">
      <button type="button" class="gh-detail-head" @click="toggleDetail">
        <span>📊 Statistik Lengkap</span>
        <span class="gh-detail-toggle">{{ detailOpen ? '▲ Tutup' : '▼ Lihat Detail' }}</span>
      </button>

      <transition name="gh-detail-exp">
        <div v-if="detailOpen" class="gh-detail-body">
          <div class="gh-detail-section">
            <div class="gh-detail-lbl">Ringkasan Pihak Tamu</div>
            <div class="gh-pihak-grid">
              <!-- Compact Insight Panel — bukan card statistik gede, tujuannya
                   biar calon pengantin langsung paham kondisi tiap pihak
                   (orang/undangan, progress RSVP, komposisi relasi, tamu
                   berkebutuhan khusus, follow-up) dalam beberapa detik. -->
              <div class="gh-pihak-panel side-pria">
                <div class="gh-pp-head">
                  <span class="gh-pp-ico">👨</span>
                  <span class="gh-pp-title">Pihak Pria</span>
                  <span class="gh-pp-meta">{{ priaInsight.totalOrang }} Orang · {{ priaInsight.totalUndangan }} Undangan</span>
                </div>

                <div class="gh-pp-row">
                  <span class="gh-pp-pct">{{ priaInsight.pct }}% RSVP</span>
                  <span class="gh-pp-sub">{{ priaInsight.doneCount }}/{{ priaInsight.totalUndangan }} undangan terkonfirmasi</span>
                </div>

                <div class="gh-pp-relasi">
                  <span v-for="r in priaInsight.relasi" :key="r.key" class="gh-pp-rel-item">{{ r.icon }} {{ r.label }} <b>{{ r.count }}</b></span>
                </div>

                <div v-if="priaInsight.categories.length" class="gh-pp-attn">
                  <span v-for="c in priaInsight.top" :key="c.id" class="gh-pp-attn-tag">{{ c.icon }} {{ c.count }} {{ c.label }}</span>
                  <span v-if="priaInsight.extra > 0" class="gh-pp-attn-tag muted">+{{ priaInsight.extra }} lainnya</span>
                </div>

                <div class="gh-pp-followup" :class="{ done: priaInsight.belumCount === 0 }">
                  {{ priaInsight.belumCount > 0 ? `⏳ ${priaInsight.belumCount} RSVP belum dikonfirmasi` : '✅ Semua RSVP selesai' }}
                </div>

                <button type="button" class="gh-pp-cta" @click="onPihakFilter('pria')">Lihat Tamu →</button>
              </div>

              <div class="gh-pihak-panel side-wanita">
                <div class="gh-pp-head">
                  <span class="gh-pp-ico">👩</span>
                  <span class="gh-pp-title">Pihak Wanita</span>
                  <span class="gh-pp-meta">{{ wanitaInsight.totalOrang }} Orang · {{ wanitaInsight.totalUndangan }} Undangan</span>
                </div>

                <div class="gh-pp-row">
                  <span class="gh-pp-pct">{{ wanitaInsight.pct }}% RSVP</span>
                  <span class="gh-pp-sub">{{ wanitaInsight.doneCount }}/{{ wanitaInsight.totalUndangan }} undangan terkonfirmasi</span>
                </div>

                <div class="gh-pp-relasi">
                  <span v-for="r in wanitaInsight.relasi" :key="r.key" class="gh-pp-rel-item">{{ r.icon }} {{ r.label }} <b>{{ r.count }}</b></span>
                </div>

                <div v-if="wanitaInsight.categories.length" class="gh-pp-attn">
                  <span v-for="c in wanitaInsight.top" :key="c.id" class="gh-pp-attn-tag">{{ c.icon }} {{ c.count }} {{ c.label }}</span>
                  <span v-if="wanitaInsight.extra > 0" class="gh-pp-attn-tag muted">+{{ wanitaInsight.extra }} lainnya</span>
                </div>

                <div class="gh-pp-followup" :class="{ done: wanitaInsight.belumCount === 0 }">
                  {{ wanitaInsight.belumCount > 0 ? `⏳ ${wanitaInsight.belumCount} RSVP belum dikonfirmasi` : '✅ Semua RSVP selesai' }}
                </div>

                <button type="button" class="gh-pp-cta" @click="onPihakFilter('wanita')">Lihat Tamu →</button>
              </div>
            </div>
            <div v-if="byPax.lainnya" class="gh-pihak-lain">
              <span class="gh-pihak-dot" :style="{ background: META.lainnya.color }"></span>
              Lainnya (tanpa pihak) — <b>{{ byPax.lainnya }} orang</b> · {{ byCnt.lainnya }} undangan
            </div>
            <p v-if="notCounted > 0" class="g-confirm-info">
              Statistik dihitung dari {{ store.confirmedGuests.length }} undangan · {{ notCounted }} tidak dihitung (tidak hadir/kirim hampers)
            </p>
            <p v-else class="g-confirm-info">Semua {{ store.confirmedGuests.length }} undangan dihitung di statistik</p>
          </div>

          <div class="gh-detail-section">
            <div class="gh-detail-lbl">📋 Yang Perlu Ditindaklanjuti</div>
            <div class="gh-status-row">
              <div class="gh-status-chip">⏳ Belum Konfirmasi <b>{{ belumKonfirmasiCount }}</b></div>
              <div class="gh-status-chip muted">📨 Belum Dihubungi <b>—</b></div>
              <div class="gh-status-chip muted">📞 Perlu Follow Up <b>—</b></div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- ═══ 3. Insight Card — SATU card, isinya dinamis mengikuti kondisi
         data (bukan kumpulan statistik). Tujuannya kasih tahu apa yang
         perlu dilakukan, bukan sekadar angka. ═══ -->
    <div class="gh-insight">
      <div class="gh-insight-head">✨ Insight Hari Ini</div>

      <div class="gh-insight-row" :class="{ clickable: belumKonfirmasiCount > 0 }" @click="belumKonfirmasiCount > 0 && setFilterKehadiran('belum')">
        <span class="gh-insight-ico">{{ belumKonfirmasiCount > 0 ? '⏳' : '🎉' }}</span>
        <span v-if="belumKonfirmasiCount > 0"><b>{{ belumKonfirmasiCount }} undangan</b> belum memberikan konfirmasi.</span>
        <span v-else>Seluruh tamu telah memberikan konfirmasi.</span>
      </div>

      <div v-if="store.capacityOver !== null" class="gh-insight-row clickable" @click="store.activeTab = 'vendor'">
        <span class="gh-insight-ico">{{ store.capacityOver > 0 ? '⚠️' : '✅' }}</span>
        <span v-if="store.capacityOver > 0"><b>Kelebihan {{ store.capacityOver }} orang</b> dari kapasitas venue ({{ store.totalGuestPax }}/{{ store.venueCapacity }}).</span>
        <span v-else>Masih muat, <b>sisa {{ -store.capacityOver }} kursi</b> dari kapasitas venue.</span>
      </div>

      <!-- Special Attention — satu ringkasan gabungan, BUKAN satu baris per
           kategori (VIP/Lansia/Kursi Roda/dst digabung jadi satu kalimat +
           tag ringkas). Cuma nongol kalau ada tamu berkebutuhan khusus. -->
      <div v-if="specialAttention.total > 0" class="gh-insight-row clickable" @click="onAttentionDetail">
        <span class="gh-insight-ico">⚠️</span>
        <div class="gh-insight-content">
          <span>{{ specialAttention.summary }}</span>
          <div v-if="specialAttention.categories.length > 1" class="gh-insight-tags">
            <span v-for="c in specialAttention.top" :key="c.id" class="gh-insight-tag">{{ c.icon }} {{ c.label }} ({{ c.count }})</span>
            <span v-if="specialAttention.extra > 0" class="gh-insight-tag muted">+{{ specialAttention.extra }} kategori lainnya</span>
          </div>
        </div>
      </div>

      <!-- Micro Insight ("Hari Ini") — butuh timestamp per-tamu (kapan
           ditambahkan/RSVP berubah) buat tracking beneran, yang belum ada
           di data model sekarang. Placeholder netral dulu, business logic
           nyata (RSVP baru/tamu baru hari ini) nyusul di tahap berikutnya. -->
      <div class="gh-insight-row">
        <span class="gh-insight-ico">🎉</span>
        <span>Tidak ada perubahan hari ini.</span>
      </div>
    </div>

    <!-- ═══ Mobile Device only: Search + Filter Relasi, sticky, tepat di
         bawah header (.m-header, MobileHeader.vue). SENGAJA ditaruh sebagai
         anak langsung #panel-tamu (BUKAN di dalam .controls) — supaya
         containing block-nya mencakup seluruh daftar tamu di bawahnya.
         Kalau dibungkus di dalam .controls yang tingginya cuma sebatas
         toolbar, sticky-nya cuma nempel sebentar terus ke-scroll lepas
         (containing block-nya kependekan). Tambah Tamu & menu ⋮ TETAP di
         dalam .controls seperti biasa (baris terpisah, normal flow, TIDAK
         ikut sticky) — lihat v-if="!isMobile" di bawah yang nyembunyiin
         search+filter dari .controls di mobile biar nggak dobel. ═══ -->
    <div v-if="isMobile" class="gh-mobile-filters" :style="{ top: mobileFilterTop + 'px' }">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9C7575" stroke-width="2"/><path d="M21 21l-4-4" stroke="#9C7575" stroke-width="2" stroke-linecap="round"/></svg>
        <input v-model="search" type="text" placeholder="Cari nama tamu...">
      </div>
      <select class="filter" v-model="filterRelasi">
        <option value="all">Semua Relasi</option>
        <optgroup label="Pihak">
          <option value="pria">👨 Pihak Pria</option>
          <option value="wanita">👩 Pihak Wanita</option>
        </optgroup>
        <optgroup label="Relasi">
          <option v-for="k in ORDER" :key="k" :value="k">{{ META[k].label }}</option>
        </optgroup>
      </select>
    </div>

    <!-- ═══ 4. Toolbar ═══ -->
    <div class="controls g-toolbar sticky" ref="toolbarRef">
      <template v-if="!isMobile">
        <div class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9C7575" stroke-width="2"/><path d="M21 21l-4-4" stroke="#9C7575" stroke-width="2" stroke-linecap="round"/></svg>
          <input v-model="search" type="text" placeholder="Cari nama tamu...">
        </div>
        <select class="filter" v-model="filterRelasi">
          <option value="all">Semua Relasi</option>
          <optgroup label="Pihak">
            <option value="pria">👨 Pihak Pria</option>
            <option value="wanita">👩 Pihak Wanita</option>
          </optgroup>
          <optgroup label="Relasi">
            <option v-for="k in ORDER" :key="k" :value="k">{{ META[k].label }}</option>
          </optgroup>
        </select>
      </template>
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Tamu
      </button>
      <div class="gh-overflow-wrap" ref="overflowWrapRef">
        <button type="button" class="icon-btn gh-overflow-btn" aria-label="Menu lainnya" @click="overflowOpen = !overflowOpen">⋮</button>
        <div v-if="overflowOpen" class="gh-overflow-menu">
          <button type="button" @click="overflowOpen = false; store.exportGuestsCSV()">📊 Ekspor CSV</button>
          <button type="button" @click="overflowOpen = false; store.exportTab('tamu')">📤 Export Data</button>
          <button type="button" @click="overflowOpen = false; importRef?.click()">📥 Import Data</button>
          <button type="button" @click="overflowOpen = false; store.startTour(TAMU_STEPS)">🧭 Panduan</button>
        </div>
      </div>
      <input ref="importRef" type="file" accept=".json,application/json" hidden @change="onImport">
    </div>

    <!-- Daftar tamu: kartu untuk mobile (tidak diubah) -->
    <MobileGuestList v-if="isMobile" :rows="visRows" @edit="openEdit" />

    <!-- ═══ 5. Data Grid (PC) ═══ -->
    <div v-else class="card gh-table-card">
      <div class="gh-table-inner">
      <div class="gh-thead" :style="{ top: headTop + 'px' }">
        <div class="gh-cbx"><input type="checkbox" class="cbx" :checked="allVisSelected" :indeterminate.prop="someVisSelected && !allVisSelected" @change="toggleAll"></div>
        <div class="gh-h-center">No</div><div>Nama Tamu</div><div class="gh-h-center">Jumlah</div><div>Relasi</div><div>Informasi Penting</div><div>Kehadiran</div><div class="gh-actions"></div>
      </div>

      <div v-if="!visRows.length" class="empty">
        <div class="big">Belum ada tamu</div>
        <div>{{ search || filterRelasi !== 'all' || filterKehadiran !== 'all' ? 'Tidak ada yang cocok.' : 'Klik Tambah Tamu untuk mulai.' }}</div>
      </div>

      <div v-for="(g, i) in visRows" :key="g.id" class="gh-trow" :class="{ sel: store.isSelected(g.id), unconfirmed: (g.kehadiran || 'belum') === 'tidak' }" :data-id="g.id">
        <div class="gh-cbx"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(g.id)" @change="e => store.toggleSelected(g.id, e.target.checked)"></div>
        <div class="gh-no">{{ i + 1 }}</div>
        <div class="gh-name">{{ g.nama }}</div>
        <div class="gh-pax-wrap"><span class="gh-pax">{{ g.jumlah }}</span></div>
        <div class="gh-meta">
          <span class="gh-relasi-badge" :style="{ background: META[g.relasi]?.bg, color: META[g.relasi]?.text }">
            {{ META[g.relasi]?.short }}{{ g.undangan && g.undangan !== 'keduanya' ? ` · ${g.undangan}` : '' }}
          </span>
        </div>
        <div class="gh-info-cell">
          <template v-if="infoPentingIcons(g).length">
            <span v-for="ic in infoPentingIcons(g).slice(0, 3)" :key="ic" class="gh-info-badge">{{ ic }}</span>
            <span v-if="infoPentingIcons(g).length > 3" class="gh-info-more">+{{ infoPentingIcons(g).length - 3 }}</span>
          </template>
        </div>
        <div class="gh-konf">
          <select
            class="gh-keh-sel"
            :class="'ks-' + (g.kehadiran || 'belum')"
            :value="g.kehadiran || 'belum'"
            @change="e => setKehadiran(g, e.target.value)"
          >
            <option v-for="k in KEHADIRAN_ORDER" :key="k" :value="k">{{ KEHADIRAN_ICONS[k] }} {{ KEHADIRAN_STATUS[k].label }}</option>
          </select>
        </div>
        <div class="gh-actions">
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { META, ORDER, KEHADIRAN_STATUS, KEHADIRAN_ORDER, INFORMASI_PENTING_OPTIONS } from '../data/constants'
import GuestModal from '../components/modals/GuestModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileGuestList from '../mobile layout/MobileGuestList.vue'
import { useStickyThead } from '../composables/useStickyThead'

const store = useWeddingStore()
const isMobile = useIsMobile()

// Toolbar (filter+kontrol) sticky di bawah navbar, header tabel nempel
// tepat di bawahnya — dihitung otomatis dari tinggi toolbar sebenarnya
// (sama seperti Vendor/Seserahan/Mahar, lewat composable bersama).
const { toolbarRef, headTop } = useStickyThead()

// Mobile Device — offset `top` buat .gh-mobile-filters (sticky) dihitung
// DINAMIS dari tinggi asli header mobile (.m-header, MobileHeader.vue —
// komponen sibling di App.vue, bukan turunan GuestsTab, makanya diukur
// lewat DOM query, bukan prop/composable), BUKAN nilai hardcode. Kalau
// nanti ada elemen sticky lain yang nempel di atas .gh-mobile-filters
// (mis. progress bar), tinggal tambahin selector-nya ke array ini —
// tingginya otomatis ikut kejumlah, dan ResizeObserver bikin nilainya
// tetap akurat walau tinggi header berubah (teks wrap, dst).
const MOBILE_STICKY_TOP_SELECTORS = ['.m-header']
const mobileFilterTop = ref(0)
let _mobileTopRO = null
function measureMobileFilterTop() {
  let offset = 0
  MOBILE_STICKY_TOP_SELECTORS.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) offset += el.getBoundingClientRect().height
  })
  mobileFilterTop.value = offset
}
onMounted(() => {
  measureMobileFilterTop()
  _mobileTopRO = new ResizeObserver(measureMobileFilterTop)
  MOBILE_STICKY_TOP_SELECTORS.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) _mobileTopRO.observe(el)
  })
})
onBeforeUnmount(() => { _mobileTopRO?.disconnect() })

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'tamu') openAdd()
})

const KEHADIRAN_ICONS = { belum: '🟡', hadir: '🟢', tidak: '🔴', hampers: '🎁' }

const TAMU_STEPS = computed(() => [
  {
    selector: '#panel-tamu .gh-hero',
    icon: '👥',
    title: 'Ringkasan Tamu',
    desc: 'Total undangan & orang, progress RSVP, dan chip Hadir/Tidak Hadir/Hampers/Belum Konfirmasi — ketuk salah satu chip buat langsung filter daftar tamu di bawah.',
  },
  {
    selector: '#panel-tamu .gh-detail-head',
    icon: '📊',
    title: 'Statistik Lengkap',
    desc: 'Ringkasan Pihak Pria/Wanita dan Yang Perlu Ditindaklanjuti tersimpan di sini — ketuk buat buka, biar halaman utama tetap ringkas.',
  },
  {
    selector: '#panel-tamu .gh-insight',
    icon: '✨',
    title: 'Insight Hari Ini',
    desc: 'Kartu ini kasih tahu apa yang perlu ditindaklanjuti — RSVP yang belum masuk, kapasitas venue, dan tamu berkebutuhan khusus. Cuma tampil kalau memang relevan.',
  },
  {
    selector: '#panel-tamu .controls',
    icon: '🔍',
    title: 'Cari, Filter & Tambah',
    desc: 'Ketik nama untuk mencari, atau filter berdasarkan pihak/relasi. Ketuk "Tambah Tamu" untuk mengisi data undangan baru. Menu ⋮ berisi Ekspor CSV, Export/Import data, dan Panduan.',
  },
  {
    selector: isMobile.value ? '.mg-card' : '.gh-trow',
    icon: '📋',
    title: isMobile.value ? 'Kartu Tamu' : 'Baris Tamu',
    desc: isMobile.value
      ? 'Setiap kartu adalah satu undangan. Ketuk ikon pensil untuk edit, atau hapus kalau tidak jadi diundang.'
      : 'Setiap baris adalah satu undangan. Klik pensil untuk edit, atau duplikasi kalau ada tamu dengan rombongan besar.',
  },
  {
    selector: isMobile.value ? '.mg-keh-sel' : '.gh-konf',
    icon: '🟢',
    title: 'Kehadiran Tamu',
    desc: 'Belum Konfirmasi & Hadir dihitung di statistik; Tidak Hadir & Kirim Hampers dikeluarkan dari hitungan kursi/katering.',
  },
])
const search = ref('')
const filterRelasi = ref('all')
const filterKehadiran = ref('all')
const modalShow = ref(false)
const editId = ref(null)
const importRef = ref(null)

// ── Hero ──
const totalUndangan   = computed(() => store.guests.length)
const totalOrangSemua = computed(() => store.guests.reduce((s, g) => s + g.jumlah, 0))
const belumKonfirmasiList  = computed(() => store.guests.filter(g => (g.kehadiran || 'belum') === 'belum'))
const belumKonfirmasiCount = computed(() => belumKonfirmasiList.value.length)
const belumKonfirmasiOrang = computed(() => belumKonfirmasiList.value.reduce((s, g) => s + g.jumlah, 0))
const rsvpDoneOrang = computed(() => totalOrangSemua.value - belumKonfirmasiOrang.value)
const rsvpPct = computed(() => totalOrangSemua.value ? Math.round(rsvpDoneOrang.value / totalOrangSemua.value * 100) : 0)

// ── Compact Summary chips (Hero) — dari store.guests langsung, sama pola
// kayak hitungan lama. Klik chip yang lagi aktif balik ke "Semua". ──
const hadirOrang   = computed(() => store.guests.filter(g => (g.kehadiran || 'belum') === 'hadir').reduce((s, g) => s + g.jumlah, 0))
const tidakOrang   = computed(() => store.guests.filter(g => (g.kehadiran || 'belum') === 'tidak').reduce((s, g) => s + g.jumlah, 0))
const hampersOrang = computed(() => store.guests.filter(g => (g.kehadiran || 'belum') === 'hampers').reduce((s, g) => s + g.jumlah, 0))
const kehOrangCounts = computed(() => ({ hadir: hadirOrang.value, tidak: tidakOrang.value, hampers: hampersOrang.value, belum: belumKonfirmasiOrang.value }))
function setFilterKehadiran(key) {
  filterKehadiran.value = filterKehadiran.value === key ? 'all' : key
}

// ── Informasi Penting — g.informasiPenting belum kesimpen ke DB (lihat
// memory/catatan di GuestModal.vue & constants.js), jadi ini akan selalu 0
// sekarang. Ditulis begini biar begitu kolomnya beneran kesimpen di tahap
// berikutnya, hitungan & Insight Card di bawah otomatis kepakai tanpa
// refactor. ──
const informasiPentingCounts = computed(() => {
  const m = {}
  INFORMASI_PENTING_OPTIONS.forEach(opt => { m[opt.id] = 0 })
  store.guests.forEach(g => {
    (g.informasiPenting?.flags || []).forEach(id => { if (id in m) m[id]++ })
  })
  return m
})
// Total = jumlah tamu unik dengan minimal 1 kebutuhan khusus (bukan jumlah
// kategori dijumlah — satu tamu bisa punya lebih dari satu flag).
const informasiPentingTotal = computed(() => store.guests.filter(g => (g.informasiPenting?.flags || []).length > 0).length)

// ── Special Attention — satu ringkasan gabungan di dalam Insight Card,
// BUKAN satu baris/card per kategori (lihat catatan desain di memory).
// Cuma nongol kalau ada tamu dengan kebutuhan khusus. ──
const specialAttention = computed(() => {
  const categories = INFORMASI_PENTING_OPTIONS
    .map(opt => ({ ...opt, count: informasiPentingCounts.value[opt.id] || 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const total = informasiPentingTotal.value
  const top = categories.slice(0, 3)
  const extra = categories.length - top.length
  const summary = categories.length === 1
    ? `${categories[0].count} tamu ${categories[0].phrase}.`
    : `${total} tamu memiliki kebutuhan khusus.`
  return { total, categories, top, extra, summary }
})
function onAttentionDetail() {
  store.toast('Detail kebutuhan khusus segera hadir')
}

// ── byPax/byCnt: TIDAK diubah dari versi lama (dasar buat "Ringkasan Pihak
// Tamu" di bawah & buat "Lainnya (tanpa pihak)"). ──
const byPax = computed(() => {
  const m = {}
  ORDER.forEach(k => { m[k] = 0 })
  store.confirmedGuests.forEach(g => { m[g.relasi] = (m[g.relasi] || 0) + g.jumlah })
  return m
})
const byCnt = computed(() => {
  const m = {}
  ORDER.forEach(k => { m[k] = 0 })
  store.confirmedGuests.forEach(g => { m[g.relasi] = (m[g.relasi] || 0) + 1 })
  return m
})
const notCounted = computed(() => store.guests.length - store.confirmedGuests.length)

// ── Ringkasan Pihak Tamu (Compact Insight Panel) — dibangun dari
// byPax/byCnt yang SAMA PERSIS (nggak ada perhitungan baru buat Total
// Orang/Undangan/Distribusi Relasi, cuma disusun ulang tampilannya).
// Progress RSVP & Follow Up itu turunan baru dari pool yang sama
// (confirmedGuests per pihak), pakai definisi "belum" yang sama kayak
// belumKonfirmasiList di atas. Kebutuhan Khusus baca dari SEMUA tamu
// pihak itu (bukan cuma confirmedGuests), sama kayak informasiPentingCounts
// global — cuma di-scope per pihak. ──
const GROUP_ICONS = { Keluarga: '👨‍👩‍👧', Teman: '👫', Tetangga: '🏘️' }
function buildPihakInsight(sideKeys) {
  const pihakGuests = store.confirmedGuests.filter(g => sideKeys.includes(g.relasi))
  const totalOrang = pihakGuests.reduce((s, g) => s + g.jumlah, 0)
  const totalUndangan = pihakGuests.length
  const belumCount = pihakGuests.filter(g => (g.kehadiran || 'belum') === 'belum').length
  const belumOrang = pihakGuests.filter(g => (g.kehadiran || 'belum') === 'belum').reduce((s, g) => s + g.jumlah, 0)
  const pct = totalOrang ? Math.round((totalOrang - belumOrang) / totalOrang * 100) : 0
  const relasi = sideKeys.map(k => ({ key: k, icon: GROUP_ICONS[META[k].group] || '📌', label: META[k].group, count: byPax.value[k] || 0 }))

  const sideGuests = store.guests.filter(g => sideKeys.includes(g.relasi))
  const categories = INFORMASI_PENTING_OPTIONS
    .map(opt => ({ ...opt, count: sideGuests.filter(g => (g.informasiPenting?.flags || []).includes(opt.id)).length }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const top = categories.slice(0, 3)
  const extra = categories.length - top.length

  return { totalOrang, totalUndangan, doneCount: totalUndangan - belumCount, belumCount, pct, relasi, categories, top, extra }
}
const priaInsight   = computed(() => buildPihakInsight(['cpp', 'teman_pria', 'tetangga_pria']))
const wanitaInsight = computed(() => buildPihakInsight(['cpw', 'teman_wanita', 'tetangga_wanita']))
// Klik "Lihat Tamu" di panel Ringkasan Pihak Tamu → set filterRelasi ke
// 'pria'/'wanita' (dikenali visRows lewat META[k].side, lihat di bawah),
// reset filter lain biar hasilnya benar-benar cuma pihak itu, terus scroll
// ke Toolbar/Data Grid (di layar mobile posisinya sama, tinggal geser ke
// MobileGuestList) biar user langsung lihat hasilnya tanpa cari-cari.
function onPihakFilter(side) {
  filterRelasi.value = side
  filterKehadiran.value = 'all'
  search.value = ''
  nextTick(() => toolbarRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

const visRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.guests.filter(g => {
    const relasiMatch = filterRelasi.value === 'all'
      ? true
      : (filterRelasi.value === 'pria' || filterRelasi.value === 'wanita')
        ? META[g.relasi]?.side === filterRelasi.value
        : g.relasi === filterRelasi.value
    return relasiMatch &&
      (filterKehadiran.value === 'all' || (g.kehadiran || 'belum') === filterKehadiran.value) &&
      g.nama.toLowerCase().includes(q)
  })
})

const allVisSelected  = computed(() => visRows.value.length > 0 && visRows.value.every(g => store.isSelected(g.id)))
const someVisSelected = computed(() => visRows.value.some(g => store.isSelected(g.id)))

function toggleAll(e) {
  visRows.value.forEach(g => store.toggleSelected(g.id, e.target.checked))
}

function setKehadiran(g, val) {
  g.kehadiran = val
  store.saveG()
}

// Badge Informasi Penting di Data Grid — g.informasiPenting belum pernah
// ada di data asli (lihat memory guest-form-informasi-penting), jadi ini
// akan selalu kosong sekarang. Ditulis begini biar begitu kolomnya beneran
// kesimpen di tahap berikutnya, badge ini otomatis kepakai tanpa refactor.
function infoPentingIcons(g) {
  const flags = g.informasiPenting?.flags || []
  return flags.map(id => INFORMASI_PENTING_OPTIONS.find(o => o.id === id)?.icon).filter(Boolean)
}

function openAdd()     { editId.value = null; modalShow.value = true }
function openEdit(id)  { editId.value = id;   modalShow.value = true }

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('tamu', f)
  e.target.value = ''
}

// Statistik Lengkap (collapsible) — tertutup default, dibuka lewat header-nya
// sendiri (tepat di bawah Hero). scrollIntoView tetap dipasang buat jaga-jaga
// kalau user udah scroll jauh ke bawah pas toggle.
const detailOpen = ref(false)
const detailRef = ref(null)
function toggleDetail() {
  detailOpen.value = !detailOpen.value
  if (detailOpen.value) nextTick(() => detailRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// Overflow menu (⋮) toolbar — klik luar / Esc buat nutup.
const overflowOpen = ref(false)
const overflowWrapRef = ref(null)
function onDocClick(e) {
  if (overflowOpen.value && !overflowWrapRef.value?.contains(e.target)) overflowOpen.value = false
}
function onDocKeydown(e) {
  if (e.key === 'Escape' && overflowOpen.value) overflowOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKeydown)
})
</script>

<style scoped>
/* ── 1. Hero Dashboard ── */
.gh-hero {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 26px 28px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
}
.gh-hero-title { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: var(--cacao); }
.gh-hero-nums { display: flex; align-items: baseline; gap: 20px; margin-top: 14px; }
.gh-hero-num-item { display: flex; flex-direction: column; }
.gh-hero-num { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 700; color: var(--plum); line-height: 1; font-variant-numeric: tabular-nums; }
.gh-hero-num-lbl { font-size: 12.5px; color: var(--muted); margin-top: 4px; }
.gh-hero-num-sep { width: 1px; align-self: stretch; background: var(--line); }

.gh-hero-bar { position: relative; height: 12px; background: var(--gold-soft); border-radius: 100px; overflow: hidden; margin-top: 18px; }
.gh-hero-bar > span { display: block; height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--plum), var(--wine)); transition: width .5s ease; }
.gh-hero-bar-row { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; }
.gh-hero-pct { font-weight: 700; color: var(--plum); }
.gh-hero-belum { color: var(--muted); }

/* Compact Summary — Interactive Statistic Chip (bukan Card), shortcut
   filter kehadiran langsung dari Hero. */
.gh-hero-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.gh-hchip {
  display: inline-flex; align-items: center; gap: 5px;
  min-height: 36px; padding: 0 15px;
  font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--ink);
  background: var(--ivory); border: 1.5px solid var(--line); border-radius: 100px;
  cursor: pointer; transition: background .15s, border-color .15s, color .15s, transform .1s;
}
.gh-hchip:hover { border-color: var(--gold); background: var(--gold-soft); transform: translateY(-1px); }
.gh-hchip.on { background: var(--plum); border-color: var(--plum); color: #fff; }

/* ── 3. Insight Card — satu card, dinamis per kondisi data ── */
.gh-insight {
  background: var(--paper); border: 1px solid var(--line); border-radius: 18px;
  padding: 18px 20px; margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
}
.gh-insight-head {
  font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700;
  color: var(--cacao); margin-bottom: 8px;
}
.gh-insight-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 0; font-size: 13.5px; color: var(--ink); line-height: 1.45;
}
.gh-insight-row + .gh-insight-row { border-top: 1px dashed var(--line); }
.gh-insight-row b { color: var(--plum); }
.gh-insight-row.clickable { cursor: pointer; border-radius: 10px; margin: 0 -8px; padding: 9px 8px; transition: background .15s; }
.gh-insight-row.clickable:hover { background: var(--gold-soft); }
.gh-insight-ico { flex: none; font-size: 16px; line-height: 1.3; }
.gh-insight-content { flex: 1; min-width: 0; }
.gh-insight-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.gh-insight-tag {
  display: inline-block; font-size: 11.5px; font-weight: 600; color: #7a5c28;
  background: var(--gold-soft); border-radius: 100px; padding: 3px 10px;
}
.gh-insight-tag.muted { background: transparent; color: var(--muted); padding-left: 0; }

/* ── Statistik Lengkap: isi .gh-detail (Ringkasan Pihak Tamu & lainnya) ── */
.gh-status-row { display: flex; flex-wrap: wrap; gap: 10px; }
.gh-status-chip {
  display: flex; align-items: center; gap: 8px;
  background: var(--paper); border: 1px solid var(--line); border-radius: 100px;
  padding: 9px 15px; font-size: 13px; color: var(--ink);
}
.gh-status-chip b { color: var(--plum); font-family: 'Cormorant Garamond', serif; font-size: 15px; }
.gh-status-chip.muted { color: var(--muted); }
.gh-status-chip.muted b { color: var(--muted); }

/* ── Ringkasan Pihak Tamu — Compact Insight Panel (isi .gh-detail).
   Bukan card statistik besar: header ringkas + baris-baris info dipisah
   divider tipis, information density tinggi, tinggi panel diminimalkan. ── */
.gh-pihak-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
@media (max-width: 650px) { .gh-pihak-grid { grid-template-columns: 1fr; } }
.gh-pihak-panel {
  background: var(--paper); border: 1px solid var(--line); border-left: 3px solid var(--line);
  border-radius: 12px; padding: 12px 14px;
}
.gh-pihak-panel.side-pria   { border-left-color: var(--teal); }
.gh-pihak-panel.side-wanita { border-left-color: var(--rose); }

.gh-pp-head { display: flex; align-items: baseline; gap: 6px; }
.gh-pp-ico { font-size: 14px; }
.gh-pp-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.gh-pp-meta { margin-left: auto; font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }

.gh-pp-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
  padding: 7px 0; border-top: 1px dashed var(--line); margin-top: 7px;
}
.gh-pp-pct { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; color: var(--plum); }
.gh-pp-sub { font-size: 11px; color: var(--muted); }

.gh-pp-relasi {
  display: flex; flex-wrap: wrap; gap: 4px 12px;
  padding: 7px 0; border-top: 1px dashed var(--line);
  font-size: 11.5px; color: var(--ink);
}
.gh-pp-relasi b { font-variant-numeric: tabular-nums; color: var(--plum); }

.gh-pp-attn { display: flex; flex-wrap: wrap; gap: 5px; padding: 7px 0; border-top: 1px dashed var(--line); }
.gh-pp-attn-tag {
  font-size: 11px; font-weight: 600; color: #7a5c28;
  background: var(--gold-soft); border-radius: 100px; padding: 2px 9px;
}
.gh-pp-attn-tag.muted { background: transparent; color: var(--muted); padding-left: 0; }

.gh-pp-followup { padding: 7px 0; border-top: 1px dashed var(--line); font-size: 11.5px; font-weight: 600; color: #7a5c28; }
.gh-pp-followup.done { color: var(--green); }

.gh-pp-cta {
  display: block; width: 100%; margin-top: 5px; padding-top: 7px;
  border: none; border-top: 1px dashed var(--line); background: none; text-align: right;
  font-family: 'Jost', sans-serif; font-size: 11.5px; font-weight: 600; color: var(--plum);
  cursor: pointer;
}
.gh-pp-cta:hover { color: var(--wine); }

.gh-pihak-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; }
.gh-pihak-lain { font-size: 12.5px; color: var(--muted); margin-bottom: 10px; }

.g-confirm-info { font-size: 12px; color: var(--muted); margin-bottom: 16px; }

/* ── 4. Toolbar ── */
.g-toolbar.sticky {
  position: sticky;
  top: 72px;
  z-index: 6;
  background: var(--ivory);
  padding-top: 22px;
  padding-bottom: 12px;
  margin-left: -30px;
  margin-right: -30px;
  padding-left: 30px;
  padding-right: 30px;
}
/* Mobile Device — Toolbar (isinya sekarang cuma Tambah Tamu/Overflow, lihat
   v-if="!isMobile" di template buat Search/Filter) ikut normal flow
   halaman, TIDAK sticky. Reset JUGA margin/padding bleed (-30px/30px) yang
   didesain khusus buat lebar Desktop — kalau dibiarin aktif di Mobile,
   .controls jadi overflow ~10px di tiap sisi (bleed 30px lebih besar dari
   padding .panels yg cuma 20px di lebar ini), bikin horizontal scroll yang
   ganggu Bottom Navigation. Pakai breakpoint mobile yang sudah ada di
   project (MOBILE_BREAKPOINT, lihat useIsMobile.js). Desktop & Tablet
   (>680px) tidak berubah sama sekali. */
@media (max-width: 680px) {
  .g-toolbar.sticky {
    position: static;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
  }
}

/* Mobile Device — Search + Filter Relasi (`.gh-mobile-filters` di template,
   v-if="isMobile") jadi SATU sticky container, DITARUH DI LUAR .controls
   sebagai anak langsung #panel-tamu — bukan cuma soal desain, tapi supaya
   containing block sticky-nya cukup tinggi (mencakup seluruh daftar tamu),
   sesuai penjelasan di komentar template. `top` SENGAJA tidak di-hardcode
   di sini — nilainya dari `mobileFilterTop` (diukur dinamis dari tinggi
   asli .m-header, lihat script setup), dipasang lewat inline :style biar
   selalu akurat walau tinggi header berubah. Desktop TIDAK RENDER elemen
   ini sama sekali (v-if="isMobile"), jadi CSS di bawah efeknya nol di
   Desktop — media query dipasang tetap sebagai jaga-jaga sesuai
   breakpoint project. */
@media (max-width: 680px) {
  .gh-mobile-filters {
    display: flex;
    flex-wrap: wrap; /* sama kayak .controls (dipakai tab lain, mis. Budget)
                        — kalau .search + .filter nggak muat sebaris, .filter
                        turun ke baris berikutnya, BUKAN overflow ke luar layar */
    gap: 10px;
    align-items: center;
    position: sticky;
    /* top: lihat inline :style di template (mobileFilterTop) */
    z-index: 20; /* di atas card daftar tamu, di bawah .m-header (100) & dropdown menu ⋮ (40) */
    background: var(--ivory); /* solid, sama dengan warna background halaman — card di baliknya nggak keliatan tembus */
    padding: 14px 0 10px;
  }
}

.gh-overflow-wrap { position: relative; flex: none; }
.gh-overflow-btn { font-size: 18px; line-height: 1; }
.gh-overflow-menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 40;
  min-width: 180px;
  background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 12px 28px rgba(36,8,8,.16);
  padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.gh-overflow-menu button {
  text-align: left; padding: 10px 12px; border: none; background: none; border-radius: 9px;
  font-family: 'Jost', sans-serif; font-size: 13.5px; color: var(--cacao); cursor: pointer;
}
.gh-overflow-menu button:hover { background: var(--gold-soft); }

/* ── 5. Data Grid ──
   Prioritas lebar: Nama (flex, paling gede) > Kehadiran (fixed, tapi lebih
   kecil dari Nama) > Informasi Penting (fixed, kompak, cuma icon) > Relasi
   (ngikutin isi teksnya sendiri lewat badge, kolomnya dibikin pas-pasan)
   > Jumlah (paling kecil, cuma angka) > Aksi (icon button doang). Semua
   baris (.gh-trow) & header (.gh-thead) WAJIB pakai grid-template-columns
   yang SAMA PERSIS biar kolomnya tetap rapi sejajar antar baris. */
.gh-table-card { overflow: clip; }
.gh-table-inner { min-width: 0; }
.gh-thead, .gh-trow {
  display: grid;
  grid-template-columns: 26px 28px minmax(0,1fr) 54px 118px 92px 148px 40px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  min-width: 0;
}
.gh-thead {
  background: var(--plum); color: #fff;
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  position: sticky; z-index: 5;
  padding: 11px 16px;
}
/* Mobile Device — header Data Grid TIDAK sticky, ikut scroll biasa.
   Data Grid PC di GuestsTab.vue sendiri sudah cuma render di atas
   breakpoint ini (MOBILE_BREAKPOINT, lihat useIsMobile.js); media query
   ini jaga-jaga di lebar yang sama biar konsisten kalau ada kondisi
   dimana .gh-thead ini kepakai di layar sempit. Desktop (>680px) tidak
   disentuh sama sekali. */
@media (max-width: 680px) {
  .gh-thead { position: static; }
}
.gh-trow { min-height: 44px; }
.gh-trow + .gh-trow { border-top: 1px solid var(--line); }
.gh-trow.sel { background: rgba(129,1,0,.04); }
.gh-trow.unconfirmed { opacity: .7; }
.gh-h-center { text-align: center; }
.gh-cbx { display: flex; }
.gh-no { text-align: center; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.gh-name { font-size: 14px; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Relasi — badge ringkas (short label, bukan label penuh), lebar ngikutin isi */
.gh-meta { min-width: 0; overflow: hidden; }
.gh-relasi-badge {
  display: inline-block; max-width: 100%;
  padding: 4px 10px; border-radius: 100px;
  font-size: 12px; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Informasi Penting — icon doang; kalau kosong, cell dibiarkan kosong
   (tanpa placeholder "-" atau tanda apapun, sesuai prinsip Empty State). */
.gh-info-cell { display: flex; align-items: center; gap: 3px; font-size: 14px; }
.gh-info-badge { line-height: 1; }
.gh-info-more { font-size: 11px; font-weight: 600; color: var(--muted); margin-left: 1px; }

.gh-pax-wrap { text-align: center; }
.gh-pax { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 700; color: var(--plum); }
.gh-actions { display: flex; justify-content: flex-end; }

.gh-keh-sel {
  font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 600;
  border: 1px solid var(--line); border-radius: 100px; padding: 5px 10px;
  cursor: pointer; background: var(--paper);
}
.gh-keh-sel.ks-belum   { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.gh-keh-sel.ks-hadir   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.gh-keh-sel.ks-tidak   { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }
.gh-keh-sel.ks-hampers { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }

/* ── 2. Statistik Lengkap (Collapsible) — bagian dari Dashboard, tepat di
   bawah Hero. Accordion/expandable panel, bukan modal. ── */
.gh-detail { margin-bottom: 16px; }
.gh-detail-head {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border: 1px solid var(--line); border-radius: 14px;
  background: var(--paper); cursor: pointer;
  font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: var(--cacao);
  transition: border-color .15s, background .15s;
}
.gh-detail-head:hover { border-color: var(--gold); background: var(--gold-soft); }
.gh-detail-toggle { font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--plum); }

.gh-detail-body { padding: 18px 4px 4px; }
.gh-detail-section { margin-bottom: 20px; }
.gh-detail-section:last-child { margin-bottom: 0; }
.gh-detail-lbl {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); margin-bottom: 10px;
}

.gh-detail-exp-enter-active, .gh-detail-exp-leave-active {
  transition: opacity .22s ease, max-height .22s ease;
  overflow: hidden;
}
.gh-detail-exp-enter-from, .gh-detail-exp-leave-to { opacity: 0; max-height: 0; }
.gh-detail-exp-enter-to, .gh-detail-exp-leave-from { opacity: 1; max-height: 2000px; }
</style>
