<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>Ubah Data Masal</h3>
      <div class="sub">{{ store.selectedCount }} item akan diubah</div>

      <!-- Tamu -->
      <template v-if="tab === 'tamu'">
        <div class="field">
          <label>Ubah Relasi</label>
          <div class="select-wrap">
            <select v-model="f.relasi">
              <option value="">— jangan ubah —</option>
              <option v-for="k in ORDER" :key="k" :value="k">{{ META[k].label }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ubah Grup Undangan</label>
          <div class="select-wrap">
            <select v-model="f.undangan">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option value="keduanya">Keduanya (Akad &amp; Resepsi)</option>
              <option value="akad">Hanya Akad</option>
              <option value="resepsi">Hanya Resepsi</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ubah Kehadiran</label>
          <div class="select-wrap">
            <select v-model="f.kehadiran">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option v-for="k in KEHADIRAN_ORDER" :key="k" :value="k">{{ KEHADIRAN_STATUS[k].label }}</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Vendor -->
      <template v-if="tab === 'vendor'">
        <div class="field">
          <label>Ubah Kategori Vendor</label>
          <div class="select-wrap">
            <select v-model="f.kat">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option v-for="c in VENDOR_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ubah Keputusan (Status Vendor)</label>
          <div class="select-wrap">
            <select v-model="f.stat">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option value="jadi">Jadi Digunakan</option>
              <option value="batal">Batal / Hapus dari Budget</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Budget -->
      <template v-if="tab === 'budget'">
        <div class="field">
          <label>Ubah Status Pembayaran</label>
          <div class="select-wrap">
            <select v-model="f.stat">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option value="lunas">Tandai Lunas (Dibayar = Aktual)</option>
              <option value="belum">Tandai Belum Bayar (Dibayar = 0)</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ubah Jatuh Tempo</label>
          <input v-model="f.due" type="date">
        </div>
      </template>

      <!-- Seserahan / Mahar -->
      <template v-if="tab === 'seserahan' || tab === 'mahar'">
        <div class="field">
          <label>Ubah Status Persiapan</label>
          <div class="select-wrap">
            <select v-model="f.stat">
              <option value="">-- Biarkan (Tidak Diubah) --</option>
              <option value="sudah">Sudah Disiapkan / Dibeli</option>
              <option value="belum">Belum Disiapkan</option>
            </select>
          </div>
        </div>
      </template>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">Batal</button>
        <button class="btn" @click="apply">Terapkan Perubahan</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { META, ORDER, VENDOR_CATEGORIES, KEHADIRAN_STATUS, KEHADIRAN_ORDER } from '../../data/constants'

const props = defineProps({ show: Boolean, tab: String })
const emit  = defineEmits(['close', 'applied'])
const store = useWeddingStore()

const f = ref({ relasi: '', undangan: '', kehadiran: '', kat: '', stat: '', due: '' })

watch(() => props.show, open => {
  if (open) f.value = { relasi: '', undangan: '', kehadiran: '', kat: '', stat: '', due: '' }
})

function apply() {
  const fields = props.tab === 'tamu'
    ? { relasi: f.value.relasi, undangan: f.value.undangan, kehadiran: f.value.kehadiran }
    : props.tab === 'vendor'
    ? { kat: f.value.kat, stat: f.value.stat }
    : props.tab === 'budget'
    ? { stat: f.value.stat, due: f.value.due }
    : { stat: f.value.stat }

  const ok = store.applyBulk(props.tab, fields)
  if (ok) emit('applied')
  emit('close')
}
</script>
