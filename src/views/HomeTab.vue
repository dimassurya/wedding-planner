<template>
  <section class="panel active" id="panel-home">
    <!-- Hero -->
    <div class="hm-hero">
      <div class="hm-hero-left">
        <div class="hm-hero-eyebrow">Hari Bahagia</div>
        <div v-if="coupleNames" class="hm-hero-couple">{{ coupleNames }}</div>
        <div class="hm-hero-date">{{ weddingDateLong }}</div>
        <div class="hm-hero-sub">{{ heroTime }}{{ heroSub }}</div>
      </div>
      <div class="hm-hero-count">
        <div class="hm-hero-num">{{ Math.abs(days) }}</div>
        <div class="hm-hero-unit">{{ days > 0 ? 'hari lagi' : days === 0 ? 'hari ini' : 'hari lalu' }}</div>
      </div>
      <TourBtn :steps="HOME_STEPS" class="hm-tour-corner" />
    </div>

    <!-- Partner Section -->
    <div class="hm-partner-banner" @click="showPartnerCard = true">
      <div class="hm-partner-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div class="hm-partner-text">
        <div class="hm-partner-title">
          {{ store.isPartner ? 'Dashboard Bersama' : store.partnerEmail ? 'Pasangan Aktif' : 'Kolaborasi Pasangan' }}
        </div>
        <div class="hm-partner-desc">
          {{
            store.isPartner
              ? `Diundang oleh ${store.ownerEmail || 'pemilik'}`
              : store.partnerEmail
                ? `Terhubung dengan ${store.partnerEmail}`
                : 'Rencanakan pernikahan bersama pasanganmu'
          }}
        </div>
      </div>
      <div class="hm-partner-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>

    <!-- ══ 2. Perlu Perhatian — hal mendesak yang butuh tindakan ══ -->
    <div class="hm-sec-head">Perlu Perhatian</div>
    <div class="hm-alerts">
      <button
        v-for="a in alerts" :key="a.id"
        class="hm-alert" :class="'hm-alert-' + a.severity"
        @click="a.action?.()"
      >
        <span class="hm-alert-ico">{{ a.icon }}</span>
        <span class="hm-alert-body">
          <span class="hm-alert-title">{{ a.title }}</span>
          <span class="hm-alert-desc">{{ a.desc }}</span>
        </span>
        <span class="hm-alert-cta">
          {{ a.cta }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </button>
      <div v-if="!alerts.length" class="hm-alert-empty">
        <span>✨</span> Aman! Tidak ada yang mendesak — persiapan masih di jalurnya.
      </div>
    </div>

    <!-- ══ 3. Aktivitas Hari Ini ══ -->
    <div class="card hm-section hm-sec-today">
      <div class="hm-chart-title">Aktivitas Hari Ini</div>
      <div v-if="!todayItems.length" class="hm-empty">Tidak ada jadwal khusus hari ini. Nikmati harimu ☕</div>
      <div v-else class="hm-deadlines">
        <button v-for="it in todayItems" :key="it.key" class="hm-dl hm-clickable" @click="goTab(it.tab)">
          <div class="hm-dl-date">Hari ini</div>
          <div class="hm-dl-main">
            <span class="hm-dl-src" :style="{ color: it.color, background: it.color + '1a' }">{{ it.src }}</span>
            {{ it.label }}
          </div>
          <div class="hm-dl-left">
            <span v-if="it.amount" class="hm-dl-days">{{ fmt(it.amount) }}</span>
            <span v-else class="hm-dl-soon">hari ini</span>
          </div>
          <span class="hm-dl-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
        </button>
      </div>
    </div>

    <!-- ══ 4. Deadline Terdekat (yang akan datang — yang telat ada di Perlu Perhatian) ══ -->
    <div class="card hm-section hm-sec-deadline">
      <div class="hm-chart-title">Deadline Terdekat</div>
      <div v-if="!upcoming.length" class="hm-empty">Belum ada deadline ke depan. Isi jatuh tempo di Budget atau deadline tugas di Checklist.</div>
      <div v-else class="hm-deadlines">
        <button v-for="it in upcoming" :key="it.key" class="hm-dl hm-clickable" @click="goTab(it.tab)">
          <div class="hm-dl-date">{{ fmtDate(it.date) }}</div>
          <div class="hm-dl-main">
            <span class="hm-dl-src" :style="{ color: it.color, background: it.color + '1a' }">{{ it.src }}</span>
            {{ it.label }}
          </div>
          <div class="hm-dl-left">
            <span v-if="daysLeft(it.date) <= 7" class="hm-dl-soon">{{ daysLeft(it.date) === 1 ? 'besok' : daysLeft(it.date) + ' hari lagi' }}</span>
            <span v-else class="hm-dl-days">{{ daysLeft(it.date) }} hari lagi</span>
          </div>
          <span class="hm-dl-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
        </button>
      </div>
    </div>

    <!-- ══ 5. Progress Persiapan ══ -->
    <div class="card hm-section hm-sec-progress">
      <div class="hm-chart-title">Progress Persiapan<span class="hm-sec-side">{{ prepDone }}/{{ prepTotal }} · {{ prepPct }}%</span></div>
      <div class="hm-track hm-overall"><span :style="{ width: prepPct + '%', background: 'linear-gradient(90deg,#E5C99A,#CD9F65)' }"></span></div>
      <div class="hm-bars">
        <button v-for="bar in progressBars" :key="bar.label" class="hm-bar hm-clickable" @click="goTab(bar.tab)">
          <div class="hm-bar-top"><span>{{ bar.label }}</span><span class="hm-bar-val">{{ bar.done }}/{{ bar.total }} · {{ bar.pct }}%</span></div>
          <div class="hm-track"><span :style="{ width: bar.pct + '%', background: bar.color }"></span></div>
          <span class="hm-bar-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
        </button>
      </div>
    </div>

    <!-- ══ 6 & 7. Budget + Wedding Fund ══ -->
    <div class="hm-grid2">
      <button class="card hm-section hm-sum hm-clickable" @click="goTab('budget')">
        <div class="hm-chart-title">💰 Budget<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-big">{{ fmt(tAkt) }}</div>
        <div class="hm-big-lbl">total biaya pernikahan</div>
        <div class="hm-track hm-sum-track"><span :style="{ width: pctPaid + '%', background: '#CD9F65' }"></span></div>
        <div class="hm-kv"><span>Sudah dibayar</span><b>{{ fmt(tDib) }} · {{ pctPaid }}%</b></div>
        <div class="hm-kv"><span>Sisa tagihan</span><b>{{ fmt(tSis) }}</b></div>
        <div v-if="store.budgetEstimasiSetCount > 0" class="hm-note-line" :class="store.budgetSelisihTotal >= 0 ? 'good' : 'bad'">
          {{ store.budgetSelisihTotal >= 0 ? 'Hemat ' + fmt(store.budgetSelisihTotal) + ' dari rencana 👍' : 'Lebih ' + fmt(-store.budgetSelisihTotal) + ' dari rencana' }}
        </div>
      </button>

      <button class="card hm-section hm-sum hm-clickable" @click="goTab('keuangan')">
        <div class="hm-chart-title">🏦 Wedding Fund<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-big">{{ fmt(store.fundSaldo) }}</div>
        <div class="hm-big-lbl">saldo tabungan nikah</div>
        <div class="hm-track hm-sum-track"><span :style="{ width: fundPct + '%', background: '#3B6D11' }"></span></div>
        <div class="hm-kv"><span>Target dana</span><b>{{ store.targetBudget ? fmt(store.targetBudget) : 'Belum diisi' }}</b></div>
        <div v-if="kurangTarget > 0" class="hm-kv"><span>Masih kurang</span><b>{{ fmt(kurangTarget) }}</b></div>
        <div v-else-if="store.targetBudget > 0" class="hm-note-line good">Target dana tercapai 🎉</div>
      </button>
    </div>

    <!-- ══ 8 & 9. Tamu + Vendor ══ -->
    <div class="hm-grid2">
      <button class="card hm-section hm-sum hm-clickable" @click="goTab('tamu')">
        <div class="hm-chart-title">👥 Tamu<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-big">{{ totalOrang.toLocaleString('id-ID') }} <span class="hm-big-unit">orang</span></div>
        <div class="hm-big-lbl">dari {{ confirmedList.length }} undangan yang diperhitungkan</div>
        <div class="hm-chips">
          <span class="hm-chip ok">🟢 Hadir {{ store.hadirOrangCount }}</span>
          <span class="hm-chip">🟡 Belum {{ kehBelum }}</span>
          <span v-if="kehTidak" class="hm-chip">🔴 Tidak {{ kehTidak }}</span>
          <span v-if="store.hampersCount" class="hm-chip">🎁 Hampers {{ store.hampersCount }}</span>
        </div>
      </button>

      <button class="card hm-section hm-sum hm-clickable" @click="goTab('vendor')">
        <div class="hm-chart-title">🤝 Vendor<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-big">{{ catCovered }}<span class="hm-big-unit">/ {{ VENDOR_CATEGORIES.length }} kategori</span></div>
        <div class="hm-big-lbl">kebutuhan vendor sudah terpenuhi</div>
        <div class="hm-kv"><span>Vendor dipakai</span><b>{{ vJadi }}</b></div>
        <div class="hm-kv"><span>Kandidat menunggu</span><b>{{ store.vendors.length - vJadi }}</b></div>
      </button>
    </div>

    <!-- ══ 10. Insight / Rekomendasi ══ -->
    <div class="card hm-section hm-sec-insight">
      <div class="hm-chart-title">💡 Insight &amp; Rekomendasi</div>
      <div class="hm-ins-list">
        <button
          v-for="i in homeInsights" :key="i.id"
          class="hm-ins" :class="{ 'hm-ins-static': !i.action }"
          @click="i.action?.()"
        >
          <span class="hm-ins-ico">{{ i.icon }}</span>
          <span class="hm-ins-text">{{ i.text }}</span>
          <span v-if="i.cta" class="hm-ins-cta">{{ i.cta }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </button>
      </div>
    </div>

    <!-- Partner Card Modal -->
    <AddPartnerCard v-if="showPartnerCard" @close="showPartnerCard = false" />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate } from '../utils/index'
import { WEDDING_DATE, TIMELINE_CATEGORIES, VENDOR_CATEGORIES } from '../data/constants'
import { useReminderNotifications } from '../composables/useReminderNotifications'
import { useTimelineFeed } from '../composables/useTimelineFeed'
import TourBtn from '../components/TourBtn.vue'
import AddPartnerCard from '../components/AddPartnerCard.vue'

const store = useWeddingStore()
const showPartnerCard = ref(false)

const { supported: notifSupported, permission: notifPermission, requestPermission } = useReminderNotifications()
const { items: timelineItems } = useTimelineFeed()

async function enableReminders() {
  if (!notifSupported.value) { store.toast('Browser ini tidak mendukung notifikasi'); return }
  if (notifPermission.value === 'denied') {
    store.toast('Notifikasi diblokir. Izinkan lewat pengaturan situs di browser.')
    return
  }
  const result = await requestPermission()
  if (result === 'granted') {
    store.saveReminderSettings({ enabled: true })
    store.toast('Pengingat deadline diaktifkan')
  } else if (result === 'denied') {
    store.toast('Izin notifikasi ditolak')
  }
}

const HOME_STEPS = computed(() => [
  {
    selector: '#panel-home .hm-hero',
    icon: '📅',
    title: 'Hitung Mundur',
    desc: 'Sisa hari menuju hari pernikahan ada di sebelah kanan. Nama pasangan, tanggal, dan jam acara bisa diubah lewat Profil & Informasi (klik foto profil).',
  },
  {
    selector: '#panel-home .hm-partner-banner',
    icon: '💑',
    title: 'Kolaborasi Pasangan',
    desc: 'Undang pasanganmu untuk mengedit data bersama secara real-time. Klik banner ini untuk mengirim undangan atau kelola akses pasangan.',
  },
  {
    selector: '#panel-home .hm-alerts',
    icon: '🚨',
    title: 'Perlu Perhatian',
    desc: 'Hal paling mendesak ditaruh paling atas: pembayaran telat, deadline minggu ini, atau anggaran yang melebihi rencana. Klik untuk langsung menanganinya.',
  },
  {
    selector: '#panel-home .hm-sec-today',
    icon: '📌',
    title: 'Aktivitas Hari Ini',
    desc: 'Semua yang jatuh tepat hari ini — tugas, pembayaran, jadwal vendor. Kalau kosong, berarti hari ini bisa santai.',
  },
  {
    selector: '#panel-home .hm-sec-deadline',
    icon: '⏰',
    title: 'Deadline Terdekat',
    desc: '5 hal terdekat yang akan datang, dari semua tab. Sumber datanya sama persis dengan tab Timeline.',
  },
  {
    selector: '#panel-home .hm-sec-progress',
    icon: '📈',
    title: 'Progress Persiapan',
    desc: 'Progres keseluruhan plus rincian per area — langsung kelihatan bagian mana yang masih tertinggal.',
  },
  {
    selector: '#panel-home .hm-grid2',
    icon: '📊',
    title: 'Ringkasan Angka',
    desc: 'Kondisi Budget, tabungan Wedding Fund, tamu, dan vendor dalam kartu ringkas. Klik kartu untuk membuka tab lengkapnya.',
  },
  {
    selector: '#panel-home .hm-sec-insight',
    icon: '💡',
    title: 'Insight & Rekomendasi',
    desc: 'Saran kecil yang bisa langsung dikerjakan — misalnya berapa yang perlu ditabung per bulan agar target dana tercapai.',
  },
])

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const eventDate = computed(() => store.couple?.tanggal || WEDDING_DATE)

const coupleNames = computed(() => {
  const c = store.couple || {}
  if (c.pria && c.wanita) return `${c.pria} & ${c.wanita}`
  return c.pria || c.wanita || ''
})

const heroTime = computed(() => {
  const c = store.couple || {}
  if (!c.jamMulai) return ''
  return c.jamSelesai ? `${c.jamMulai}–${c.jamSelesai} WIB · ` : `${c.jamMulai} WIB · `
})

const days = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  const w = new Date(eventDate.value + 'T00:00:00')
  return Math.round((w - today) / 86400000)
})

const weddingDateLong = computed(() => {
  const [y, m, d] = eventDate.value.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`
})

const heroSub = computed(() =>
  days.value > 0 ? 'Tetap semangat persiapannya 💛'
  : days.value === 0 ? 'Hari ini harinya! 🎉'
  : 'Selamat menempuh hidup baru 🎊'
)

const confirmedList = computed(() => store.confirmedGuests)
const totalOrang    = computed(() => confirmedList.value.reduce((s, g) => s + g.jumlah, 0))

// Rincian kehadiran (satuan orang) — lebih berguna buat aksi ("siapa yang
// perlu di-follow-up") dibanding komposisi pria/wanita yang dulu di donut.
const kehBelum = computed(() => store.guests.filter(g => (g.kehadiran || 'belum') === 'belum').reduce((s, g) => s + (g.jumlah || 0), 0))
const kehTidak = computed(() => store.guests.filter(g => g.kehadiran === 'tidak').reduce((s, g) => s + (g.jumlah || 0), 0))

const tAkt    = computed(() => store.budget.reduce((s, b) => s + (b.aktual || 0), 0))
const tDib    = computed(() => store.budget.reduce((s, b) => s + (b.dibayar || 0), 0))
const tSis    = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))
const pctPaid = computed(() => tAkt.value ? Math.round(tDib.value / tAkt.value * 100) : 0)

// Wedding Fund vs Target Dana Pernikahan — angka yang sama dengan tab Keuangan.
const fundPct      = computed(() => store.targetBudget > 0 ? Math.min(100, Math.round(store.fundSaldo / store.targetBudget * 100)) : 0)
const kurangTarget = computed(() => Math.max((store.targetBudget || 0) - store.fundSaldo, 0))

// Kategori vendor yang sudah terpenuhi — dipakai langsung ATAU ke-cover
// paket vendor lain (Included Vendor), sama seperti hitungan tab Vendor.
const catCovered = computed(() =>
  VENDOR_CATEGORIES.filter(c =>
    store.vendors.some(v => v.jadi && v.category === c.id) || store.categoryIncludedBy(c.id)
  ).length
)

const ckDone  = computed(() => store.checklist.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const ckTotal = computed(() => store.checklist.reduce((s, g) => s + g.items.length, 0))
const aDone   = computed(() => store.admin.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const aTotal  = computed(() => store.admin.reduce((s, g) => s + g.items.length, 0))
const gDone   = computed(() => store.gifts.filter(g => g.status === 'sudah_diserahkan').length)
const tlDone  = computed(() => store.timeline.filter(t => t.status === 'selesai').length)
const vJadi   = computed(() => store.vendors.filter(v => v.jadi).length)

const prepDone  = computed(() => ckDone.value + aDone.value + gDone.value + tlDone.value)
const prepTotal = computed(() => ckTotal.value + aTotal.value + store.gifts.length + store.timeline.length)
const prepPct   = computed(() => prepTotal.value ? Math.round(prepDone.value / prepTotal.value * 100) : 0)

const progressBars = computed(() => [
  { label: 'Checklist Persiapan',  done: ckDone.value,  total: ckTotal.value,        color: '#CD9F65', tab: 'checklist' },
  { label: 'Dokumen Nikah',        done: aDone.value,   total: aTotal.value,         color: '#0A1D4B', tab: 'admin' },
  { label: 'Mahar & Seserahan',    done: gDone.value,   total: store.gifts.length,   color: '#6E151A', tab: 'gifts' },
  // Tugas peninggalan tab Timeline lama — cuma tampil buat user yang
  // datanya masih ada; tugas baru sekarang hidup di Checklist.
  ...(store.timeline.length ? [{ label: 'Tugas Lama', done: tlDone.value, total: store.timeline.length, color: '#CD9F65', tab: 'timeline' }] : []),
  { label: 'Vendor dipilih',      done: vJadi.value,   total: store.vendors.length,  color: '#810100', tab: 'vendor' },
].map(b => ({ ...b, pct: b.total ? Math.round(b.done / b.total * 100) : 0 })))

function goTab(tab) { store.activeTab = tab }

const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

const _mapFeedItem = e => ({
  key: e.key, date: e.date, label: e.title, src: e.badge,
  amount: e.amount || 0,
  color: TIMELINE_CATEGORIES[e.cat]?.color || '#9C7575',
  tab: e.goto || 'timeline',
})

// Semua diambil dari feed Timeline yang sama (satu sumber aturan buat
// "apa saja yang bertanggal"), bukan ngumpulin ulang sendiri.
// Aktivitas Hari Ini: yang jatuh tepat hari ini — milestone (acara/Hari-H)
// SENGAJA ikut, itu justru kabar terbesar hari itu.
const todayItems = computed(() =>
  timelineItems.value.filter(e => !e.done && e.date === todayStr).map(_mapFeedItem)
)

// Deadline Terdekat: yang AKAN datang saja — hari ini punya section
// sendiri, yang telat sudah teriak di Perlu Perhatian. Milestone
// dikecualikan: ini daftar hal yang perlu DIKERJAKAN.
const upcoming = computed(() =>
  timelineItems.value
    .filter(e => !e.done && !e.milestone && e.date > todayStr)
    .slice(0, 5)
    .map(_mapFeedItem)
)

const daysLeft = date => {
  const d = new Date(date + 'T00:00:00')
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.round((d - t) / 86400000)
}

// ── Actionable insights ─────────────────────────────────────────────
function summarize(items, getLabel, max = 2) {
  const names = items.slice(0, max).map(getLabel)
  const rest  = items.length - names.length
  return names.join(', ') + (rest > 0 ? `, +${rest} lainnya` : '')
}

function goBudget(items) {
  store.activeTab = 'budget'
  const keys = new Set(items.map(b => store.bStatus(b).key))
  store.bFilter = keys.size === 1 ? [...keys][0] : 'all'
}

const alerts = computed(() => {
  const list = []

  const budgetOverdue = store.budget.filter(b => b.jatuhTempo && store.bStatus(b).key !== 'lunas' && daysLeft(b.jatuhTempo) < 0)
  if (budgetOverdue.length) {
    list.push({
      id: 'budget-overdue', severity: 'danger', icon: '⚠️',
      title: `${budgetOverdue.length} pembayaran lewat jatuh tempo`,
      desc: summarize(budgetOverdue, b => b.item || 'Item'),
      cta: 'Lihat Budget', action: () => goBudget(budgetOverdue),
    })
  }

  const budgetSoon = store.budget.filter(b => b.jatuhTempo && store.bStatus(b).key !== 'lunas' && daysLeft(b.jatuhTempo) >= 0 && daysLeft(b.jatuhTempo) <= 7)
  if (budgetSoon.length) {
    list.push({
      id: 'budget-soon', severity: 'warning', icon: '⏰',
      title: `${budgetSoon.length} pembayaran jatuh tempo minggu ini`,
      desc: summarize(budgetSoon, b => b.item || 'Item'),
      cta: 'Lihat Budget', action: () => goBudget(budgetSoon),
    })
  }

  // Aktivitas bertanggal non-pembayaran (Checklist, Vendor, Dokumen, Mahar
  // & Seserahan, tugas lama) — dibaca dari feed Timeline yang sama biar
  // hitungannya nggak pernah beda dengan yang ditampilkan di tab Timeline.
  const tlTasks = timelineItems.value.filter(e => !e.done && !e.milestone && e.cat !== 'bayar')

  const tlOverdue = tlTasks.filter(t => daysLeft(t.date) < 0)
  if (tlOverdue.length) {
    list.push({
      id: 'timeline-overdue', severity: 'danger', icon: '🚨',
      title: `${tlOverdue.length} aktivitas terlambat`,
      desc: summarize(tlOverdue, t => t.title),
      cta: 'Lihat Timeline', action: () => { store.activeTab = 'timeline' },
    })
  }

  const tlSoon = tlTasks.filter(t => daysLeft(t.date) >= 0 && daysLeft(t.date) <= 7)
  if (tlSoon.length) {
    list.push({
      id: 'timeline-soon', severity: 'warning', icon: '📅',
      title: `${tlSoon.length} aktivitas dalam 7 hari ke depan`,
      desc: summarize(tlSoon, t => t.title),
      cta: 'Lihat Timeline', action: () => { store.activeTab = 'timeline' },
    })
  }

  // Tamu melebihi kapasitas venue yang dipakai (capacityOver null = belum ada venue)
  if (store.capacityOver !== null && store.capacityOver > 0) {
    list.push({
      id: 'venue-overcap', severity: 'danger', icon: '⚠️',
      title: `Tamu lebih ${store.capacityOver} dari kapasitas venue`,
      desc: `${store.totalGuestPax} tamu vs kapasitas ${store.venueCapacity} — kurangi tamu atau cari venue lebih besar.`,
      cta: 'Lihat Vendor', action: () => { store.activeTab = 'vendor' },
    })
  }

  // Cuma bandingin item yang emang punya estimasi (store.budgetSelisihTotal) —
  // bukan total-aktual vs total-estimasi mentah, karena item tanpa estimasi
  // (mis. item manual yang cuma diisi Aktual) bakal bikin alert ini nyala
  // terus padahal bukan overspend beneran.
  if (store.budgetEstimasiSetCount > 0 && store.budgetSelisihTotal < 0) {
    const over = -store.budgetSelisihTotal
    list.push({
      id: 'budget-overspent', severity: 'warning', icon: '💸',
      title: 'Anggaran aktual melebihi estimasi',
      desc: `${store.budgetEstimasiSetCount} item yang punya estimasi total-nya lebih ${fmt(over)} dari rencana.`,
      cta: 'Lihat Budget', action: () => { store.activeTab = 'budget'; store.bFilter = 'all' },
    })
  }

  if (store.vendors.length > 0 && vJadi.value === 0) {
    list.push({
      id: 'vendor-undecided', severity: 'info', icon: '🤝',
      title: 'Belum ada vendor yang diputuskan',
      desc: `${store.vendors.length} kandidat vendor menunggu keputusan.`,
      cta: 'Lihat Vendor', action: () => { store.activeTab = 'vendor' },
    })
  }

  const giftsPending = store.gifts.filter(g => g.status !== 'sudah_diserahkan')
  if (giftsPending.length) {
    list.push({
      id: 'gifts-pending', severity: 'info', icon: '💍',
      title: `${giftsPending.length} item mahar/seserahan belum diserahkan`,
      desc: summarize(giftsPending, g => g.item || 'Item'),
      cta: 'Lihat Mahar & Seserahan', action: () => { store.activeTab = 'gifts' },
    })
  }

  const adminPending = []
  store.admin.forEach(g => (g.items || []).forEach(it => { if (!it.status) adminPending.push(it) }))
  if (adminPending.length) {
    list.push({
      id: 'admin-pending', severity: 'info', icon: '📄',
      title: `${adminPending.length} syarat dokumen nikah belum lengkap`,
      desc: summarize(adminPending, it => it.syarat || 'Syarat'),
      cta: 'Lihat Dokumen Nikah', action: () => { store.activeTab = 'admin' },
    })
  }

  const checklistPending = []
  store.checklist.forEach(g => (g.items || []).forEach(it => { if (!it.status) checklistPending.push(it) }))
  if (checklistPending.length) {
    list.push({
      id: 'checklist-pending', severity: 'info', icon: '✅',
      title: `${checklistPending.length} tugas checklist belum selesai`,
      desc: summarize(checklistPending, it => it.tugas || 'Tugas'),
      cta: 'Lihat Checklist', action: () => { store.activeTab = 'checklist' },
    })
  }

  const order = { danger: 0, warning: 1, info: 2 }
  const sorted = list.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5)

  // Ajakan aktifkan reminder ditampilkan terpisah dari alert data, selalu ikut
  // tampil selama belum diaktifkan (tidak ikut terpotong slice 5 di atas).
  if (!store.reminders?.enabled) {
    sorted.push({
      id: 'reminder-setup', severity: 'info', icon: '🔔',
      title: 'Aktifkan pengingat deadline',
      desc: notifPermission.value === 'denied'
        ? 'Browser memblokir notifikasi. Izinkan lewat pengaturan browser untuk mengaktifkan.'
        : 'Dapatkan notifikasi saat pembayaran atau tugas mendekati deadline.',
      cta: notifPermission.value === 'denied' ? 'Diblokir' : 'Aktifkan',
      action: enableReminders,
    })
  }

  return sorted
})

// ── Insight & Rekomendasi (section 10) — beda tujuan dari `alerts`
// (Perlu Perhatian, hal mendesak): ini saran maju-ke-depan/informatif,
// dibaca dari data yang sudah dihitung di file ini juga.
const homeInsights = computed(() => {
  const list = []

  if (kurangTarget.value > 0 && days.value > 0) {
    const bulanTersisa = Math.max(1, Math.ceil(days.value / 30))
    const perBulan = Math.ceil(kurangTarget.value / bulanTersisa)
    list.push({
      id: 'ins-nabung', icon: '💰',
      text: `Nabung sekitar ${fmt(perBulan)}/bulan (${bulanTersisa} bulan tersisa) biar Target Dana Pernikahan tercapai tepat waktu.`,
      cta: 'Lihat Wedding Fund', action: () => goTab('keuangan'),
    })
  }

  if (kehBelum.value > 0) {
    list.push({
      id: 'ins-rsvp', icon: '📮',
      text: `${kehBelum.value} tamu belum konfirmasi kehadiran — follow up sekarang biar hitungan katering makin akurat.`,
      cta: 'Lihat Tamu', action: () => goTab('tamu'),
    })
  }

  if (catCovered.value < VENDOR_CATEGORIES.length) {
    const sisa = VENDOR_CATEGORIES.length - catCovered.value
    list.push({
      id: 'ins-vendor', icon: '🤝',
      text: `${sisa} kategori vendor belum ada yang dipakai.`,
      cta: 'Lihat Vendor', action: () => goTab('vendor'),
    })
  }

  if (store.budgetEstimasiSetCount > 0 && store.budgetSelisihTotal > 0) {
    list.push({
      id: 'ins-hemat', icon: '👍',
      text: `Kamu hemat ${fmt(store.budgetSelisihTotal)} dari rencana awal.`,
    })
  }

  if (!list.length) {
    list.push({ id: 'ins-ok', icon: '🌿', text: 'Persiapan kamu berjalan baik — terus pantau dari sini.' })
  }

  return list.slice(0, 4)
})
</script>

<style scoped>
/* TourBtn pojok kanan hero */
.hm-hero { position: relative; }

.hm-tour-corner { position: absolute; top: 10px; right: 10px; }

:deep(.tour-btn) {
  width: 30px;
  height: 30px;
  padding: 0;
  gap: 0;
  justify-content: center;
  border-radius: 50%;
  border-color: rgba(255,255,255,.35);
  background: rgba(255,255,255,.12);
  color: rgba(255,255,255,.8);
  font-size: 0;
}
:deep(.tour-btn svg) { width: 15px; height: 15px; flex-shrink: 0; }
:deep(.tour-btn:hover) {
  border-color: var(--gold-soft);
  background: rgba(255,255,255,.22);
  color: #fff;
}

/* ── Partner Banner ── */
.hm-partner-banner {
  background: linear-gradient(135deg, #6E151A 0%, #810100 100%);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  box-shadow: 0 4px 20px rgba(110, 21, 26, .25);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.hm-partner-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(205, 159, 101, .08));
  opacity: 0;
  transition: opacity .3s;
}

.hm-partner-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(110, 21, 26, .35);
}

.hm-partner-banner:hover::before {
  opacity: 1;
}

.hm-partner-banner:active {
  transform: translateY(0);
}

.hm-partner-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(205, 159, 101, .2);
  border: 1.5px solid rgba(205, 159, 101, .4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E8BA78;
  flex-shrink: 0;
}

.hm-partner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.hm-partner-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  font-weight: 600;
  color: #E8BA78;
  letter-spacing: .01em;
}

.hm-partner-desc {
  font-size: 13px;
  color: rgba(232, 186, 120, .7);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-partner-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(205, 159, 101, .15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(232, 186, 120, .8);
  flex-shrink: 0;
  transition: background .2s, transform .2s;
}

.hm-partner-banner:hover .hm-partner-arrow {
  background: rgba(205, 159, 101, .25);
  transform: translateX(2px);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .hm-partner-banner {
    padding: 14px 16px;
  }

  .hm-partner-icon {
    width: 40px;
    height: 40px;
  }

  .hm-partner-title {
    font-size: 16px;
  }

  .hm-partner-desc {
    font-size: 12px;
  }
}

/* ── Actionable insights ── */
.hm-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.hm-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 13px 16px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--paper);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  box-shadow: 0 1px 3px rgba(36,8,8,.04);
}
.hm-alert:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(36,8,8,.10); }
.hm-alert:active { transform: translateY(0); }

.hm-alert-ico { font-size: 20px; flex-shrink: 0; line-height: 1; }

.hm-alert-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.hm-alert-title { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 14px; color: var(--ink); }
.hm-alert-desc {
  font-size: 12.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-alert-cta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--plum);
  white-space: nowrap;
}

.hm-alert-danger  { border-left: 3px solid var(--rose); }
.hm-alert-danger  .hm-alert-title { color: var(--rose); }
.hm-alert-warning { border-left: 3px solid var(--gold); }
.hm-alert-info    { border-left: 3px solid var(--teal); }

.hm-alert-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
  border-radius: 14px;
  background: var(--ivory);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 13.5px;
}

/* ── Section 2 heading (bukan di dalam card, langsung di atas .hm-alerts) ── */
.hm-sec-head {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 12px;
}

/* ── Progress Persiapan (section 5) ── */
.hm-sec-side {
  margin-left: auto;
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.hm-overall { margin-bottom: 18px; }

/* ── Ringkasan angka: Budget/Fund/Tamu/Vendor (section 6-9) ── */
.hm-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}
@media (max-width: 640px) {
  .hm-grid2 { grid-template-columns: 1fr; }
}

.hm-sum { display: block; text-align: left; width: 100%; }
.hm-big {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}
.hm-big-unit { font-size: 16px; font-weight: 500; color: var(--muted); }
.hm-big-lbl { font-size: 12.5px; color: var(--muted); margin-bottom: 12px; }

.hm-sum-track { margin-bottom: 12px; }

.hm-kv {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 13px;
  color: var(--muted);
  padding: 3px 0;
}
.hm-kv b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }

.hm-note-line {
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 500;
  padding: 7px 10px;
  border-radius: 8px;
}
.hm-note-line.good { color: #2b5010; background: #EAF3DE; }
.hm-note-line.bad  { color: #7a1a1a; background: var(--rose-soft); }

.hm-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.hm-chip {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  background: var(--ivory);
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 4px 10px;
}
.hm-chip.ok { color: #2b5010; background: #EAF3DE; border-color: transparent; }

/* ── Insight & Rekomendasi (section 10) ── */
.hm-ins-list { display: flex; flex-direction: column; gap: 8px; }
.hm-ins {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--ivory);
  cursor: pointer;
  transition: background .15s;
}
.hm-ins:hover { background: var(--gold-soft); }
.hm-ins-static { cursor: default; }
.hm-ins-static:hover { background: var(--ivory); }

.hm-ins-ico { font-size: 17px; flex-shrink: 0; line-height: 1; }
.hm-ins-text { flex: 1; min-width: 0; font-size: 13px; color: var(--ink); line-height: 1.5; }
.hm-ins-cta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--plum);
  white-space: nowrap;
}
</style>
