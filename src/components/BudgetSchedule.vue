<template>
  <div class="card bs-card">
    <div class="bs-stat-grid">
      <div class="stat a-rose">
        <div class="num">{{ fmt(totalOverdue) }}</div>
        <div class="lbl">Terlambat &middot; {{ overdue.length }} item</div>
      </div>
      <div class="stat a-gold">
        <div class="num">{{ fmt(totalSoon) }}</div>
        <div class="lbl">Jatuh tempo &le;30 hari</div>
      </div>
      <div class="stat a-teal">
        <div class="num">{{ fmt(totalAll) }}</div>
        <div class="lbl">Total belum lunas</div>
      </div>
    </div>

    <div v-if="!overdue.length && !groups.length && !unscheduled.length" class="empty">
      <div class="big">Semua beres</div>
      <div>Tidak ada tagihan yang perlu dijadwalkan.</div>
    </div>

    <div v-if="overdue.length" class="bs-group">
      <div class="bs-group-title bs-group-title-danger">&#9888;&#65039; Terlambat</div>
      <div v-for="b in overdue" :key="b.id" class="bs-row bs-row-danger" @click="$emit('open', b.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ b.item || 'Tanpa nama' }}</span>
            <span v-if="store.budgetOrigin(b)" class="b-origin" :class="store.budgetOrigin(b).cls">{{ store.budgetOrigin(b).label }}</span>
          </div>
          <div class="bs-row-date bs-row-date-danger">{{ dateLabel(b) }}</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(dueAmount(b)) }}</div>
          <button class="bs-paid-btn" @click.stop="markPaid(b)">Tandai Lunas</button>
        </div>
      </div>
    </div>

    <div v-for="g in groups" :key="g.key" class="bs-group">
      <div class="bs-group-title">{{ g.label }} <span class="bs-group-sub">&middot; {{ fmt(g.total) }}</span></div>
      <div v-for="b in g.items" :key="b.id" class="bs-row" :class="{ 'bs-row-warn': isSoon(b) }" @click="$emit('open', b.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ b.item || 'Tanpa nama' }}</span>
            <span v-if="store.budgetOrigin(b)" class="b-origin" :class="store.budgetOrigin(b).cls">{{ store.budgetOrigin(b).label }}</span>
          </div>
          <div class="bs-row-date" :class="{ 'bs-row-date-warn': isSoon(b) }">{{ dateLabel(b) }}</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(dueAmount(b)) }}</div>
          <button class="bs-paid-btn" @click.stop="markPaid(b)">Tandai Lunas</button>
        </div>
      </div>
    </div>

    <div v-if="unscheduled.length" class="bs-group">
      <div class="bs-group-title bs-group-title-muted">Belum Ada Tanggal</div>
      <div v-for="b in unscheduled" :key="b.id" class="bs-row bs-row-muted" @click="$emit('open', b.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ b.item || 'Tanpa nama' }}</span>
            <span v-if="store.budgetOrigin(b)" class="b-origin" :class="store.budgetOrigin(b).cls">{{ store.budgetOrigin(b).label }}</span>
          </div>
          <div class="bs-row-date bs-row-date-muted">Klik untuk atur jatuh tempo</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(dueAmount(b)) }}</div>
          <button class="bs-paid-btn" @click.stop="markPaid(b)">Tandai Lunas</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate, daysLeft } from '../utils/index'

defineEmits(['open'])

const store = useWeddingStore()

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

// Belum lunas & masih ada tagihan (Aktual belum diisi -> pakai Estimasi
// sebagai perkiraan, biar item yang masih tahap nego pun kelihatan).
function dueAmount(b) {
  return b.aktual > 0 ? store.bSisa(b) : (b.estimasi || 0)
}

const pending = computed(() =>
  store.budget.filter(b => store.bStatus(b).key !== 'lunas' && dueAmount(b) > 0)
)

const scheduled   = computed(() => pending.value.filter(b => b.jatuhTempo).sort((a, b) => a.jatuhTempo.localeCompare(b.jatuhTempo)))
const unscheduled = computed(() => pending.value.filter(b => !b.jatuhTempo))

const overdue  = computed(() => scheduled.value.filter(b => daysLeft(b.jatuhTempo) < 0))
const upcoming = computed(() => scheduled.value.filter(b => daysLeft(b.jatuhTempo) >= 0))

const isSoon = b => b.jatuhTempo && daysLeft(b.jatuhTempo) >= 0 && daysLeft(b.jatuhTempo) <= 7

const groups = computed(() => {
  const map = new Map()
  upcoming.value.forEach(b => {
    const [y, m] = b.jatuhTempo.split('-')
    const key = `${y}-${m}`
    if (!map.has(key)) map.set(key, { key, label: `${MONTHS[parseInt(m) - 1]} ${y}`, items: [], total: 0 })
    const g = map.get(key)
    g.items.push(b)
    g.total += dueAmount(b)
  })
  return [...map.values()]
})

const totalOverdue = computed(() => overdue.value.reduce((s, b) => s + dueAmount(b), 0))
const totalSoon    = computed(() => scheduled.value.filter(b => daysLeft(b.jatuhTempo) <= 30).reduce((s, b) => s + dueAmount(b), 0))
const totalAll     = computed(() => pending.value.reduce((s, b) => s + dueAmount(b), 0))

function dateLabel(b) {
  const d = daysLeft(b.jatuhTempo)
  const dateStr = fmtDate(b.jatuhTempo)
  if (d < 0) return `${dateStr} · telat ${-d} hari`
  if (d === 0) return `${dateStr} · jatuh tempo hari ini`
  return `${dateStr} · ${d} hari lagi`
}

function markPaid(b) {
  if (b.aktual > 0) {
    b.dibayar = b.aktual
  } else {
    b.aktual = b.estimasi
    b.dibayar = b.estimasi
  }
  store.saveB()
}
</script>

<style scoped>
.bs-card { padding: 18px 20px 6px; }

.bs-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
@media (max-width: 650px) { .bs-stat-grid { grid-template-columns: 1fr; gap: 8px; } }

.bs-group { margin-bottom: 22px; }
.bs-group-title {
  font-family: 'Jost', sans-serif;
  font-weight: 700;
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--muted);
  margin-bottom: 10px;
  padding-left: 2px;
}
.bs-group-title-danger { color: var(--rose); }
.bs-group-title-muted  { color: var(--muted); }
.bs-group-sub { text-transform: none; letter-spacing: 0; font-weight: 500; }

.bs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.bs-row:hover { background: var(--ivory); }
.bs-row-danger { border-left-color: var(--rose); }
.bs-row-warn   { border-left-color: var(--gold); }
.bs-row-muted  { opacity: .8; }

.bs-row-info { flex: 1; min-width: 160px; }
.bs-row-name-line { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.bs-row-name { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--ink); }
.b-origin { margin-top: 0; }

.bs-row-date { font-size: 12.5px; color: var(--muted); margin-top: 3px; }
.bs-row-date-danger { color: var(--rose); font-weight: 600; }
.bs-row-date-warn   { color: #7a5c28; font-weight: 600; }
.bs-row-date-muted  { font-style: italic; }

.bs-row-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: auto; }
.bs-row-amt { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 19px; color: var(--ink); white-space: nowrap; }

.bs-paid-btn {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--plum);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 100px;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s, border-color .15s;
}
.bs-paid-btn:hover { background: var(--gold-soft); border-color: var(--gold); }

@media (max-width: 560px) {
  .bs-row-right { width: 100%; justify-content: space-between; margin-left: 0; }
}
</style>
