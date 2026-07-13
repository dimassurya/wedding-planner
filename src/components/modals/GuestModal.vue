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
      <div v-if="editId" class="modal-quick-row">
        <span class="modal-quick-lbl">Aksi lain</span>
        <button type="button" class="item-action-btn" title="Duplikasi tamu" @click="handleDuplicate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button type="button" class="item-action-btn del" title="Hapus tamu" @click="handleDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
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

async function save() {
  if (!form.value.nama.trim()) { store.toast('Nama belum diisi'); return }
  const ok = await store.saveGuest({
    nama:       form.value.nama.trim(),
    jumlah:     form.value.jumlah,
    undangan:   form.value.undangan,
    status:     form.value.status,
    konfirmasi: form.value.konfirmasi !== 'tidak',
    catatan:    form.value.catatan.trim(),
  }, props.editId)
  if (!ok) return   // saveGuest sudah toast pesan errornya sendiri
  store.toast(props.editId ? 'Perubahan tersimpan' : 'Tamu ditambahkan')
  emit('close')
}

function handleDuplicate() {
  if (!props.editId) return
  store.duplicateGuest(props.editId)
  emit('close')
}

async function handleDelete() {
  if (!props.editId) return
  const id = props.editId
  await store.delGuest(id)
  // delGuest membatalkan diam-diam kalau user cancel di dialog konfirmasi —
  // cek datanya beneran hilang dulu sebelum modal ditutup.
  if (!store.guests.some(g => g.id === id)) emit('close')
}
</script>

<style scoped>
.lbl-opt { font-weight: 400; color: var(--muted); font-size: 11px; }

.modal-quick-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  margin-top: 6px;
  border-top: 1px solid var(--line);
}
.modal-quick-lbl { font-size: 12px; color: var(--muted); margin-right: auto; }
</style>
