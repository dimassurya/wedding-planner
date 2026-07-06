<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ editId ? 'Ubah Data Tamu' : 'Tambah Tamu' }}</h3>
      <div class="sub">{{ editId ? guest?.nama : 'Isi data tamu undangan' }}</div>

      <div class="field">
        <label>Nama Tamu</label>
        <input ref="namaInput" v-model="form.nama" type="text" placeholder="cth: Tante Ririn &amp; Om Ferdi" autocomplete="off">
      </div>
      <div class="row2">
        <div class="field">
          <label>Jumlah Orang</label>
          <div class="select-wrap">
            <select v-model.number="form.jumlah">
              <option v-for="i in 10" :key="i" :value="i">{{ i }} orang</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Diundang ke</label>
          <div class="select-wrap">
            <select v-model="form.undangan">
              <option value="keduanya">Keduanya (Akad & Resepsi)</option>
              <option value="akad">Akad saja</option>
              <option value="resepsi">Resepsi saja</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label>Status Relasi</label>
        <div class="select-wrap">
          <select v-model="form.status">
            <option v-for="k in ORDER" :key="k" :value="k">{{ META[k].label }}</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Konfirmasi Undangan</label>
        <div class="select-wrap">
          <select v-model="form.konfirmasi">
            <option value="ya">Dikonfirmasi (dihitung di statistik)</option>
            <option value="tidak">Belum dikonfirmasi</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Catatan <span class="lbl-opt">(opsional)</span></label>
        <textarea v-model="form.catatan" rows="2" placeholder="cth: vegetarian, alergi kacang, perlu kamar menginap..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">Batal</button>
        <button class="btn" @click="save">Simpan</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { META, ORDER } from '../../data/constants'

const props = defineProps({ show: Boolean, editId: { type: Number, default: null } })
const emit  = defineEmits(['close'])
const store = useWeddingStore()
const namaInput = ref(null)

const guest = computed(() => props.editId ? store.guests.find(g => g.id === props.editId) : null)

const form = ref({ nama: '', jumlah: 2, undangan: 'keduanya', status: 'cpp', konfirmasi: 'ya', catatan: '' })

watch(() => props.show, open => {
  if (!open) return
  if (guest.value) {
    const g = guest.value
    form.value = { nama: g.nama, jumlah: g.jumlah, undangan: g.undangan || 'keduanya', status: g.status, konfirmasi: g.konfirmasi !== false ? 'ya' : 'tidak', catatan: g.catatan || '' }
  } else {
    form.value = { nama: '', jumlah: 2, undangan: 'keduanya', status: 'cpp', konfirmasi: 'ya', catatan: '' }
  }
  nextTick(() => namaInput.value?.focus())
})

function save() {
  if (!form.value.nama.trim()) { store.toast('Nama belum diisi'); return }
  store.saveGuest({
    nama:       form.value.nama.trim(),
    jumlah:     form.value.jumlah,
    undangan:   form.value.undangan,
    status:     form.value.status,
    konfirmasi: form.value.konfirmasi !== 'tidak',
    catatan:    form.value.catatan.trim(),
  }, props.editId)
  store.toast(props.editId ? 'Perubahan tersimpan' : 'Tamu ditambahkan')
  emit('close')
}
</script>

<style scoped>
.lbl-opt { font-weight: 400; color: var(--muted); font-size: 11px; }
</style>
