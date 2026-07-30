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
          @payment-action="onPaymentAction(p)"
          @edit-payment="openPayment(p)"
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

      <div v-if="item.vendorId" class="field" style="margin-top:18px;">
        <label>Catatan Vendor</label>
        <div class="vendor-note">{{ vendorNote || 'Belum ada catatan vendor.' }}</div>
        <div class="field-hint">Ubah dari tab Vendor agar informasi kontrak tetap terkumpul di sana.</div>
      </div>
      <div v-else class="field" style="margin-top:18px;"><label>Catatan Anggaran</label>
        <textarea ref="remarksEl" class="remarks-auto" :value="item.remarks" placeholder="cth: sudah nego, harga termasuk pajak" @input="onRemarksInput($event)"></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">Tutup</button>
      </div>

      <div v-if="paymentToPay" class="payment-overlay" @click.self="closePayment">
        <section class="payment-card" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div class="payment-kicker">{{ isEditingPaid ? 'UBAH PEMBAYARAN' : 'CATAT PEMBAYARAN' }}</div>
          <h4 id="payment-title">{{ isEditingPaid ? 'Ubah' : 'Bayar' }} {{ paymentToPay.note || 'Termin' }}</h4>
          <div class="payment-amount">{{ fmt(paymentToPay.amount) }}</div>

          <label class="payment-label" for="payment-date">Tanggal pembayaran</label>
          <input id="payment-date" v-model="paymentDate" class="payment-date" type="date">

          <label class="payment-label" for="payment-paidby">Dibayar oleh <span>(opsional)</span></label>
          <input id="payment-paidby" v-model="paymentPaidBy" class="payment-date" type="text" list="pay-by-opts" placeholder="Pihak Pria, Pihak Wanita, dst.">

          <label class="payment-label" for="payment-remarks">Catatan pembayaran <span>(opsional)</span></label>
          <textarea id="payment-remarks" v-model="paymentRemarks" class="payment-remarks" rows="2" placeholder="Contoh: transfer BCA, bukti sudah dikirim ke PIC"></textarea>

          <div class="payment-label">Sumber dana</div>
          <div class="payment-sources">
            <button class="payment-source" :class="{ selected: paymentSource === 'external' }" @click="paymentSource = 'external'">
              <b>Dana luar</b><span>Saldo Wedding Fund tidak berubah</span>
            </button>
            <button class="payment-source" :class="{ selected: paymentSource === 'fund' }" @click="paymentSource = 'fund'">
              <b>Wedding Fund</b><span>Catat sebagai uang keluar</span>
            </button>
          </div>

          <div class="payment-actions">
            <button class="payment-cancel" @click="closePayment">Batal</button>
            <button class="payment-save" @click="savePayment">{{ isEditingPaid ? 'Simpan perubahan' : 'Simpan pembayaran' }}</button>
          </div>
        </section>
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
const paymentToPay = ref(null)
const paymentDate = ref('')
const paymentSource = ref('external')
const paymentRemarks = ref('')
const paymentPaidBy = ref('')
// Dialog yang sama dipakai buat 2 momen: pertama kali mencatat pembayaran
// (tombol "Bayar" di termin belum lunas) dan koreksi belakangan (klik
// ringkasan termin yang udah lunas) — bedanya cuma judul/label tombol.
const isEditingPaid = computed(() => !!paymentToPay.value?.paid)

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
// Info vendor yang relevan buat konteks Budget ada di 2 kolom terpisah:
// "deskripsi" (paket/harga/detail — yang paling sering diisi user) dan
// "catatan" (remark tambahan, jarang dipakai). Gabungkan dua-duanya biar
// nggak keliatan "Belum ada catatan vendor" padahal deskripsinya udah
// diisi lengkap di tab Vendor — sebelumnya di sini cuma baca "catatan"
// doang jadi hampir selalu kosong.
const vendorNote = computed(() => {
  const vendor = item.value?.vendorId ? store.vendors.find(v => v.id === item.value.vendorId) : null
  if (!vendor) return ''
  return [vendor.deskripsi, vendor.catatan].map(s => (s || '').trim()).filter(Boolean).join('\n\n')
})

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
async function onPaymentAction(p) {
  if (!p.paid) return openPayment(p)
  const ok = await store.askConfirm({
    title: 'Batalkan pembayaran?',
    message: `Status lunas untuk ${fmt(p.amount)} akan dibatalkan.`,
    confirmLabel: 'Batalkan',
    cancelLabel: 'Kembali',
    danger: false,
  })
  if (ok) store.togglePaymentPaid(p.id, false)
}

function openPayment(p) {
  paymentToPay.value = p
  paymentDate.value = p.paidDate || new Date().toISOString().slice(0, 10)
  paymentSource.value = store.fundTxForPayment(p.id) ? 'fund' : 'external'
  paymentRemarks.value = p.remarks || ''
  // Auto-atribusi ke akun yang lagi login (owner/partner, siapapun yang
  // aktif) — biar nggak perlu ngetik manual tiap kali. Cuma dipakai kalau
  // belum pernah keisi; kalau udah ada nilainya (dari sesi sebelumnya),
  // jangan ditimpa diam-diam sama nama viewer yang beda pas buka utk edit.
  paymentPaidBy.value = p.paidBy || store.currentUserName
}

function closePayment() { paymentToPay.value = null }

async function savePayment() {
  const p = paymentToPay.value
  if (!p) return
  p.paidDate = paymentDate.value || new Date().toISOString().slice(0, 10)
  p.paidBy = paymentPaidBy.value.trim()
  p.remarks = paymentRemarks.value.trim()
  store.togglePaymentPaid(p.id, true)
  if (paymentSource.value === 'fund' && !store.fundTxForPayment(p.id)) {
    await store.addFundTx({
      tanggal: p.paidDate,
      jenis: 'keluar',
      kategori: 'Vendor',
      nominal: p.amount,
      catatan: `Pembayaran: ${item.value.item || 'Item Budget'}`,
      budgetItemId: item.value.id,
      budgetPaymentId: p.id ?? null,
    })
  }
  closePayment()
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

function addSisaLunas() {
  const p = store.addPayment(item.value.id, { amount: sisa.value, note: 'Pelunasan' })
  openPayment(p)
}
</script>

<style scoped>
.lbl-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--muted); font-size: 11px; }
.cur.locked { background: var(--ivory); color: var(--muted); cursor: not-allowed; }
.field-hint { font-size: 11px; color: var(--muted); margin-top: 5px; }
.vendor-note { min-height: 18px; padding: 9px 10px; border-radius: 8px; background: var(--ivory); color: var(--muted); font-size: 12px; line-height: 1.45; white-space: pre-wrap; }
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

.payment-overlay {
  position: fixed; inset: 0; z-index: 2100; display: grid; place-items: center; padding: 22px;
  background: rgba(36, 8, 8, .42);
}
.payment-card {
  width: min(100%, 340px); box-sizing: border-box; background: var(--paper); border-radius: 18px;
  padding: 22px; box-shadow: 0 18px 48px rgba(36, 8, 8, .28);
}
.payment-kicker { font-size: 10px; font-weight: 700; letter-spacing: .08em; color: var(--muted); }
.payment-card h4 { margin: 5px 0 0; font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--ink); }
.payment-amount { margin: 2px 0 18px; font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 700; color: var(--plum); }
.payment-label { display: block; margin: 13px 0 6px; font-size: 11px; font-weight: 700; color: var(--muted); }
.payment-date { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 8px 10px; font: inherit; font-size: 13px; color: var(--ink); }
.payment-date:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-soft); }
.payment-label span { font-weight: 400; }
.payment-remarks { width: 100%; box-sizing: border-box; resize: vertical; border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 8px 10px; font: inherit; font-size: 12px; color: var(--ink); line-height: 1.4; }
.payment-remarks:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-soft); }
.payment-sources { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.payment-source { min-height: 72px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: #fff; color: var(--ink); text-align: left; cursor: pointer; }
.payment-source b { display: block; font-family: 'Jost', sans-serif; font-size: 12px; }
.payment-source span { display: block; margin-top: 4px; font-size: 10px; line-height: 1.3; color: var(--muted); }
.payment-source.selected { border: 1.5px solid var(--plum); background: var(--gold-soft); }
.payment-actions { display: flex; gap: 8px; margin-top: 18px; }
.payment-actions button { flex: 1; border-radius: 9px; padding: 9px 10px; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; }
.payment-cancel { border: 1px solid var(--line); background: var(--paper); color: var(--ink); }
.payment-save { border: 1px solid var(--plum); background: var(--plum); color: #fff; }
.payment-save:hover { background: var(--maroon); }
</style>
