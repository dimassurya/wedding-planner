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

    <!-- Metrics -->
    <div class="hm-metrics">
      <div class="hm-metric">
        <div class="hm-m-num">{{ totalOrang.toLocaleString('id-ID') }}</div>
        <div class="hm-m-lbl">Total Tamu (orang)</div>
        <div class="hm-m-sub">{{ confirmedList.length }} undangan dikonfirmasi</div>
      </div>
      <div class="hm-metric">
        <div class="hm-m-num">{{ fmt(tAkt) }}</div>
        <div class="hm-m-lbl">Anggaran Aktual</div>
        <div class="hm-m-sub">est. {{ fmt(tEst) }}</div>
      </div>
      <div class="hm-metric">
        <div class="hm-m-num">{{ pctPaid }}%</div>
        <div class="hm-m-lbl">Sudah Dibayar</div>
        <div class="hm-m-sub">sisa {{ fmt(tSis) }}</div>
      </div>
      <div class="hm-metric">
        <div class="hm-m-num">{{ prepPct }}%</div>
        <div class="hm-m-lbl">Progres Persiapan</div>
        <div class="hm-m-sub">{{ prepDone }}/{{ prepTotal }} selesai</div>
      </div>
    </div>

    <!-- Mobile: ringkasan singkat -->
    <div v-if="isMobile" class="hm-mob-summary">
      <div class="hm-mob-card">
        <div class="hm-mob-title">Anggaran</div>
        <div class="hm-mob-track">
          <div class="hm-mob-fill" :style="{ width: pctPaid + '%' }"></div>
        </div>
        <div class="hm-mob-row">
          <span><span class="hm-mob-dot" style="background:#CD9F65"></span>Terbayar: {{ fmt(tDib) }}</span>
          <span><span class="hm-mob-dot" style="background:#B32E33"></span>Sisa: {{ fmt(tSis) }}</span>
        </div>
      </div>
      <div class="hm-mob-card">
        <div class="hm-mob-title">Komposisi Tamu</div>
        <div class="hm-mob-row">
          <span><span class="hm-mob-dot" style="background:#0A1D4B"></span>Pria: {{ pria }} org</span>
          <span><span class="hm-mob-dot" style="background:#B32E33"></span>Wanita: {{ wanita }} org</span>
          <span v-if="lainnya"><span class="hm-mob-dot" style="background:#CD9F65"></span>Lainnya: {{ lainnya }} org</span>
        </div>
      </div>
    </div>

    <!-- Donut charts (desktop only) -->
    <div v-if="!isMobile" class="hm-charts">
      <div class="card hm-chart">
        <div class="hm-chart-title">Komposisi Tamu</div>
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
      </div>

      <div class="card hm-chart">
        <div class="hm-chart-title">Anggaran</div>
        <svg viewBox="0 0 160 160" class="hm-donut" v-html="donutArcs([
          { value: tDib, color: '#CD9F65' },
          { value: tSis, color: '#B32E33' },
        ], pctPaid + '%', 'terbayar')"></svg>
        <div class="hm-legend">
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#CD9F65"></span>Terbayar<b>{{ fmt(tDib) }}</b></div>
          <div class="hm-leg"><span class="hm-leg-dot" style="background:#B32E33"></span>Belum Dibayar<b>{{ fmt(tSis) }}</b></div>
        </div>
      </div>
    </div>

    <!-- Progress bars -->
    <div class="card hm-section">
      <div class="hm-chart-title">Progres Persiapan per Bagian</div>
      <div class="hm-bars">
        <div v-for="bar in progressBars" :key="bar.label" class="hm-bar">
          <div class="hm-bar-top"><span>{{ bar.label }}</span><span class="hm-bar-val">{{ bar.done }}/{{ bar.total }} · {{ bar.pct }}%</span></div>
          <div class="hm-track"><span :style="{ width: bar.pct + '%', background: bar.color }"></span></div>
        </div>
      </div>
    </div>

    <!-- Upcoming deadlines -->
    <div class="card hm-section">
      <div class="hm-chart-title">Deadline Terdekat</div>
      <div v-if="!upcoming.length" class="hm-empty">Belum ada deadline. Isi jatuh tempo di Budget atau tugas di Timeline.</div>
      <div v-else class="hm-deadlines">
        <div v-for="it in upcoming" :key="it.date + it.label" class="hm-dl">
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
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate } from '../utils/index'
import { META, WEDDING_DATE } from '../data/constants'
import { useIsMobile } from '../mobile layout/useIsMobile'
import TourBtn from '../components/TourBtn.vue'

const store = useWeddingStore()
const isMobile = useIsMobile()

const HOME_STEPS = computed(() => [
  {
    selector: '#panel-home .hm-hero',
    icon: '📅',
    title: 'Hitung Mundur',
    desc: 'Sisa hari menuju hari pernikahan ada di sebelah kanan. Informasi nama pasangan, tanggal, dan waktu acara bisa diatur dari menu Pengaturan (ikon gear di header).',
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
    desc: '5 deadline terdekat dari Timeline (tugas belum selesai) dan Budget (jatuh tempo pembayaran). Diurut dari yang paling dekat supaya tidak ada yang kelewat.',
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
  { label: 'Checklist Persiapan',  done: ckDone.value,  total: ckTotal.value,          color: '#CD9F65' },
  { label: 'Dokumen Nikah',        done: aDone.value,   total: aTotal.value,           color: '#0A1D4B' },
  { label: 'Seserahan',           done: sDone.value,   total: store.seserahan.length,  color: '#B32E33' },
  { label: 'Mahar',               done: mDone.value,   total: store.mahar.length,      color: '#6E151A' },
  { label: 'Timeline (tugas)',    done: tlDone.value,  total: store.timeline.length,   color: '#CD9F65' },
  { label: 'Vendor dipilih',      done: vJadi.value,   total: store.vendors.length,    color: '#810100' },
].map(b => ({ ...b, pct: b.total ? Math.round(b.done / b.total * 100) : 0 })))

const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

const upcoming = computed(() => {
  const list = []
  store.timeline.forEach(t => { if (t.deadline && t.status !== 'selesai') list.push({ date: t.deadline, label: t.tugas || 'Tugas', src: 'Timeline' }) })
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
}

.hm-mob-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 10px;
}

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
</style>
