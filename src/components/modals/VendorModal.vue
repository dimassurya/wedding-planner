<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ editId ? 'Edit Vendor' : 'Tambah Vendor' }}</h3>
      <div class="sub">Lengkapi informasi vendor pilihan Anda</div>
      <form @submit.prevent="save">
        <div class="row2">
          <div class="field">
            <label>Kategori</label>
            <div class="select-wrap">
              <select v-model="form.category">
                <option v-for="c in VENDOR_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Nama Vendor</label>
            <input ref="namaInput" v-model="form.nama" type="text" required>
          </div>
        </div>
        <div class="field">
          <label>Status</label>
          <div class="select-wrap">
            <select v-model="form.status">
              <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
            </select>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>
        </div>
        <div class="row2">
          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="togglePax">
                <option value="paket">All In</option>
                <option value="pax">Per Pax / Item</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>No. HP</label>
            <input v-model="form.hp" type="text">
          </div>
        </div>

        <div v-if="form.category === 'venue' || form.tipeHarga === 'paket'" class="field">
          <label>{{ form.category === 'venue' ? 'Kapasitas Venue (orang)' : 'Kapasitas Paket (pax/orang)' }}</label>
          <input v-model.number="form.kapasitas" type="number" min="0" placeholder="cth: 300">
          <div v-if="form.category !== 'venue'" class="vm-cap-hint">Isi kalau paket All In ini cuma mencakup jumlah tamu tertentu. Kosongkan kalau tidak ada batasnya.</div>
          <div v-if="form.kapasitas > 0" class="vm-cap-hint" :class="{ over: tOrang > form.kapasitas }">
            Tamu terkonfirmasi sekarang: {{ tOrang }} orang ·
            <template v-if="tOrang > form.kapasitas">lebih {{ tOrang - form.kapasitas }} dari kapasitas</template>
            <template v-else>sisa {{ form.kapasitas - tOrang }} {{ form.category === 'venue' ? 'kursi' : 'pax' }}</template>
          </div>
        </div>

        <div v-if="form.tipeHarga === 'pax'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
          <div class="field" style="flex:1.2; min-width:0">
            <label>Harga Per Pax</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaPax)" @input="onHargaPax">
            </div>
          </div>
          <div class="field" style="flex:1.5; min-width:0">
            <label>Dikali</label>
            <div class="select-wrap">
              <select v-model="form.paxPengali" @change="calcPaxTotal(true)">
                <option value="orang">Tamu dikonfirmasi — {{ tOrang }} orang</option>
                <option value="undangan">Undangan dikonfirmasi — {{ tUndangan }}</option>
                <option value="hampers">Kirim hampers — {{ store.hampersCount }}</option>
                <option value="manual">Jumlah kustom</option>
              </select>
            </div>
          </div>
          <div v-if="form.paxPengali === 'manual'" class="field" style="flex:0.8; min-width:0">
            <label>Jumlah</label>
            <input v-model.number="form.paxManualVal" type="number" min="1" @input="calcPaxTotal(true)">
          </div>
        </div>

        <div class="field">
          <label>{{ form.tipeHarga === 'pax' ? 'Total Akhir (Bisa diedit)' : 'Total Harga Paket' }}</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
          </div>
          <div v-if="form.tipeHarga === 'pax'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
            💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
          <div class="field"><label>Website / Instagram</label><input v-model="form.website" type="text" placeholder="https://..."></div>
        </div>
        <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>
        <div class="field"><label>Deskripsi (Isi Paket dsb.)</label><textarea v-model="form.deskripsi" rows="3"></textarea></div>
        <div class="modal-actions" style="margin-top:20px">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn primary">Simpan</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER } from '../../data/constants'
import { grp, num } from '../../utils/index'

const props = defineProps({ show: Boolean, editId: { type: Number, default: null }, defaultCategory: { type: String, default: 'wo' } })
const emit  = defineEmits(['close'])
const store = useWeddingStore()
const namaInput = ref(null)

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

const blankForm = () => ({ category: props.defaultCategory, nama: '', alamat: '', hp: '', email: '', website: '', harga: 0, deskripsi: '', tipeHarga: 'paket', hargaPax: 0, paxPengali: 'orang', paxManualVal: 1, kapasitas: 0, status: 'incar' })
const form = ref(blankForm())

watch(() => props.show, open => {
  if (!open) return
  if (props.editId) {
    const v = store.vendors.find(x => x.id === props.editId)
    if (v) form.value = { category: v.category, nama: v.nama, alamat: v.alamat || '', hp: v.hp || '', email: v.email || '', website: v.website || '', harga: v.harga || 0, deskripsi: v.deskripsi || '', tipeHarga: v.tipeHarga || 'paket', hargaPax: v.hargaPax || 0, paxPengali: v.paxPengali || 'orang', paxManualVal: v.paxManualVal || 1, kapasitas: v.kapasitas || 0, status: v.status || (v.jadi ? 'dipakai' : 'incar') }
  } else {
    form.value = blankForm()
    form.value.category = props.defaultCategory
  }
  nextTick(() => namaInput.value?.focus())
})

function togglePax() {
  if (form.value.tipeHarga === 'pax') {
    calcPaxTotal(false)
    if (form.value.category !== 'venue') form.value.kapasitas = 0
  }
}

function calcPaxTotal(force = true) {
  if (form.value.tipeHarga !== 'pax') return
  const hpax = form.value.hargaPax
  let mult = 1
  if (form.value.paxPengali === 'orang') mult = tOrang.value
  else if (form.value.paxPengali === 'undangan') mult = tUndangan.value
  else if (form.value.paxPengali === 'hampers') mult = store.hampersCount
  else mult = form.value.paxManualVal || 1
  if (force || form.value.harga === 0) form.value.harga = hpax * mult
}

function onHargaPax(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaPax = num(e.target.value)
  calcPaxTotal(true)
}
function onHarga(e) {
  e.target.value = grp(e.target.value)
  form.value.harga = num(e.target.value)
}

async function save() {
  if (!form.value.nama.trim()) return
  const vData = { ...form.value, nama: form.value.nama.trim(), alamat: form.value.alamat.trim(), hp: form.value.hp.trim(), email: form.value.email.trim(), website: form.value.website.trim(), deskripsi: form.value.deskripsi.trim(), harga: form.value.harga }
  if (props.editId) {
    const idx = store.vendors.findIndex(x => x.id === props.editId)
    if (idx > -1) {
      // jadi diturunkan dari status — bukan dipertahankan dari nilai lama.
      const jadi = vData.status === 'dipakai'
      store.vendors[idx] = { ...vData, id: props.editId, jadi }
      // Sinkronkan baris Budget: bikin/hapus sesuai status "dipakai".
      store.handleVendorDecision(store.vendors[idx], jadi)
    }
    store.saveV()
  } else {
    // PK vendors di-generate server — insert dulu & tunggu id aslinya balik
    const row = await store.addVendor(vData)
    if (!row) return
  }
  store.toast(props.editId ? 'Vendor disimpan' : 'Vendor ditambahkan')
  emit('close')
}
</script>

<style scoped>
.vm-cap-hint { font-size: 12px; color: var(--muted); margin-top: 6px; }
.vm-cap-hint.over { color: var(--rose); font-weight: 600; }
</style>
