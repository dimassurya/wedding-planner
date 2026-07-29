<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal" v-if="item">
      <h3>{{ item.item || 'Detail Item' }}</h3>
      <div class="sub">Rincian harga &amp; buku pembayaran</div>

      <div class="field"><label>Nama Item</label>
        <input type="text" :value="item.item" placeholder="Nama item..." @input="onName($event)">
      </div>

      <div class="row2">
        <div class="field"><label>Estimasi <span class="lbl-hint">rencana</span></label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(item.estimasi)" @input="onItemCur($event, 'estimasi')">
          </div>
        </div>
        <div class="field"><label>Aktual <span class="lbl-hint">harga jadi</span></label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" :class="{ locked: isManaged }" type="text" inputmode="numeric" :value="grp(item.aktual)" :readonly="isManaged" @input="onItemCur($event, 'aktual')">
          </div>
          <div v-if="isManaged" class="field-hint">{{ originTip }}</div>
        </div>
      </div>

      <!-- Ringkasan -->
      <div class="mcalc">
        <div class="ln"><span>Total tagihan</span><b>{{ fmt(item.aktual) }}</b></div>
        <div class="ln"><span>Sudah dibayar</span><b class="paid">{{ fmt(dibayar) }}</b></div>
        <div class="ln big"><span>Sisa</span><b>{{ fmt(sisa) }}</b></div>
        <div class="pbar"><span :style="{ width: pct + '%' }"></span></div>
      </div>

      <!-- Buku pembayaran -->
      <div class="pay-head">
        <span class="pay-title">Termin &amp; Pembayaran</span>
        <span v-if="pays.length" class="pay-count">{{ paidCount }}/{{ pays.length }} lunas</span>
      </div>

      <div v-if="!pays.length" class="pay-empty">
        Belum ada termin. Tambah rencana pembayaran (mis. DP &amp; pelunasan) di bawah.
      </div>

      <div class="pay-timeline">
        <BudgetPaymentTimelineItem
          v-for="p in pays" :key="p.id"
          :payment="p"
          @toggle-paid="onTogglePaid(p)"
        />
      </div>

      <datalist id="pay-by-opts">
        <option value="Pihak Pria"></option>
        <option value="Pihak Wanita"></option>
        <option value="Bersama"></option>
        <option value="Orang Tua"></option>
      </datalist>

      <div class="pay-add-row">
        <button class="pay-add" @click="addTermin">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
          Tambah termin
        </button>
        <button v-if="sisa > 0" class="pay-add ghost" @click="addSisaLunas" title="Tambah 1 termin sebesar sisa & tandai lunas">
          Bayar sisa penuh
        </button>
      </div>

      <div class="field" style="margin-top:18px;"><label>Catatan</label>
        <textarea ref="remarksEl" class="remarks-auto" :value="item.remarks" placeholder="cth: sudah nego, harga termasuk pajak" @input="onRemarksInput($event)"></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { grp, num, fmt } from '../../utils/index'
import BudgetPaymentTimelineItem from '../BudgetPaymentTimelineItem.vue'

const props = defineProps({ show: Boolean, itemId: { default: null } })
defineEmits(['close'])
const store = useWeddingStore()
const remarksEl = ref(null)

const item = computed(() => props.itemId != null ? store.budget.find(b => b.id === props.itemId) : null)
const pays = computed(() => item.value ? store.itemPayments(item.value.id) : [])

// Item dari Vendor/Seserahan/Mahar: Aktual ikut sinkron dari sumbernya,
// jadi dikunci di sini biar nggak ada yang ketimpa diam-diam pas sync
// berikutnya. Estimasi tetap bisa diedit — itu target rencana milik
// sendiri, independen dari harga sumbernya.
const isManaged = computed(() => item.value ? !!store.budgetOrigin(item.value)?.managed : false)
const originTip  = computed(() => item.value ? (store.budgetOrigin(item.value)?.tip || '') : '')

const dibayar   = computed(() => item.value ? store.paidTotal(item.value.id) : 0)
const sisa      = computed(() => Math.max((item.value?.aktual || 0) - dibayar.value, 0))
const pct       = computed(() => item.value?.aktual ? Math.min(Math.round(dibayar.value / item.value.aktual * 100), 100) : 0)
const paidCount = computed(() => pays.value.filter(p => p.paid).length)

// ── Live-save field item ──
function onName(e)   { item.value.item = e.target.value; store.saveB() }
function onRemarks(e){ item.value.remarks = e.target.value; store.saveB() }

// Catatan otomatis melar ngikutin isi, biar nggak ada teks yang kepotong
// atau harus di-scroll di dalam kotak kecil.
function autoGrowRemarks() {
  const el = remarksEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function onRemarksInput(e) {
  onRemarks(e)
  autoGrowRemarks()
}

watch(() => props.show, async open => {
  if (!open) return
  await nextTick()
  autoGrowRemarks()
})

function onItemCur(e, field) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  item.value[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveB()
}

// Centang termin jadi lunas → tawarkan catat sebagai pengeluaran Wedding
// Fund (opt-in, cuma sekali per termin — fundTxForPayment cegah re-prompt).
async function onTogglePaid(p) {
  const goingPaid = !p.paid
  store.togglePaymentPaid(p.id, goingPaid)
  if (goingPaid) await maybeLinkFund(p)
}

async function maybeLinkFund(p) {
  if (store.fundTxForPayment(p.id)) return
  // Budget selalu jadi satu-satunya tempat bayar (Single Source of Truth).
  // Wedding Fund cuma ikut kepotong KALAU sumber dananya memang dari sana —
  // pilih "Dana di luar Wedding Fund" tetap bikin termin ini lunas, cuma
  // saldo Wedding Fund nggak disentuh.
  const ok = await store.askConfirm({
    title: 'Sumber Pembayaran',
    message: `Pembayaran ${fmt(p.amount)} sudah ditandai lunas. Dari mana sumber dananya?`,
    confirmLabel: 'Wedding Fund',
    cancelLabel: 'Dana di luar Wedding Fund',
    danger: false,
  })
  if (!ok) return
  store.addFundTx({
    tanggal: p.paidDate || new Date().toISOString().slice(0, 10),
    jenis: 'keluar',
    kategori: 'Vendor',
    nominal: p.amount,
    catatan: `Pembayaran: ${item.value.item || 'Item Budget'}`,
    budgetItemId: item.value.id,
    // p.id bisa masih kosong kalau baru saja dibuat (addSisaLunas) & belum
    // sempat ke-sync ke server — kalau begitu link cukup lewat budgetItemId.
    budgetPaymentId: p.id ?? null,
  })
}

function addTermin() {
  // Default = bagian harga yang BELUM dialokasikan ke termin manapun
  // (aktual dikurangi SEMUA termin yang udah ada, lunas ataupun belum) —
  // bukan cuma dikurangi yang lunas (sisa.value). Kalau dipakai sisa.value,
  // nambah termin ke-2/ke-3 bakal selalu nyaranin harga penuh lagi (karena
  // termin pertama yang belum lunas nggak ikut ngurangin), jadi user harus
  // ngedit manual tiap kali padahal ini area yang harusnya otomatis.
  const b = item.value
  const allocated = pays.value.reduce((s, p) => s + (p.amount || 0), 0)
  const remainder = Math.max((b.aktual || 0) - allocated, 0)
  store.addPayment(b.id, { amount: remainder })
}

async function addSisaLunas() {
  const today = new Date().toISOString().slice(0, 10)
  const p = store.addPayment(item.value.id, { amount: sisa.value, paid: true, paidDate: today, note: 'Pelunasan' })
  await maybeLinkFund(p)
}
</script>

<style scoped>
.lbl-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--muted); font-size: 11px; }
.cur.locked { background: var(--ivory); color: var(--muted); cursor: not-allowed; }
.field-hint { font-size: 11px; color: var(--muted); margin-top: 5px; }
.remarks-auto { min-height: 64px; max-height: 300px; overflow-y: auto; resize: none; }
.mcalc .ln b.paid { color: var(--green); }
.pbar { height: 6px; background: #fff; border: 1px solid var(--line); border-radius: 100px; overflow: hidden; margin-top: 8px; }
.pbar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--gold), var(--wine)); border-radius: 100px; transition: width .3s; }

.pay-head { display: flex; align-items: baseline; justify-content: space-between; margin: 4px 0 10px; }
.pay-title { font-family: 'Jost', sans-serif; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--plum); }
.pay-count { font-size: 12px; color: var(--muted); }

.pay-empty { font-size: 13px; color: var(--muted); background: var(--ivory); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; line-height: 1.5; }

.pay-timeline { margin-bottom: 4px; }

.pay-add-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.pay-add {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; color: var(--plum);
  background: var(--paper); border: 1.5px solid var(--line); border-radius: 100px; padding: 8px 14px; cursor: pointer; transition: .15s;
}
.pay-add:hover { background: var(--gold-soft); border-color: var(--gold); }
.pay-add.ghost { color: var(--muted); }
</style>
