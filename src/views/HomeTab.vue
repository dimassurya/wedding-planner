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

    <!-- Actionable insights -->
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
        <span>✅</span> Aman, belum ada hal mendesak.
      </div>
    </div>

    <!-- Metrics -->
    <div class="hm-metrics">
      <button class="hm-metric hm-clickable" @click="goTab('tamu')">
        <div class="hm-m-num">{{ totalOrang.toLocaleString('id-ID') }}</div>
        <div class="hm-m-lbl">Total Tamu (orang)</div>
        <div class="hm-m-sub">{{ confirmedList.length }} undangan dikonfirmasi</div>
        <span class="hm-m-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
      </button>
      <button class="hm-metric hm-clickable" @click="goTab('budget')">
        <div class="hm-m-num">{{ fmt(tAkt) }}</div>
        <div class="hm-m-lbl">Anggaran Aktual</div>
        <div class="hm-m-sub">est. {{ fmt(tEst) }}</div>
        <span class="hm-m-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
      </button>
      <button class="hm-metric hm-clickable" @click="goTab('budget')">
        <div class="hm-m-num">{{ pctPaid }}%</div>
        <div class="hm-m-lbl">Sudah Dibayar</div>
        <div class="hm-m-sub">sisa {{ fmt(tSis) }}</div>
        <span class="hm-m-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
      </button>
      <div class="hm-metric">
        <div class="hm-m-num">{{ prepPct }}%</div>
        <div class="hm-m-lbl">Progres Persiapan</div>
        <div class="hm-m-sub">{{ prepDone }}/{{ prepTotal }} selesai</div>
      </div>
    </div>

    <!-- Mobile: ringkasan singkat -->
    <div v-if="isMobile" class="hm-mob-summary">
      <button class="hm-mob-card hm-clickable" @click="goTab('budget')">
        <div class="hm-mob-title">Anggaran<span class="hm-mob-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-mob-track">
          <div class="hm-mob-fill" :style="{ width: pctPaid + '%' }"></div>
        </div>
        <div class="hm-mob-row">
          <span><span class="hm-mob-dot" style="background:#CD9F65"></span>Terbayar: {{ fmt(tDib) }}</span>
          <span><span class="hm-mob-dot" style="background:#B32E33"></span>Sisa: {{ fmt(tSis) }}</span>
        </div>
      </button>
      <button class="hm-mob-card hm-clickable" @click="goTab('tamu')">
        <div class="hm-mob-title">Komposisi Tamu<span class="hm-mob-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <div class="hm-mob-row">
          <span><span class="hm-mob-dot" style="background:#0A1D4B"></span>Pria: {{ pria }} org</span>
          <span><span class="hm-mob-dot" style="background:#B32E33"></span>Wanita: {{ wanita }} org</span>
          <span v-if="lainnya"><span class="hm-mob-dot" style="background:#CD9F65"></span>Lainnya: {{ lainnya }} org</span>
        </div>
      </button>
    </div>

    <!-- Donut charts (desktop only) -->
    <div v-if="!isMobile" class="hm-charts">
      <button class="card hm-chart hm-clickable" @click="goTab('tamu')">
        <div class="hm-chart-title">Komposisi Tamu<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <svg viewBox="0 0 160 160" class="hm-donut" v-html="donutArcs([
          { value: pria, color: '#0A1D4B' },
          { value: wanita, color: '#B32E33' },
          { value: lainnya, color: '#CD9F65' },
        ], totalOrang.toLocaleString('id-ID'), 'orang')"></svg>
        <div class="hm-legend">
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#0A1D4B"></span>Pihak Pria<b>{{ pria }}</b></div>
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#B32E33"></span>Pihak Wanita<b>{{ wanita }}</b></div>
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#CD9F65"></span>Lainnya<b>{{ lainnya }}</b></div>
        </div>
      </button>

      <button class="card hm-chart hm-clickable" @click="goTab('budget')">
        <div class="hm-chart-title">Anggaran<span class="hm-chart-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span></div>
        <svg viewBox="0 0 160 160" class="hm-donut" v-html="donutArcs([
          { value: tDib, color: '#CD9F65' },
          { value: tSis, color: '#B32E33' },
        ], pctPaid + '%', 'terbayar')"></svg>
        <div class="hm-legend">
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#CD9F65"></span>Terbayar<b>{{ fmt(tDib) }}</b></div>
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#B32E33"></span>Belum Dibayar<b>{{ fmt(tSis) }}</b></div>
        </div>
      </button>
    </div>

    <!-- Progress bars -->
    <div class="card hm-section">
      <div class="hm-chart-title">Progres Persiapan per Bagian</div>
      <div class="hm-bars">
        <button v-for="bar in progressBars" :key="bar.label" class="hm-bar hm-clickable" @click="goTab(bar.tab)">
          <div class="hm-bar-top"><span>{{ bar.label }}</span><span class="hm-bar-val">{{ bar.done }}/{{ bar.total }} · {{ bar.pct }}%</span></div>
          <div class="hm-track"><span :style="{ width: bar.pct + '%', background: bar.color }"></span></div>
          <span class="hm-bar-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
        </button>
      </div>
    </div>

    <!-- Upcoming deadlines -->
    <div class="card hm-section">
      <div class="hm-chart-title">Deadline Terdekat</div>
      <div v-if="!upcoming.length" class="hm-empty">Belum ada deadline. Isi jatuh tempo di Budget atau deadline tugas di Checklist.</div>
      <div v-else class="hm-deadlines">
        <button v-for="it in upcoming" :key="it.date + it.label" class="hm-dl hm-clickable" @click="goTab(it.src === 'Budget' ? 'budget' : 'timeline')">
          <div class="hm-dl-date">{{ fmtDate(it.date) }}</div>
          <div class="hm-dl-main">
            <span class="hm-dl-src" :class="'hm-src-' + it.src.toLowerCase()">{{ it.src }}</span>
            {{ it.label }}
          </div>
          <div class="hm-dl-left">
            <span v-if="daysLeft(it.date) < 0" class="hm-dl-late">lewat {{ Math.abs(daysLeft(it.date)) }} hari</span>
            <span v-else-if="daysLeft(it.date) === 0" class="hm-dl-soon">hari ini</span>
            <span v-else class="hm-dl-days">{{ daysLeft(it.date) }} hari lagi</span>
          </div>
          <span class="hm-dl-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></span>
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
import { META, WEDDING_DATE } from '../data/constants'
import { useIsMobile } from '../mobile layout/useIsMobile'
import { useReminderNotifications } from '../composables/useReminderNotifications'
import TourBtn from '../components/TourBtn.vue'
import AddPartnerCard from '../components/AddPartnerCard.vue'

const store = useWeddingStore()
const isMobile = useIsMobile()
const showPartnerCard = ref(false)

const { supported: notifSupported, permission: notifPermission, requestPermission } = useReminderNotifications()

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
    desc: 'Sisa hari menuju hari pernikahan ada di sebelah kanan. Informasi nama pasangan, tanggal, dan waktu acara bisa diatur dari menu Pengaturan (ikon gear di header).',
  },
  {
    selector: '#panel-home .hm-partner-banner',
    icon: '💑',
    title: 'Kolaborasi Pasangan',
    desc: 'Undang pasanganmu untuk mengedit data bersama secara real-time. Klik banner ini untuk mengirim undangan atau kelola akses pasangan.',
  },
  {
    selector: '#panel-home .hm-metrics',
    icon: '📊',
    title: 'Metrik Ringkasan',
    desc: 'Empat angka sekilas: total tamu yang dikonfirmasi, anggaran aktual, persentase yang sudah dibayar, dan progres persiapan keseluruhan dari semua tab.',
  },
  {
    selector: isMobile.value ? '#panel-home .hm-mob-summary' : '#panel-home .hm-charts',
    icon: '🥧',
    title: isMobile.value ? 'Ringkasan Visual' : 'Grafik Ringkasan',
    desc: isMobile.value
      ? 'Ringkasan cepat: progress bar anggaran (terbayar vs sisa) dan komposisi tamu per pihak.'
      : 'Dua donut chart: komposisi tamu pihak pria, wanita, dan lainnya — plus status anggaran berapa yang sudah terbayar.',
  },
  {
    selector: '#panel-home .hm-bars',
    icon: '📈',
    title: 'Progres per Area',
    desc: 'Progress bar tiap area persiapan — checklist, dokumen nikah, seserahan, mahar, timeline, dan vendor. Langsung kelihatan mana yang masih butuh perhatian.',
  },
  {
    selector: '#panel-home .hm-deadlines',
    icon: '⏰',
    title: 'Deadline Terdekat',
    desc: '5 deadline terdekat dari Agenda (tugas belum selesai) dan Budget (jatuh tempo pembayaran). Diurut dari yang paling dekat supaya tidak ada yang kelewat.',
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

const confirmedList = computed(() => store.guests.filter(g => g.konfirmasi !== false))
const totalOrang    = computed(() => confirmedList.value.reduce((s, g) => s + g.jumlah, 0))

const pria = computed(() => confirmedList.value.filter(g => META[g.status]?.side === 'pria').reduce((s, g) => s + g.jumlah, 0))
const wanita = computed(() => confirmedList.value.filter(g => META[g.status]?.side === 'wanita').reduce((s, g) => s + g.jumlah, 0))
const lainnya = computed(() => Math.max(totalOrang.value - pria.value - wanita.value, 0))

const tEst    = computed(() => store.budget.reduce((s, b) => s + (b.estimasi || 0), 0))
const tAkt    = computed(() => store.budget.reduce((s, b) => s + (b.aktual || 0), 0))
const tDib    = computed(() => store.budget.reduce((s, b) => s + (b.dibayar || 0), 0))
const tSis    = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))
const pctPaid = computed(() => tAkt.value ? Math.round(tDib.value / tAkt.value * 100) : 0)

const ckDone  = computed(() => store.checklist.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const ckTotal = computed(() => store.checklist.reduce((s, g) => s + g.items.length, 0))
const aDone   = computed(() => store.admin.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const aTotal  = computed(() => store.admin.reduce((s, g) => s + g.items.length, 0))
const sDone   = computed(() => store.seserahan.filter(s => s.status).length)
const mDone   = computed(() => store.mahar.filter(m => m.status).length)
const tlDone  = computed(() => store.timeline.filter(t => t.status === 'selesai').length)
const vJadi   = computed(() => store.vendors.filter(v => v.jadi).length)

const prepDone  = computed(() => ckDone.value + aDone.value + sDone.value + mDone.value + tlDone.value)
const prepTotal = computed(() => ckTotal.value + aTotal.value + store.seserahan.length + store.mahar.length + store.timeline.length)
const prepPct   = computed(() => prepTotal.value ? Math.round(prepDone.value / prepTotal.value * 100) : 0)

const progressBars = computed(() => [
  { label: 'Checklist Persiapan',  done: ckDone.value,  total: ckTotal.value,          color: '#CD9F65', tab: 'checklist' },
  { label: 'Dokumen Nikah',        done: aDone.value,   total: aTotal.value,           color: '#0A1D4B', tab: 'admin' },
  { label: 'Seserahan',           done: sDone.value,   total: store.seserahan.length,  color: '#B32E33', tab: 'seserahan' },
  { label: 'Mahar',               done: mDone.value,   total: store.mahar.length,      color: '#6E151A', tab: 'mahar' },
  { label: 'Timeline (tugas)',    done: tlDone.value,  total: store.timeline.length,   color: '#CD9F65', tab: 'timeline' },
  { label: 'Vendor dipilih',      done: vJadi.value,   total: store.vendors.length,    color: '#810100', tab: 'vendor' },
].map(b => ({ ...b, pct: b.total ? Math.round(b.done / b.total * 100) : 0 })))

function goTab(tab) { store.activeTab = tab }

const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

const upcoming = computed(() => {
  const list = []
  store.timeline.forEach(t => { if (t.deadline && t.status !== 'selesai') list.push({ date: t.deadline, label: t.tugas || 'Tugas', src: 'Agenda' }) })
  store.checklist.forEach(g => (g.items || []).forEach(it => {
    if (it.deadline && !it.status) list.push({ date: it.deadline, label: it.tugas || 'Tugas', src: 'Agenda' })
  }))
  store.budget.forEach(b => {
    if (b.jatuhTempo && store.bStatus(b).key !== 'lunas') list.push({ date: b.jatuhTempo, label: 'Bayar: ' + (b.item || '—'), src: 'Budget' })
  })
  return list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0).slice(0, 5)
})

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

  // Tugas bertanggal dari dua sumber Agenda: Timeline lama + deadline Checklist.
  const agendaTasks = [
    ...store.timeline
      .filter(t => t.deadline && t.status !== 'selesai')
      .map(t => ({ deadline: t.deadline, label: t.tugas || 'Tugas' })),
    ...store.checklist.flatMap(g =>
      (g.items || [])
        .filter(it => it.deadline && !it.status)
        .map(it => ({ deadline: it.deadline, label: it.tugas || 'Tugas' }))
    ),
  ]

  const tlOverdue = agendaTasks.filter(t => daysLeft(t.deadline) < 0)
  if (tlOverdue.length) {
    list.push({
      id: 'timeline-overdue', severity: 'danger', icon: '🚨',
      title: `${tlOverdue.length} tugas terlambat`,
      desc: summarize(tlOverdue, t => t.label),
      cta: 'Lihat Agenda', action: () => { store.activeTab = 'timeline' },
    })
  }

  const tlSoon = agendaTasks.filter(t => daysLeft(t.deadline) >= 0 && daysLeft(t.deadline) <= 7)
  if (tlSoon.length) {
    list.push({
      id: 'timeline-soon', severity: 'warning', icon: '📅',
      title: `${tlSoon.length} tugas deadline minggu ini`,
      desc: summarize(tlSoon, t => t.label),
      cta: 'Lihat Agenda', action: () => { store.activeTab = 'timeline' },
    })
  }

  // Belum dibayar tapi tidak punya jatuh tempo — tidak ke-cover 2 alert di atas
  const budgetUnpaidNoDate = store.budget.filter(b => store.bStatus(b).key !== 'lunas' && (b.aktual || 0) > 0 && !b.jatuhTempo)
  if (budgetUnpaidNoDate.length) {
    list.push({
      id: 'budget-unpaid-nodate', severity: 'info', icon: '💰',
      title: `${budgetUnpaidNoDate.length} item budget belum dibayar`,
      desc: `Total sisa ${fmt(budgetUnpaidNoDate.reduce((s, b) => s + store.bSisa(b), 0))} — belum ada jatuh tempo diisi.`,
      cta: 'Lihat Budget', action: () => goBudget(budgetUnpaidNoDate),
    })
  }

  const unconfirmed = store.guests.filter(g => g.konfirmasi === false)
  if (unconfirmed.length) {
    list.push({
      id: 'tamu-unconfirmed', severity: 'info', icon: '👥',
      title: `${unconfirmed.length} tamu belum dikonfirmasi`,
      desc: 'Follow up konfirmasi kehadiran biar data makin akurat.',
      cta: 'Lihat Tamu', action: () => { store.activeTab = 'tamu' },
    })
  }

  if (tEst.value > 0 && tAkt.value > tEst.value) {
    list.push({
      id: 'budget-overspent', severity: 'warning', icon: '💸',
      title: 'Anggaran aktual melebihi estimasi',
      desc: `Aktual ${fmt(tAkt.value)} vs estimasi ${fmt(tEst.value)} — selisih ${fmt(tAkt.value - tEst.value)}.`,
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

  const maharPending = store.mahar.filter(m => !m.status)
  if (maharPending.length) {
    list.push({
      id: 'mahar-pending', severity: 'info', icon: '💍',
      title: `${maharPending.length} item mahar belum disiapkan`,
      desc: summarize(maharPending, m => m.item || 'Item'),
      cta: 'Lihat Mahar', action: () => { store.activeTab = 'mahar' },
    })
  }

  const seserahanPending = store.seserahan.filter(s => !s.status)
  if (seserahanPending.length) {
    list.push({
      id: 'seserahan-pending', severity: 'info', icon: '🎁',
      title: `${seserahanPending.length} item seserahan belum dibeli`,
      desc: summarize(seserahanPending, s => s.item || 'Item'),
      cta: 'Lihat Seserahan', action: () => { store.activeTab = 'seserahan' },
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

function donutArcs(segments, top, bottom) {
  const cx = 80, cy = 80, r = 58, sw = 20, C = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  let off = 0, arcs = ''
  if (total > 0) {
    segments.forEach(s => {
      if (s.value <= 0) return
      const len = s.value / total * C
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`
      off += len
    })
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1E9E4" stroke-width="${sw}"/>
    ${arcs}
    <text x="${cx}" y="${cy - 1}" text-anchor="middle" class="hm-donut-num">${top}</text>
    <text x="${cx}" y="${cy + 17}" text-anchor="middle" class="hm-donut-lbl">${bottom}</text>`
}
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

.hm-mob-summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 14px;
}

.hm-mob-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  display: block;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  width: 100%;
  margin: 0;
  transition: transform .15s, box-shadow .15s;
}
.hm-mob-card:active { transform: translateY(0); background: var(--ivory); }

.hm-mob-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hm-mob-arrow { display: inline-flex; align-items: center; color: var(--muted); }

.hm-mob-track {
  height: 8px;
  background: var(--line);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 10px;
}

.hm-mob-fill {
  height: 100%;
  background: #CD9F65;
  border-radius: 100px;
  transition: width .4s ease;
}

.hm-mob-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 13px;
  color: var(--ink);
  font-weight: 500;
}

.hm-mob-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
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
</style>
