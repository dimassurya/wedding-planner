<template>
  <div class="bpt-item" :class="{ done: payment.paid, editable }">
    <span class="bpt-check" :class="{ on: payment.paid }" :aria-label="payment.paid ? 'Lunas' : 'Belum dibayar'">
      <svg v-if="payment.paid" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </span>

    <div class="bpt-body">
      <div class="bpt-line1">
        <input v-if="editable" class="bpt-title-input" type="text" :value="payment.note"
          :placeholder="payment.paid ? 'cth: DP' : 'cth: DP, Pelunasan'" @input="onNote">
        <span v-else class="bpt-title">{{ payment.note || 'Termin' }}</span>
      </div>

      <!-- Belum dibayar: cuma field rencana (tanggal jatuh tempo). "Dibayar
           oleh"/"Catatan pembayaran" itu properti dari PERISTIWA bayar,
           bukan dari rencana termin — makanya ditunda sampai tombol Bayar
           diklik, biar nggak nanya hal yang sama 2x (inline + dialog). -->
      <div v-if="!payment.paid" class="bpt-line2">
        <span class="bpt-chip" :class="statusInfo.cls">{{ statusInfo.label }}</span>
        <span class="bpt-sep">&middot;</span>
        <input v-if="editable" class="bpt-date-inline" type="date" :value="payment.dueDate" @change="onDate">
        <span v-else class="bpt-meta-text">{{ dateText }}</span>
      </div>

      <!-- Sudah dibayar: ringkasan read-only. Klik buat buka lagi dialog
           pembayaran kalau mau koreksi tanggal/dibayar-oleh/catatan/sumber
           dana — dialog itu satu-satunya tempat field-field itu diedit. -->
      <div v-else class="bpt-line2 bpt-line2-paid" :class="{ clickable: editable }"
        :role="editable ? 'button' : undefined" :tabindex="editable ? 0 : undefined"
        @click="onEditPayment" @keydown.enter="onEditPayment" @keydown.space.prevent="onEditPayment">
        <span class="bpt-chip" :class="statusInfo.cls">{{ statusInfo.label }}</span>
        <span class="bpt-sep">&middot;</span>
        <span class="bpt-meta-text">{{ dateText }}</span>
        <template v-if="payment.paidBy">
          <span class="bpt-sep">&middot;</span>
          <span class="bpt-meta-text">oleh {{ payment.paidBy }}</span>
        </template>
        <template v-if="sourceBadge">
          <span class="bpt-sep">&middot;</span>
          <span class="bpt-chip bpt-chip-source" :class="sourceBadge.cls">{{ sourceBadge.label }}</span>
        </template>
        <svg v-if="editable" class="bpt-edit-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>

      <span v-if="!editable && payment.remarks" class="bpt-remarks-text">{{ payment.remarks }}</span>
    </div>

    <!-- Read-only (preview di tab Budget): nominal tetap sejajar, muat. -->
    <div v-if="!editable" class="bpt-amt">{{ fmt(payment.amount) }}</div>

    <button v-if="editable" class="bpt-del" @click="onDelete" title="Hapus termin">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
    </button>

    <!-- Mode editable: nominal + tombol aksi dapat BARIS SENDIRI di bawah.
         Sejajar sama nama/chip bikin kolom teks kesisa cuma puluhan piksel
         di lebar HP — chip status nggak bisa menyusut, jadi meluber &
         tumpang-tindih sama input nominal. -->
    <div v-if="editable" class="bpt-actions">
      <label class="bpt-amt-edit">
        <span class="bpt-rp">Rp</span>
        <input type="text" inputmode="numeric" :value="grp(payment.amount)" @input="onAmt" aria-label="Nominal termin">
      </label>
      <button v-if="!payment.paid" class="bpt-pay" @click="onPaymentAction">Bayar</button>
      <button v-else class="bpt-revert" @click="onPaymentAction">Batalkan</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, num, fmt, fmtDate, daysLeft } from '../utils/index'

// Satu baris "payment record" compact dalam daftar Termin & Pembayaran —
// dipakai di BudgetDetailModal.vue (mode penuh, `editable=true`) dan
// preview termin di BudgetTab.vue (mode ringkas read-only,
// `editable=false`).
//
// Field dipisah berdasarkan KAPAN relevan: sebelum dibayar cuma nama +
// nominal + tanggal jatuh tempo (rencana) yang bisa diedit di sini.
// "Dibayar oleh", "Catatan pembayaran", dan "Sumber dana" itu properti
// dari PERISTIWA bayar — cuma diisi lewat dialog pembayaran di parent
// (tombol "Bayar" utk termin baru, atau klik ringkasan pas udah lunas utk
// koreksi) biar nggak ada 2 tempat yang nanya hal yang sama.
const props = defineProps({
  payment:  { type: Object, required: true },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['payment-action', 'edit-payment'])

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

function onPaymentAction() {
  if (!props.editable) return
  emit('payment-action')
}

// Klik ringkasan termin yang udah lunas → buka lagi dialog pembayaran di
// parent buat koreksi tanggal/dibayar-oleh/catatan/sumber dana.
function onEditPayment() {
  if (!props.editable || !props.payment.paid) return
  emit('edit-payment')
}

function onNote(e) { props.payment.note = e.target.value; store.saveP() }

function onAmt(e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  props.payment.amount = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveP()
  store.recalcDibayar(props.payment.budgetItemId)
}

// Cuma dipakai buat termin yang belum dibayar (tanggal jatuh tempo/rencana)
// — tanggal beneran dibayar diedit lewat dialog pembayaran, bukan di sini.
// recalcDibayar tetap dipanggil: b.jatuhTempo itu cache "termin belum-lunas
// terdekat", jadi ngedit dueDate di sini ikut mempengaruhi cache itu.
function onDate(e) {
  props.payment.dueDate = e.target.value || null
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

/* ── Mode editable (modal Detail Item) — layout 2 baris ──
   Baris 1: [✓] nama termin ............... [hapus]
   Baris 2: [Rp nominal ........] [Bayar]
   Dulu semuanya sejajar 1 baris: 4 elemen lebar-tetap (check 18 + nominal
   104 + tombol + hapus 22 + gap) makan ~228px dari lebar modal, jadi di
   HP kolom nama cuma kesisa puluhan piksel dan chip status (flex:none,
   nowrap) meluber nabrak input nominal. */
.bpt-item.editable {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 22px;
  grid-template-areas:
    "check body del"
    "acts  acts acts";
  column-gap: 8px;
  row-gap: 10px;
  align-items: center;
  padding: 12px 2px;
}
.bpt-item.editable .bpt-check { grid-area: check; }
.bpt-item.editable .bpt-body  { grid-area: body; }
.bpt-item.editable .bpt-del   { grid-area: del; }

.bpt-actions { grid-area: acts; display: flex; align-items: center; gap: 8px; }
/* Input nominal jadi lega (dulu dipatok 104px), tombol tetap seukuran teks. */
.bpt-actions .bpt-amt-edit { flex: 1 1 auto; width: auto; max-width: 220px; }
.bpt-actions .bpt-pay,
.bpt-actions .bpt-revert { flex: none; }

.bpt-check {
  flex: none; width: 18px; height: 18px;
  border-radius: 50%; border: 1.5px solid var(--line); background: var(--paper);
  display: flex; align-items: center; justify-content: center;
}
.bpt-check.on { background: var(--green); border-color: var(--green); }
.bpt-check svg { width: 10px; height: 10px; }

.bpt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 5px; }

.bpt-line1 { display: flex; align-items: center; }
/* Garis bawah SELALU kelihatan (dulu transparan, cuma nongol saat focus) —
   tanpa itu nama termin kebaca kayak teks biasa, bukan field yang bisa
   diisi. Ketebalan saat focus dinaikin lewat box-shadow, bukan border-width,
   biar tinggi barisnya nggak bergeser. */
.bpt-title-input {
  width: 100%; min-width: 0; box-sizing: border-box; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink);
  border: none; border-bottom: 1px solid var(--line); background: transparent; padding: 2px 0 5px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: border-color .15s, box-shadow .15s;
}
.bpt-title-input::placeholder { color: #c2b4bc; font-style: italic; }
.bpt-title-input:hover { border-bottom-color: var(--muted); }
.bpt-title-input:focus { outline: none; border-bottom-color: var(--gold); box-shadow: 0 1px 0 0 var(--gold); }
.bpt-title { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bpt-line2 { display: flex; align-items: center; gap: 8px 10px; flex-wrap: wrap; line-height: 1.3; row-gap: 8px; }
.bpt-sep { color: var(--line); font-size: 10px; }
.bpt-meta-text { font-size: 11px; color: var(--muted); white-space: nowrap; }

.bpt-chip { flex: none; font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 100px; white-space: nowrap; line-height: 1.5; }
.st-lunas   { color: #2b5010; background: #EAF3DE; }
.st-due     { color: #7a5c28; background: var(--gold-soft); }
.st-overdue { color: #7a1a1a; background: var(--rose-soft); }
.st-belum   { color: var(--muted); background: var(--ivory); }

.bpt-chip-source.src-fund     { color: #7a5c28; background: var(--gold-soft); }
.bpt-chip-source.src-external { color: var(--muted); background: var(--ivory); }

/* Dikasih bingkai tipis biar kebaca sebagai field yang bisa diketuk —
   sebelumnya polos tanpa border, di layar HP kelihatan kayak teks nyasar. */
.bpt-date-inline {
  font-family: inherit; font-size: 11.5px; color: var(--muted); white-space: nowrap;
  border: 1px solid var(--line); background: var(--paper); border-radius: 7px;
  padding: 4px 7px; max-width: 100%; cursor: pointer; transition: .15s;
}
.bpt-date-inline:hover { color: var(--ink); border-color: var(--gold); }
.bpt-date-inline:focus { color: var(--ink); outline: none; border-color: var(--gold); background: #fff; box-shadow: 0 0 0 2px var(--gold-soft); }

.bpt-line2-paid {
  border: none; background: transparent; padding: 0; margin: 0; font: inherit; text-align: left; cursor: default;
}
.bpt-line2-paid.clickable { cursor: pointer; }
.bpt-line2-paid.clickable:hover .bpt-meta-text:first-of-type { color: var(--ink); text-decoration: underline; }
.bpt-edit-ico { flex: none; width: 11px; height: 11px; color: var(--muted); opacity: 0; transition: opacity .15s; }
.bpt-line2-paid.clickable:hover .bpt-edit-ico { opacity: 1; }

.bpt-remarks-text { display: block; margin-top: 8px; font-size: 10.5px; color: var(--muted); line-height: 1.4; }

.bpt-amt {
  flex: none; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px; color: var(--ink);
  white-space: nowrap; font-variant-numeric: tabular-nums;
}

.bpt-amt-edit { flex: none; position: relative; display: block; width: 104px; }
.bpt-rp { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--muted); pointer-events: none; }
.bpt-amt-edit input {
  width: 100%; box-sizing: border-box; text-align: right; font-variant-numeric: tabular-nums;
  font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; color: var(--ink);
  border: 1px solid var(--line); background: #fff;
  border-radius: 8px; padding: 7px 10px 7px 28px;
}
.bpt-amt-edit input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-soft); }

.bpt-pay, .bpt-revert {
  flex: none; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 700;
  border-radius: 100px; padding: 8px 16px; cursor: pointer; transition: .15s;
}
.bpt-pay { color: var(--plum); background: var(--gold-soft); border: 1px solid var(--gold); }
.bpt-pay:hover { background: var(--gold); color: var(--ink); }
.bpt-revert { color: var(--muted); background: transparent; border: 1px solid transparent; }
.bpt-revert:hover { color: var(--rose); background: var(--rose-soft); }

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
