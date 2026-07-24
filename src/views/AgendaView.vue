<template>
  <section class="panel active" id="panel-agenda">
    <div class="ag-intro">
      <div class="ag-intro-title">Agenda</div>
      <div class="ag-intro-sub">
        Semua yang bertanggal dalam satu garis waktu. Tugas diatur di
        <button class="ag-link" @click="store.activeTab = 'checklist'">Checklist</button>, pembayaran di
        <button class="ag-link" @click="store.activeTab = 'budget'">Budget</button> — di sini kamu cuma lihat urutannya.
      </div>
    </div>

    <div class="ag-legend">
      <span class="ag-lg"><span class="ag-dot" style="background: var(--gold)"></span> Tugas</span>
      <span class="ag-lg"><span class="ag-dot" style="background: var(--rose)"></span> Bayar</span>
      <span class="ag-lg"><span class="ag-dot" style="background: var(--plum)"></span> Hari-H</span>
    </div>

    <div v-if="!groups.length" class="card"><div class="empty">
      <div class="big">Belum ada agenda</div>
      <div>Isi jatuh tempo di Budget atau deadline tugas di Checklist — nanti muncul di sini urut waktu.</div>
    </div></div>

    <div v-else class="ag-rail">
      <div class="ag-line"></div>

      <template v-for="g in groups" :key="g.key">
        <div class="ag-month">{{ g.label }}</div>
        <template v-for="e in g.items" :key="e.key">
        <div v-if="e.key === firstFutureKey" class="ag-today">
          <span class="ag-today-lbl">Hari ini &middot; {{ todayShort }}</span>
        </div>
        <div
          class="ag-item"
          :class="{ 'ag-late': e.late, 'ag-hh': e.type === 'hh', 'ag-done': e.done }"
          @click="onClick(e)"
        >
          <span class="ag-dot-lg" :style="{ background: e.color }"></span>
          <div class="ag-body">
            <div class="ag-name-line">
              <i v-if="e.type === 'hh'" class="ag-hh-ico">&#9829;</i>
              <span class="ag-name">{{ e.name }}</span>
              <span v-if="e.tag" class="ag-tag" :class="e.tagCls">{{ e.tag }}</span>
            </div>
            <div class="ag-when" :class="{ 'ag-when-late': e.late }">{{ e.whenLabel }}</div>
          </div>
          <div v-if="e.amount" class="ag-amt">{{ fmt(e.amount) }}</div>
          <button
            v-if="e.action"
            class="ag-act"
            :class="{ 'ag-act-done': e.done }"
            @click.stop="e.action()"
            :title="e.actionTip"
          >{{ e.done ? '✓' : e.actionLabel }}</button>
        </div>
        </template>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate, daysLeft } from '../utils/index'

const store = useWeddingStore()

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const today = todayISO()
const todayShort = computed(() => {
  const [, m, d] = today.split('-')
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m)-1]}`
})

function whenLabel(date) {
  const d = daysLeft(date)
  const s = fmtDate(date)
  if (d < 0) return `${s} · telat ${-d} hari`
  if (d === 0) return `${s} · hari ini`
  if (d === 1) return `${s} · besok`
  return `${s} · ${d} hari lagi`
}

// ── Kumpulkan semua entry bertanggal ──────────────────────────────
const entries = computed(() => {
  const list = []

  // Pembayaran dari Budget (yang punya jatuh tempo & belum lunas)
  store.budget.forEach(b => {
    if (!b.jatuhTempo) return
    const paid = store.bStatus(b).key === 'lunas'
    const amt = b.aktual > 0 ? store.bSisa(b) : (b.estimasi || 0)
    if (paid && amt <= 0 && daysLeft(b.jatuhTempo) < 0) return  // lunas & lewat: sembunyikan
    list.push({
      key: 'b' + b.id, type: 'bayar', date: b.jatuhTempo,
      name: 'Bayar: ' + (b.item || 'tanpa nama'),
      color: 'var(--rose)', tag: 'BUDGET', tagCls: 'ag-tag-budget',
      amount: paid ? 0 : amt, done: paid,
      late: !paid && daysLeft(b.jatuhTempo) < 0,
      goto: 'budget',
      actionLabel: 'Lunas', actionTip: 'Tandai lunas',
      action: paid ? null : () => markPaid(b),
    })
  })

  // Tugas dari Timeline lama (punya deadline sendiri) — dipertahankan biar
  // data & seed yang sudah ada tetap tampil setelah tab Timeline jadi Agenda.
  store.timeline.forEach(t => {
    if (!t.deadline) return
    const done = t.status === 'selesai'
    list.push({
      key: 't' + t.id, type: 'tugas', date: t.deadline,
      name: t.tugas || 'tugas',
      color: 'var(--gold)', tag: 'TIMELINE', tagCls: 'ag-tag-ck',
      done,
      late: !done && daysLeft(t.deadline) < 0,
      goto: null,
      actionLabel: 'Selesai', actionTip: 'Tandai selesai',
      action: () => toggleTimeline(t),
    })
  })

  // Tugas dari Checklist (yang dikasih deadline)
  store.checklist.forEach(grp => {
    (grp.items || []).forEach(it => {
      if (!it.deadline) return
      list.push({
        key: 'c' + it.id, type: 'tugas', date: it.deadline,
        name: it.tugas || 'tugas',
        color: 'var(--gold)', tag: grp.fase || 'CHECKLIST', tagCls: 'ag-tag-ck',
        done: !!it.status,
        late: !it.status && daysLeft(it.deadline) < 0,
        goto: 'checklist',
        actionLabel: 'Selesai', actionTip: 'Tandai selesai',
        action: () => toggleTask(it),
      })
    })
  })

  // Hari-H
  if (store.couple?.tanggal) {
    list.push({
      key: 'hh', type: 'hh', date: store.couple.tanggal,
      name: 'Hari-H', color: 'var(--plum)',
      whenOverride: fmtDate(store.couple.tanggal),
    })
  }

  return list
    .map(e => ({ ...e, whenLabel: e.whenOverride || whenLabel(e.date) }))
    .sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0))
})

const groups = computed(() => {
  const map = new Map()
  entries.value.forEach(e => {
    const [y, m] = e.date.split('-')
    const key = `${y}-${m}`
    if (!map.has(key)) map.set(key, { key, label: `${MONTHS[parseInt(m)-1]} ${y}`, items: [] })
    map.get(key).items.push(e)
  })
  return [...map.values()]
})

const firstFutureKey = computed(() => entries.value.find(e => e.date >= today)?.key ?? null)

function markPaid(b) {
  // Lunasi termin terdekat lewat buku pembayaran (bukan set dibayar langsung).
  if ((b.aktual || 0) <= 0 && b.estimasi > 0) { b.aktual = b.estimasi; store.saveB() }
  store.payNextDue(b.id)
}

function toggleTask(it) {
  it.status = !it.status
  store.saveCK()
}

function toggleTimeline(t) {
  const done = t.status === 'selesai'
  t.status = done ? 'belum' : 'selesai'
  if (!done && !t.tanggalSelesai) t.tanggalSelesai = today
  store.saveTL()
}

function onClick(e) {
  if (e.goto) store.activeTab = e.goto
}
</script>

<style scoped>
.ag-intro { margin-bottom: 14px; }
.ag-intro-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--plum); }
.ag-intro-sub { font-size: 13px; color: var(--muted); line-height: 1.5; margin-top: 2px; }
.ag-link { background: none; border: none; padding: 0; color: var(--plum); font-weight: 600; cursor: pointer; font-size: 13px; text-decoration: underline; font-family: inherit; }

.ag-legend { display: flex; gap: 16px; font-size: 12px; color: var(--ink); margin-bottom: 18px; flex-wrap: wrap; }
.ag-lg { display: inline-flex; align-items: center; gap: 6px; }
.ag-dot { width: 9px; height: 9px; border-radius: 50%; }

.ag-rail { position: relative; padding-left: 26px; }
.ag-line { position: absolute; left: 5px; top: 6px; bottom: 20px; width: 2px; background: var(--line); }

.ag-today { position: relative; margin: 0 0 14px -24px; padding-left: 24px; }
.ag-today-lbl { font-size: 11px; font-weight: 600; color: var(--teal); background: var(--paper); border: 1px solid var(--teal); border-radius: 100px; padding: 2px 10px; }

.ag-month { font-size: 11.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); margin: 16px 0 10px; }
.ag-month:first-of-type { margin-top: 0; }

.ag-item {
  position: relative;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: var(--paper); border: 1px solid var(--line); border-radius: 12px;
  padding: 11px 14px; margin-bottom: 9px; cursor: pointer;
  transition: background .15s;
}
.ag-item:hover { background: var(--ivory); }
.ag-late { border-left: 3px solid var(--rose); }
.ag-done { opacity: .6; }
.ag-done .ag-name { text-decoration: line-through; }
.ag-hh { background: var(--plum); border-color: var(--plum); }
.ag-hh:hover { background: var(--wine); }

.ag-dot-lg { position: absolute; left: -25px; top: 16px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--ivory); }

.ag-body { flex: 1; min-width: 140px; }
.ag-name-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ag-name { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--ink); }
.ag-hh .ag-name { font-family: 'Cormorant Garamond', serif; font-size: 19px; color: var(--gold); }
.ag-hh-ico { color: var(--gold); font-size: 16px; font-style: normal; }
.ag-tag { font-size: 10px; font-weight: 700; letter-spacing: .03em; padding: 2px 6px; border-radius: 5px; text-transform: uppercase; }
.ag-tag-budget { color: #7a1a1a; background: var(--rose-soft); }
.ag-tag-ck { color: #7a5c28; background: var(--gold-soft); }

.ag-when { font-size: 12px; color: var(--muted); margin-top: 3px; }
.ag-hh .ag-when { color: var(--ivory); }
.ag-when-late { color: var(--rose); font-weight: 600; }

.ag-amt { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 18px; color: var(--ink); white-space: nowrap; }

.ag-act {
  flex: none; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
  color: var(--plum); background: var(--paper); border: 1.5px solid var(--line);
  border-radius: 100px; padding: 6px 12px; cursor: pointer; white-space: nowrap;
  transition: background .15s, border-color .15s;
}
.ag-act:hover { background: var(--gold-soft); border-color: var(--gold); }
.ag-act-done { color: var(--green); border-color: var(--green); }

@media (max-width: 560px) {
  .ag-amt { margin-left: auto; }
}
</style>
