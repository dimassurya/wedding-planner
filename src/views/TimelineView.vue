<template>
  <section class="panel active" id="panel-timeline">
    <!-- ══ Hero: perjalanan menuju Hari-H ══ -->
    <div class="tl-hero">
      <div class="tl-hero-head">
        <div>
          <div class="tl-hero-title">❤️ Menuju Hari Pernikahan</div>
          <div class="tl-hero-eyebrow">Progress menuju Hari H</div>
        </div>
        <TourBtn :steps="TIMELINE_STEPS" class="tl-hero-tour" />
      </div>

      <div class="tl-hero-count">
        <template v-if="daysToWedding === null">
          <span class="tl-hero-num">—</span>
          <span class="tl-hero-unit">Tanggal pernikahan belum diisi</span>
        </template>
        <template v-else-if="daysToWedding > 0">
          <span class="tl-hero-num">{{ daysToWedding }}</span>
          <span class="tl-hero-unit">Hari Lagi</span>
        </template>
        <template v-else-if="daysToWedding === 0">
          <span class="tl-hero-num">Hari Ini</span>
        </template>
        <template v-else>
          <span class="tl-hero-num">{{ Math.abs(daysToWedding) }}</span>
          <span class="tl-hero-unit">Hari Lalu</span>
        </template>
      </div>

      <div v-if="journey" class="tl-hero-progress">
        <div class="tl-hero-bar"><div class="tl-hero-fill" :style="{ width: journey.pct + '%' }"></div></div>
        <div class="tl-hero-ends">
          <span>{{ fmtDate(journey.start) }}</span>
          <span class="tl-hero-line"></span>
          <span class="tl-hero-end">{{ fmtDate(journey.end) }}</span>
        </div>
      </div>

      <div class="tl-hero-insights">
        <div v-for="(i, idx) in insights" :key="idx" class="tl-insight" :class="'tone-' + i.tone">
          <span class="tl-insight-ico">{{ i.icon }}</span>{{ i.text }}
        </div>
      </div>
    </div>

    <!-- ══ Perlu Perhatian ══ -->
    <div class="tl-sec-title">Perlu Perhatian</div>
    <div class="tl-focus">
      <div class="tl-focus-card" :class="{ 'is-alert': lateItems.length }">
        <div class="tl-focus-top"><span class="tl-focus-ico">🔴</span> Terlambat</div>
        <div class="tl-focus-val">{{ lateItems.length }} Aktivitas</div>
        <div class="tl-focus-sub">{{ lateItems.length ? preview(lateItems) : 'Tidak ada yang terlewat' }}</div>
      </div>

      <div class="tl-focus-card" :class="{ 'is-warn': weekItems.length }">
        <div class="tl-focus-top"><span class="tl-focus-ico">🟡</span> 7 Hari Ke Depan</div>
        <div class="tl-focus-val">{{ weekItems.length }} Aktivitas</div>
        <div class="tl-focus-sub">{{ weekItems.length ? preview(weekItems) : 'Minggu ini lowong' }}</div>
      </div>

      <div class="tl-focus-card">
        <div class="tl-focus-top"><span class="tl-focus-ico">💰</span> Pembayaran Terdekat</div>
        <template v-if="nextPayment">
          <div class="tl-focus-val tl-focus-val-sm">{{ nextPayment.title }}</div>
          <div class="tl-focus-sub">
            {{ nextPayment.status.label }}<template v-if="nextPayment.amount"> · {{ fmt(nextPayment.amount) }}</template>
          </div>
        </template>
        <template v-else>
          <div class="tl-focus-val">—</div>
          <div class="tl-focus-sub">Belum ada tagihan terjadwal</div>
        </template>
      </div>

      <div class="tl-focus-card is-hh">
        <div class="tl-focus-top"><span class="tl-focus-ico">❤️</span> Hari H</div>
        <div class="tl-focus-val">
          {{ daysToWedding === null ? '—' : daysToWedding > 0 ? daysToWedding + ' Hari Lagi' : daysToWedding === 0 ? 'Hari Ini' : Math.abs(daysToWedding) + ' Hari Lalu' }}
        </div>
        <div class="tl-focus-sub">{{ weddingDate ? fmtDate(weddingDate) : 'Isi tanggal di tab Home' }}</div>
      </div>
    </div>

    <!-- ══ Penjelasan halaman ══ -->
    <div class="tl-note">
      Semua kegiatan, deadline, dan pembayaran penting ditampilkan berdasarkan urutan waktunya.
      Tambahkan tugas di
      <button class="tl-link" @click="store.activeTab = 'checklist'">Checklist</button>,
      pembayaran di
      <button class="tl-link" @click="store.activeTab = 'budget'">Budget</button>,
      atau jadwal di
      <button class="tl-link" @click="store.activeTab = 'vendor'">Vendor</button> —
      semuanya otomatis muncul di sini.
    </div>

    <!-- ══ Legend (sekaligus filter) & rentang waktu ══ -->
    <div class="tl-controls">
      <div class="tl-legend">
        <button
          v-for="c in legend" :key="c.id"
          class="tl-lg" :class="{ off: !activeCats.has(c.id) }"
          :title="activeCats.has(c.id) ? 'Sembunyikan ' + c.label : 'Tampilkan ' + c.label"
          @click="toggleCat(c.id)"
        >
          <span class="tl-lg-dot" :style="{ background: c.color }"></span>
          <span class="tl-lg-ico">{{ c.icon }}</span>
          {{ c.label }}
          <span class="tl-lg-n">{{ c.count }}</span>
        </button>
      </div>

      <div class="tl-seg">
        <button v-for="r in RANGES" :key="r.id" class="tl-seg-btn" :class="{ on: range === r.id }" @click="range = r.id">{{ r.label }}</button>
      </div>
    </div>

    <!-- ══ Garis waktu (read-only) ══ -->
    <div v-if="!groups.length" class="card">
      <div class="empty">
        <div class="big">{{ items.length ? 'Tidak ada aktivitas di tampilan ini' : 'Belum ada aktivitas bertanggal' }}</div>
        <div v-if="items.length">Coba ubah filter kategori atau rentang waktunya.</div>
        <div v-else>Isi deadline tugas di Checklist, jatuh tempo di Budget, atau jadwal di Vendor — semuanya otomatis muncul di sini urut waktu.</div>
      </div>
    </div>

    <div v-else class="tl-rail">
      <div class="tl-line"></div>

      <template v-for="g in groups" :key="g.key">
        <div class="tl-month">{{ g.label }}</div>

        <template v-for="e in g.items" :key="e.key">
          <div v-if="e.key === todayAnchor" class="tl-today">
            <span class="tl-today-lbl">Hari ini · {{ fmtDate(today) }}</span>
          </div>

          <component
            :is="e.goto ? 'button' : 'div'"
            class="tl-item"
            :class="[
              'tl-cat-' + e.cat,
              { 'tl-done': e.done, 'tl-hh': e.hariH, 'tl-clickable': !!e.goto },
            ]"
            :title="e.goto ? 'Buka di ' + catLabel(e.cat) : null"
            @click="e.goto && (store.activeTab = e.goto)"
          >
            <span class="tl-dot" :style="{ background: catColor(e.cat) }"></span>

            <div class="tl-body">
              <div class="tl-name">
                <span v-if="e.hariH" class="tl-hh-ico">❤️</span>{{ e.title }}
              </div>
              <div class="tl-meta">
                <span class="tl-badge" :style="badgeStyle(e.cat)">{{ catIcon(e.cat) }} {{ e.badge }}</span>
                <span class="tl-date">{{ e.dateLabel }}</span>
                <span v-if="e.detail" class="tl-detail">· {{ e.detail }}</span>
              </div>
            </div>

            <div class="tl-right">
              <span v-if="e.amount" class="tl-amt">{{ fmt(e.amount) }}</span>
              <span class="tl-status" :class="'st-' + e.status.tone">{{ e.status.label }}</span>
            </div>
          </component>
        </template>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { fmt, fmtDate } from '../utils/index'
import { TIMELINE_CATEGORIES, TIMELINE_CATEGORY_ORDER } from '../data/constants'
import { useTimelineFeed } from '../composables/useTimelineFeed'
import TourBtn from '../components/TourBtn.vue'

// Halaman ini READ-ONLY: nggak ada tambah/ubah/hapus di sini. Semua data
// datang dari modul asalnya lewat useTimelineFeed() — klik kartu cuma
// pindah tab ke modul yang punya datanya.
const {
  store, today, items, weddingDate, daysToWedding, journey,
  lateItems, weekItems, nextPayment, insights,
} = useTimelineFeed()

const TIMELINE_STEPS = [
  {
    selector: '#panel-timeline .tl-hero',
    icon: '❤️',
    title: 'Perjalanan ke Hari H',
    desc: 'Hitungan mundur, progress bar dari awal persiapan sampai hari pernikahan, plus ringkasan singkat kondisi minggu ini.',
  },
  {
    selector: '#panel-timeline .tl-focus',
    icon: '🔍',
    title: 'Perlu Perhatian',
    desc: 'Empat hal terpenting: yang terlambat, yang jatuh dalam 7 hari ke depan, pembayaran terdekat, dan sisa hari menuju Hari H.',
  },
  {
    selector: '#panel-timeline .tl-legend',
    icon: '🏷️',
    title: 'Legend & Filter',
    desc: 'Tiap warna mewakili modul asal datanya. Ketuk salah satu untuk menyembunyikan atau menampilkan kategori itu.',
  },
  {
    selector: '#panel-timeline .tl-rail',
    icon: '📅',
    title: 'Garis Waktu',
    desc: 'Semua aktivitas bertanggal urut waktu. Halaman ini cuma menampilkan — untuk mengubah tanggal, ketuk kartunya dan kamu dibawa ke modul asalnya.',
  },
]

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const RANGES = [
  { id: 'all',  label: 'Semua' },
  { id: 'next', label: 'Akan Datang' },
  { id: 'past', label: 'Sudah Lewat' },
]
const range = ref('all')

const activeCats = ref(new Set(TIMELINE_CATEGORY_ORDER))
function toggleCat(id) {
  const s = new Set(activeCats.value)
  s.has(id) ? s.delete(id) : s.add(id)
  activeCats.value = s
}

const catLabel = id => TIMELINE_CATEGORIES[id]?.label || ''
const catColor = id => TIMELINE_CATEGORIES[id]?.color || '#9C7575'
const catIcon  = id => TIMELINE_CATEGORIES[id]?.icon || '•'
const badgeStyle = id => ({ color: catColor(id), background: catColor(id) + '1a' })

const legend = computed(() => TIMELINE_CATEGORY_ORDER.map(id => ({
  id, ...TIMELINE_CATEGORIES[id],
  count: items.value.filter(e => e.cat === id).length,
})))

const filtered = computed(() => items.value.filter(e => {
  if (!activeCats.value.has(e.cat)) return false
  if (range.value === 'next') return e.date >= today.value
  if (range.value === 'past') return e.date < today.value
  return true
}))

const groups = computed(() => {
  const map = new Map()
  filtered.value.forEach(e => {
    const [y, m] = e.date.split('-')
    const key = `${y}-${m}`
    if (!map.has(key)) map.set(key, { key, label: `${MONTHS[parseInt(m) - 1]} ${y}`, items: [] })
    map.get(key).items.push(e)
  })
  return [...map.values()]
})

// Kartu pertama yang tanggalnya hari ini / sesudahnya — penanda "Hari ini"
// ditaruh tepat sebelum dia.
const todayAnchor = computed(() => filtered.value.find(e => e.date >= today.value)?.key ?? null)

function preview(list) {
  const names = list.slice(0, 2).map(e => e.title)
  const rest  = list.length - names.length
  return names.join(', ') + (rest > 0 ? `, +${rest} lainnya` : '')
}
</script>

<style scoped>
/* ══ Hero ══ */
.tl-hero {
  position: relative;
  background: linear-gradient(135deg, var(--paper) 50%, var(--rose-soft) 165%);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 24px 24px 20px;
  margin-bottom: 18px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05), 0 14px 34px rgba(36, 8, 8, .07);
}
.tl-hero-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.tl-hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--plum);
}
.tl-hero-eyebrow {
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 2px;
}
.tl-hero-tour { flex: none; }

.tl-hero-count { display: flex; align-items: baseline; gap: 9px; margin: 16px 0 12px; flex-wrap: wrap; }
.tl-hero-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: var(--plum);
  font-variant-numeric: tabular-nums;
}
.tl-hero-unit { font-size: 14px; font-weight: 500; color: var(--muted); }

.tl-hero-progress { margin-bottom: 16px; }
.tl-hero-bar { height: 10px; background: var(--ivory); border: 1px solid var(--line); border-radius: 100px; overflow: hidden; }
.tl-hero-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--rose));
  border-radius: 100px;
  transition: width .6s cubic-bezier(.22,1,.36,1);
}
.tl-hero-ends {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
  font-size: 11.5px;
  color: var(--muted);
}
.tl-hero-line { flex: 1; height: 1px; background: var(--line); }
.tl-hero-end { color: var(--plum); font-weight: 600; }

.tl-hero-insights { display: flex; flex-direction: column; gap: 7px; }
.tl-insight {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  padding: 10px 13px;
  border-radius: 12px;
}
.tl-insight-ico { flex: none; }
.tl-insight.tone-info { background: var(--gold-soft); color: #6b4f1f; }
.tl-insight.tone-good { background: #EAF3DE; color: #2b5010; }
.tl-insight.tone-warn { background: var(--gold-soft); color: #7a5c28; }
.tl-insight.tone-bad  { background: var(--rose-soft); color: #7a1a1a; }

/* ══ Perlu Perhatian ══ */
.tl-sec-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--plum);
  margin: 0 0 10px 2px;
}
.tl-focus {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}
.tl-focus-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px 15px;
}
.tl-focus-card.is-alert { border-color: var(--rose); background: linear-gradient(180deg, var(--paper), var(--rose-soft)); }
.tl-focus-card.is-warn  { border-color: var(--gold); background: linear-gradient(180deg, var(--paper), var(--gold-soft)); }
.tl-focus-card.is-hh    { border-color: var(--plum); background: var(--plum); }
.tl-focus-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--muted);
}
.tl-focus-ico { font-size: 12px; }
.tl-focus-val {
  font-family: 'Jost', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
  margin-top: 7px;
  font-variant-numeric: tabular-nums;
}
.tl-focus-val-sm { font-size: 15px; line-height: 1.3; }
.tl-focus-sub {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 3px;
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tl-focus-card.is-hh .tl-focus-top { color: var(--gold); }
.tl-focus-card.is-hh .tl-focus-val { font-family: 'Cormorant Garamond', serif; font-size: 23px; color: var(--gold); }
.tl-focus-card.is-hh .tl-focus-sub { color: rgba(255,255,255,.72); }

/* ══ Catatan & kontrol ══ */
.tl-note {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 14px;
}
.tl-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--plum);
  font-weight: 600;
  font-size: 13px;
  font-family: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.tl-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.tl-legend { display: flex; gap: 7px; flex-wrap: wrap; }
.tl-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 100px;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: opacity .15s, background .15s, border-color .15s;
}
.tl-lg:hover { border-color: var(--gold); }
.tl-lg.off { opacity: .42; background: transparent; }
.tl-lg-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
.tl-lg-ico { font-size: 11px; }
.tl-lg-n { color: var(--muted); font-variant-numeric: tabular-nums; }

.tl-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 100px;
}
.tl-seg-btn {
  border: none;
  background: transparent;
  border-radius: 100px;
  padding: 5px 13px;
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: background .15s, color .15s;
}
.tl-seg-btn.on { background: var(--plum); color: #fff; font-weight: 600; }

/* ══ Garis waktu ══ */
.tl-rail { position: relative; padding-left: 26px; }
.tl-line { position: absolute; left: 5px; top: 8px; bottom: 22px; width: 2px; background: var(--line); }

.tl-month {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 18px 0 10px;
}
.tl-month:first-of-type { margin-top: 0; }

.tl-today { position: relative; margin: 0 0 12px -24px; padding-left: 24px; }
.tl-today-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--teal);
  background: var(--paper);
  border: 1px solid var(--teal);
  border-radius: 100px;
  padding: 3px 11px;
}

.tl-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px 15px;
  margin-bottom: 9px;
  font-family: 'Jost', sans-serif;
  transition: background .15s, border-color .15s;
}
.tl-clickable { cursor: pointer; }
.tl-clickable:hover { background: var(--ivory); border-color: var(--gold); }
/* Item terlambat sengaja NGGAK dikasih garis merah di kiri — cukup ditandai
   lewat chip status di kanan, biar semua kartu punya bentuk yang sama. */
.tl-done { opacity: .62; }
.tl-done .tl-name { text-decoration: line-through; }

.tl-dot {
  position: absolute;
  left: -25px;
  top: 18px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--ivory);
}

.tl-body { flex: 1; min-width: 0; }
.tl-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.35;
  word-break: break-word;
}
.tl-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 5px;
  font-size: 11.5px;
  color: var(--muted);
}
.tl-badge {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .02em;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}
.tl-date { color: var(--ink); font-weight: 500; }
.tl-detail {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-right { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.tl-amt {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 17px;
  color: var(--ink);
  white-space: nowrap;
}
.tl-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  white-space: nowrap;
  background: var(--ivory);
  color: var(--muted);
}
.tl-status.st-late   { background: var(--rose-soft); color: #7a1a1a; }
.tl-status.st-today  { background: var(--plum); color: #fff; }
.tl-status.st-soon   { background: var(--gold-soft); color: #7a5c28; }
.tl-status.st-done   { background: #EAF3DE; color: #2b5010; }
.tl-status.st-future { background: var(--ivory); color: var(--muted); }
.tl-status.st-past   { background: var(--ivory); color: var(--muted); }

/* Hari-H — satu-satunya kartu bergaya "tujuan akhir" */
.tl-hh {
  background: var(--plum);
  border-color: var(--plum);
  padding: 15px;
}
.tl-hh.tl-clickable:hover { background: var(--wine); border-color: var(--wine); }
.tl-hh .tl-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--gold); }
.tl-hh .tl-meta, .tl-hh .tl-detail { color: rgba(255,255,255,.7); }
.tl-hh .tl-date { color: #fff; }
.tl-hh-ico { margin-right: 7px; }

@media (max-width: 680px) {
  .tl-hero { padding: 20px 18px 16px; border-radius: 20px; }
  .tl-hero-num { font-size: 38px; }
  .tl-focus { grid-template-columns: 1fr 1fr; }
  .tl-controls { flex-direction: column; align-items: stretch; }
  .tl-seg { align-self: flex-start; }
  .tl-item { align-items: flex-start; flex-wrap: wrap; }
  .tl-right { flex-direction: row; align-items: center; justify-content: flex-start; width: 100%; gap: 8px; }
  .tl-amt { font-size: 15px; }
}
</style>
