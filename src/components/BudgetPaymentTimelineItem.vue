<template>
  <div class="bpt-item" :class="{ done: payment.paid }">
    <button
      class="bpt-check" :class="{ on: payment.paid, static: !editable }"
      :disabled="!editable"
      @click="onToggleClick"
      :title="editable ? (payment.paid ? 'Tandai belum dibayar' : 'Tandai sudah dibayar') : undefined"
    >
      <svg v-if="payment.paid" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <div class="bpt-body">
      <div class="bpt-line1">
        <input v-if="editable" class="bpt-title-input" type="text" :value="payment.note"
          :placeholder="payment.paid ? 'Keterangan (mis. DP)' : 'Nama termin (mis. Pelunasan)'" @input="onNote">
        <span v-else class="bpt-title">{{ payment.note || 'Termin' }}</span>
      </div>

      <div class="bpt-line2">
        <span class="bpt-chip" :class="statusInfo.cls">{{ statusInfo.label }}</span>
        <span class="bpt-sep">&middot;</span>
        <input v-if="editable" class="bpt-date-inline" type="date"
          :value="payment.paid ? payment.paidDate : payment.dueDate" @change="onDate">
        <span v-else class="bpt-meta-text">{{ dateText }}</span>
        <template v-if="sourceBadge">
          <span class="bpt-sep">&middot;</span>
          <span class="bpt-chip bpt-chip-source" :class="sourceBadge.cls">{{ sourceBadge.label }}</span>
        </template>
        <template v-if="editable">
          <span class="bpt-sep">&middot;</span>
          <input class="bpt-paidby-inline" type="text" list="pay-by-opts" :value="payment.paidBy" placeholder="dibayar oleh..." @input="onBy">
        </template>
      </div>
    </div>

    <div v-if="!editable" class="bpt-amt">{{ fmt(payment.amount) }}</div>
    <div v-else class="bpt-amt-edit"><span class="bpt-rp">Rp</span>
      <input type="text" inputmode="numeric" :value="grp(payment.amount)" @input="onAmt">
    </div>

    <button v-if="editable" class="bpt-del" @click="onDelete" title="Hapus termin">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, num, fmt, fmtDate, daysLeft } from '../utils/index'

// Satu baris "payment record" compact dalam daftar Termin & Pembayaran —
// dipakai di BudgetDetailModal.vue (mode penuh, `editable=true`) dan
// preview termin di BudgetTab.vue (mode ringkas read-only,
// `editable=false`). 2 baris per termin: nama + nominal, lalu status/
// tanggal/sumber dana sebagai metadata kecil di baris kedua — bukan
// mini-card, biar tetap padat & gampang dipindai sekali lihat.
// Field edit (catatan/nominal/tanggal/dibayar-oleh) & hapus termin
// ditangani LANGSUNG di sini lewat store, sama persis kayak sebelumnya.
// `toggle-paid` sengaja di-emit ke parent (bukan ditangani sendiri) karena
// keputusan "Sumber Pembayaran" (Wedding Fund / dana luar) butuh konteks
// nama item Budget yang cuma dipunya parent (BudgetDetailModal.vue).
const props = defineProps({
  payment:  { type: Object, required: true },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['toggle-paid'])

const store = useWeddingStore()

const overdue = computed(() => !!(props.payment.dueDate && daysLeft(props.payment.dueDate) < 0))

const statusInfo = computed(() => {
  if (props.payment.paid) return { label: 'Lunas', cls: 'st-lunas' }
  if (props.payment.dueDate) return { label: 'Jatuh Tempo', cls: overdue.value ? 'st-overdue' : 'st-due' }
  return { label: 'Belum Dibayar', cls: 'st-belum' }
})

// Cuma dipakai mode read-only — mode editable nampilin <input type="date">
// langsung sebagai metadata-nya, nggak perlu teks deskriptif lagi.
const dateText = computed(() => {
  const p = props.payment
  if (p.paid) return p.paidDate ? `Lunas ${fmtDate(p.paidDate)}` : 'Lunas'
  if (p.dueDate) {
    const d = daysLeft(p.dueDate)
    if (d < 0) return `${fmtDate(p.dueDate)} · telat ${-d} hari`
    if (d === 0) return `${fmtDate(p.dueDate)} · hari ini`
    return `${fmtDate(p.dueDate)} · ${d} hari lagi`
  }
  return 'Belum ada tanggal'
})

// Cuma berarti kalau sudah lunas — sebelum dibayar, belum ada "sumber"
// buat ditampilkan.
const sourceBadge = computed(() => {
  if (!props.payment.paid) return null
  if (store.fundTxForPayment(props.payment.id)) return { label: '🔗 Wedding Fund', cls: 'src-fund' }
  return { label: 'Dana luar', cls: 'src-external' }
})

function onToggleClick() {
  if (!props.editable) return
  emit('toggle-paid')
}

function onNote(e) { props.payment.note = e.target.value; store.saveP() }
function onBy(e)   { props.payment.paidBy = e.target.value; store.saveP() }

function onAmt(e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  props.payment.amount = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveP()
  store.recalcDibayar(props.payment.budgetItemId)
}

function onDate(e) {
  const v = e.target.value || null
  if (props.payment.paid) props.payment.paidDate = v
  else props.payment.dueDate = v
  store.saveP()
  store.recalcDibayar(props.payment.budgetItemId)
}

function onDelete() { store.delPayment(props.payment.id) }
</script>

<style scoped>
.bpt-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 2px;
  min-height: 40px;
}
.bpt-item + .bpt-item { border-top: 1px solid var(--line); }

.bpt-check {
  flex: none; width: 18px; height: 18px;
  border-radius: 50%; border: 1.5px solid var(--line); background: var(--paper);
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: .15s;
  padding: 0;
}
.bpt-check.on { background: var(--green); border-color: var(--green); }
.bpt-check.static { cursor: default; }
.bpt-check:disabled { cursor: default; }
.bpt-check svg { width: 10px; height: 10px; }

.bpt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 1px; }

.bpt-line1 { display: flex; align-items: center; }
.bpt-title-input {
  width: 100%; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink);
  border: none; border-bottom: 1px solid transparent; background: transparent; padding: 1px 0;
}
.bpt-title-input:focus { outline: none; border-bottom-color: var(--gold); }
.bpt-title { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bpt-line2 { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; line-height: 1.3; }
.bpt-sep { color: var(--line); font-size: 10px; }
.bpt-meta-text { font-size: 11px; color: var(--muted); white-space: nowrap; }

.bpt-chip { flex: none; font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 100px; white-space: nowrap; line-height: 1.5; }
.st-lunas   { color: #2b5010; background: #EAF3DE; }
.st-due     { color: #7a5c28; background: var(--gold-soft); }
.st-overdue { color: #7a1a1a; background: var(--rose-soft); }
.st-belum   { color: var(--muted); background: var(--ivory); }

.bpt-chip-source.src-fund     { color: #7a5c28; background: var(--gold-soft); }
.bpt-chip-source.src-external { color: var(--muted); background: var(--ivory); }

.bpt-date-inline {
  font-family: inherit; font-size: 11px; color: var(--muted); white-space: nowrap;
  border: none; background: transparent; padding: 0; max-width: 108px; cursor: pointer;
}
.bpt-date-inline:hover, .bpt-date-inline:focus { color: var(--ink); outline: none; }

.bpt-paidby-inline {
  flex: 1; min-width: 60px; max-width: 110px; font-family: 'Jost', sans-serif; font-size: 11px; color: var(--muted);
  border: none; background: transparent; padding: 0;
}
.bpt-paidby-inline::placeholder { color: var(--muted); }
.bpt-paidby-inline:hover, .bpt-paidby-inline:focus { color: var(--ink); outline: none; }

.bpt-amt {
  flex: none; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px; color: var(--ink);
  white-space: nowrap; font-variant-numeric: tabular-nums;
}

.bpt-amt-edit { flex: none; position: relative; width: 104px; }
.bpt-rp { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 10.5px; color: var(--muted); pointer-events: none; }
.bpt-amt-edit input {
  width: 100%; box-sizing: border-box; text-align: right; font-variant-numeric: tabular-nums;
  font-size: 12.5px; color: var(--ink); border: 1px solid var(--line); background: #fff;
  border-radius: 7px; padding: 4px 7px 4px 24px;
}
.bpt-amt-edit input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-soft); }

.bpt-del {
  flex: none; width: 22px; height: 22px; border: none; background: transparent;
  color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; transition: .15s;
}
.bpt-del:hover { background: var(--rose-soft); color: var(--rose); }
.bpt-del svg { width: 13px; height: 13px; }

.bpt-item.done .bpt-title,
.bpt-item.done .bpt-title-input { color: var(--muted); }
</style>
