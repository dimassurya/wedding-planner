<template>
  <div class="card bs-card">
    <div class="bs-stat-grid">
      <div class="stat a-rose">
        <div class="num">{{ fmt(totalOverdue) }}</div>
        <div class="lbl">Terlambat &middot; {{ overdue.length }} termin</div>
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

    <div v-if="!overdue.length && !groups.length && !undated.length && !unplanned.length" class="empty">
      <div class="big">Semua beres</div>
      <div>Tidak ada pembayaran yang perlu dijadwalkan.</div>
    </div>

    <!-- Terlambat -->
    <div v-if="overdue.length" class="bs-group">
      <div class="bs-group-title bs-group-title-danger">&#9888;&#65039; Terlambat</div>
      <div v-for="e in overdue" :key="e.pay.id" class="bs-row bs-row-danger" @click="$emit('open', e.item.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ payLabel(e) }}</span>
            <span v-if="store.budgetOrigin(e.item)" class="b-origin" :class="store.budgetOrigin(e.item).cls">{{ store.budgetOrigin(e.item).label }}</span>
          </div>
          <div class="bs-row-date bs-row-date-danger">{{ dateLabel(e.pay.dueDate) }}</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(e.pay.amount) }}</div>
          <button class="bs-paid-btn" @click.stop="store.togglePaymentPaid(e.pay.id, true)">Tandai Bayar</button>
        </div>
      </div>
    </div>

    <!-- Per bulan -->
    <div v-for="g in groups" :key="g.key" class="bs-group">
      <div class="bs-group-title">{{ g.label }} <span class="bs-group-sub">&middot; {{ fmt(g.total) }}</span></div>
      <div v-for="e in g.items" :key="e.pay.id" class="bs-row" :class="{ 'bs-row-warn': isSoon(e.pay.dueDate) }" @click="$emit('open', e.item.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ payLabel(e) }}</span>
            <span v-if="store.budgetOrigin(e.item)" class="b-origin" :class="store.budgetOrigin(e.item).cls">{{ store.budgetOrigin(e.item).label }}</span>
          </div>
          <div class="bs-row-date" :class="{ 'bs-row-date-warn': isSoon(e.pay.dueDate) }">{{ dateLabel(e.pay.dueDate) }}</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(e.pay.amount) }}</div>
          <button class="bs-paid-btn" @click.stop="store.togglePaymentPaid(e.pay.id, true)">Tandai Bayar</button>
        </div>
      </div>
    </div>

    <!-- Termin tanpa tanggal -->
    <div v-if="undated.length" class="bs-group">
      <div class="bs-group-title bs-group-title-muted">Termin Tanpa Tanggal</div>
      <div v-for="e in undated" :key="e.pay.id" class="bs-row bs-row-muted" @click="$emit('open', e.item.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ payLabel(e) }}</span>
            <span v-if="store.budgetOrigin(e.item)" class="b-origin" :class="store.budgetOrigin(e.item).cls">{{ store.budgetOrigin(e.item).label }}</span>
          </div>
          <div class="bs-row-date bs-row-date-muted">Klik untuk atur jatuh tempo</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(e.pay.amount) }}</div>
          <button class="bs-paid-btn" @click.stop="store.togglePaymentPaid(e.pay.id, true)">Tandai Bayar</button>
        </div>
      </div>
    </div>

    <!-- Bagian tagihan yang belum ketutup satupun termin (item tanpa
         termin sama sekali, ATAU sisa yang nggak ketutup termin yang
         udah ada) — biar totalnya selalu pas sama "Total belum lunas". -->
    <div v-if="unplanned.length" class="bs-group">
      <div class="bs-group-title bs-group-title-muted">Belum Direncanakan</div>
      <div v-for="e in unplanned" :key="e.b.id" class="bs-row bs-row-muted" @click="$emit('open', e.b.id)">
        <div class="bs-row-info">
          <div class="bs-row-name-line">
            <span class="bs-row-name">{{ e.b.item || 'Tanpa nama' }}</span>
            <span v-if="store.budgetOrigin(e.b)" class="b-origin" :class="store.budgetOrigin(e.b).cls">{{ store.budgetOrigin(e.b).label }}</span>
          </div>
          <div class="bs-row-date bs-row-date-muted">{{ e.full ? 'Klik untuk tambah rencana pembayaran' : 'Sisa belum ketutup termin — klik untuk lengkapi' }}</div>
        </div>
        <div class="bs-row-right">
          <div class="bs-row-amt">{{ fmt(e.gap) }}</div>
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

const itemById = id => store.budget.find(b => b.id === id)

function payLabel(e) {
  const name = e.item.item || 'Tanpa nama'
  return e.pay.note ? `${name} · ${e.pay.note}` : name
}

// Semua termin belum-lunas, di-enrich dengan item induknya (skip yang yatim).
const unpaid = computed(() =>
  store.payments
    .filter(p => !p.paid)
    .map(p => ({ pay: p, item: itemById(p.budgetItemId) }))
    .filter(e => e.item)
)

const dated   = computed(() => unpaid.value.filter(e => e.pay.dueDate))
const undated = computed(() => unpaid.value.filter(e => !e.pay.dueDate))

const overdue  = computed(() => dated.value.filter(e => daysLeft(e.pay.dueDate) < 0).sort((a, b) => a.pay.dueDate.localeCompare(b.pay.dueDate)))
const upcoming = computed(() => dated.value.filter(e => daysLeft(e.pay.dueDate) >= 0))

const isSoon = d => d && daysLeft(d) >= 0 && daysLeft(d) <= 7

const groups = computed(() => {
  const map = new Map()
  upcoming.value.slice().sort((a, b) => a.pay.dueDate.localeCompare(b.pay.dueDate)).forEach(e => {
    const [y, m] = e.pay.dueDate.split('-')
    const key = `${y}-${m}`
    if (!map.has(key)) map.set(key, { key, label: `${MONTHS[parseInt(m) - 1]} ${y}`, items: [], total: 0 })
    const g = map.get(key)
    g.items.push(e)
    g.total += e.pay.amount || 0
  })
  return [...map.values()]
})

// Bagian tagihan yang belum ketutup satupun termin belum-lunas. gap =
// sisa item dikurangi total termin belum-lunas yang udah dibuat — kalau
// item belum punya termin sama sekali, gap = seluruh sisa (full: true).
// Ini yang bikin totalAll (dihitung dari bSisa per item) selalu sama
// persis dengan jumlah semua baris yang keliatan di bawah — nggak ada
// lagi duit yang "ilang" pas termin cuma nutup sebagian dari tagihan.
const unplanned = computed(() =>
  store.budget
    .map(b => {
      const sisa = store.bSisa(b)
      if (sisa <= 0) return null
      const openSum = store.itemPayments(b.id)
        .filter(p => !p.paid)
        .reduce((s, p) => s + (p.amount || 0), 0)
      const gap = sisa - openSum
      return gap > 0.5 ? { b, gap, full: openSum <= 0.5 } : null
    })
    .filter(Boolean)
)

const totalOverdue = computed(() => overdue.value.reduce((s, e) => s + (e.pay.amount || 0), 0))
const totalSoon    = computed(() => dated.value.filter(e => daysLeft(e.pay.dueDate) <= 30).reduce((s, e) => s + (e.pay.amount || 0), 0))
const totalAll     = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))

function dateLabel(due) {
  const d = daysLeft(due)
  const dateStr = fmtDate(due)
  if (d < 0) return `${dateStr} · telat ${-d} hari`
  if (d === 0) return `${dateStr} · jatuh tempo hari ini`
  return `${dateStr} · ${d} hari lagi`
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
