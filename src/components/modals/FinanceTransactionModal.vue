<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal" v-if="show">
      <h3>{{ isEdit ? 'Ubah Transaksi' : 'Tambah Transaksi' }}</h3>
      <div class="sub">Catat setiap dana yang masuk atau keluar dari tabungan pernikahan.</div>

      <div v-if="isLinked" class="fn-auto-note">🔗 Transaksi ini dibuat otomatis dari pembayaran di tab Budget. Nominal &amp; kategori tidak bisa diubah di sini — untuk mengubah atau membatalkan pembayarannya, buka tab Budget.</div>

      <div class="fn-jenis-toggle" :class="{ locked: isLinked }">
        <button type="button" class="fn-jenis-btn" :class="{ on: form.jenis === 'masuk' }" :disabled="isLinked" @click="setJenis('masuk')">↓ Dana Masuk</button>
        <button type="button" class="fn-jenis-btn keluar" :class="{ on: form.jenis === 'keluar' }" :disabled="isLinked" @click="setJenis('keluar')">↑ Dana Keluar</button>
      </div>

      <div class="row2">
        <div class="field"><label>Tanggal</label>
          <input type="date" v-model="form.tanggal">
        </div>
        <div class="field"><label>Nominal</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" :class="{ locked: isLinked }" type="text" inputmode="numeric" :readonly="isLinked" :value="grp(form.nominal)" @input="onNominal">
          </div>
        </div>
      </div>

      <div class="field"><label>Kategori</label>
        <div class="select-wrap">
          <select v-model="form.kategori" :disabled="isLinked" :class="{ locked: isLinked }">
            <option value="" disabled>Pilih jenis transaksi...</option>
            <option v-for="k in kategoriOptions" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
      </div>

      <div class="field"><label>Catatan</label>
        <textarea v-model="form.catatan" placeholder="Contoh: Gaji bulan Juli, Bonus, DP Catering, Tabungan bulan ini..."></textarea>
      </div>

      <div v-if="isEdit && tx.dicatatOleh" class="fn-recorded-by">Dicatat oleh {{ tx.dicatatOleh }}</div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">Batal</button>
        <button class="btn" @click="onSave">Simpan</button>
      </div>
      <button v-if="isEdit && !isLinked" type="button" class="fn-del-link" @click="onDelete">Hapus Transaksi</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { grp, num } from '../../utils/index'
import { FUND_KATEGORI_MASUK, FUND_KATEGORI_KELUAR } from '../../data/constants'

const props = defineProps({ show: Boolean, txId: { default: null } })
const emit = defineEmits(['close'])
const store = useWeddingStore()

const tx     = computed(() => props.txId != null ? store.fund.find(t => t.id === props.txId) : null)
const isEdit = computed(() => !!tx.value)
// Transaksi otomatis dari pembayaran Budget — Wedding Fund cuma nampilin
// hasilnya, nggak boleh diubah/dihapus dari sini (Single Source of Truth
// ada di tab Budget). Lihat db "wedding_fund_transactions".budgetPaymentId.
const isLinked = computed(() => !!(tx.value?.budgetPaymentId || tx.value?.budgetItemId))

const today = () => new Date().toISOString().slice(0, 10)

const form = reactive({ tanggal: today(), jenis: 'masuk', kategori: '', nominal: 0, catatan: '' })

function resetForm() {
  const t = tx.value
  form.tanggal  = t?.tanggal  || today()
  form.jenis    = t?.jenis    || 'masuk'
  form.kategori = t?.kategori || ''
  form.nominal  = t?.nominal  || 0
  form.catatan  = t?.catatan  || ''
}

watch(() => props.show, open => { if (open) resetForm() })

// Transaksi otomatis dari Budget pakai kategori 'Vendor' — sengaja BUKAN
// bagian dari FUND_KATEGORI_KELUAR (nggak ditawarkan buat entri manual),
// jadi di-inject di sini biar <select> tetap nampilin nilainya dengan
// benar waktu transaksi itu dibuka (fieldnya di-disable, ini cuma soal
// tampilan, bukan bikin opsi itu jadi bisa dipilih manual).
const kategoriOptions = computed(() => {
  const base = form.jenis === 'masuk' ? FUND_KATEGORI_MASUK : FUND_KATEGORI_KELUAR
  const current = tx.value?.kategori
  return (current && !base.includes(current)) ? [current, ...base] : base
})

function setJenis(j) {
  if (isLinked.value || form.jenis === j) return
  form.jenis = j
  // Kategori lama mungkin gak relevan buat jenis baru (mis. "Souvenir" pas
  // pindah ke Masuk) — reset biar gak nyangkut kategori yang gak nyambung.
  if (!kategoriOptions.value.includes(form.kategori)) form.kategori = ''
}

function onNominal(e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  form.nominal = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
}

async function onSave() {
  if (!form.kategori) { store.toast('Pilih kategori dulu'); return }
  if (!form.nominal) { store.toast('Isi nominal dulu'); return }
  // Transaksi terkait Budget: cuma tanggal & catatan yang boleh berubah,
  // sekalipun UI-nya somehow ke-bypass — nominal/jenis/kategori tetap ikut
  // nilai tersimpan aslinya (jangan pernah dikirim dari form yang di-lock).
  const payload = isLinked.value
    ? { tanggal: form.tanggal, catatan: form.catatan }
    : { tanggal: form.tanggal, jenis: form.jenis, kategori: form.kategori, nominal: form.nominal, catatan: form.catatan }
  if (isEdit.value) {
    store.updateFundTx(tx.value.id, payload)
  } else {
    const row = await store.addFundTx(payload)
    if (!row) return
  }
  emit('close')
}

async function onDelete() {
  await store.delFundTx(tx.value.id)
  emit('close')
}
</script>

<style scoped>
.fn-jenis-toggle { display: flex; gap: 8px; margin-bottom: 18px; }
.fn-jenis-btn {
  flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid var(--line);
  background: var(--ivory); color: var(--muted); font-family: 'Jost', sans-serif;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: .15s;
}
.fn-jenis-btn.on { border-color: var(--green); background: #EAF3DE; color: #2b5010; }
.fn-jenis-btn.keluar.on { border-color: var(--rose); background: var(--rose-soft); color: #7a1a1a; }
.fn-jenis-btn:disabled { cursor: not-allowed; opacity: .75; }

.fn-auto-note { font-size: 12px; color: #7a5c28; background: var(--gold-soft); border-radius: 10px; padding: 9px 12px; margin-bottom: 16px; line-height: 1.5; }

.fn-recorded-by { font-size: 11.5px; color: var(--muted); margin: -8px 0 16px; }

.cur.locked { background: var(--ivory); color: var(--muted); cursor: not-allowed; }
select.locked, .field select:disabled { background: var(--ivory); color: var(--muted); cursor: not-allowed; }

.fn-del-link {
  display: block; width: 100%; text-align: center; margin-top: 12px;
  background: none; border: none; color: var(--rose); font-family: 'Jost', sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px;
}
.fn-del-link:hover { text-decoration: underline; }
</style>
