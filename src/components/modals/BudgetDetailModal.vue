<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ item?.item || 'Detail Item' }}</h3>
      <div class="sub">Lengkapi pembayaran &amp; catatan</div>

      <div class="field"><label>Nama Item</label><input v-model="form.item" type="text"></div>
      <div class="row2">
        <div class="field"><label>Estimasi</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(form.estimasi)" @input="curInput($event, 'estimasi')">
          </div>
        </div>
        <div class="field"><label>Aktual</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(form.aktual)" @input="curInput($event, 'aktual')">
          </div>
        </div>
      </div>
      <div class="row2">
        <div class="field"><label>Uang Muka (DP)</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(form.uangMuka)" @input="curInput($event, 'uangMuka')">
          </div>
        </div>
        <div class="field"><label>Sudah Dibayar</label>
          <div class="cur-wrap"><span class="cur-rp">Rp</span>
            <input class="cur" type="text" inputmode="numeric" :value="grp(form.dibayar)" @input="curInput($event, 'dibayar')">
          </div>
        </div>
      </div>

      <div class="mcalc">
        <div class="ln"><span>Selisih (Estimasi &minus; Aktual)</span><b>{{ fmt(form.estimasi - form.aktual) }}</b></div>
        <div class="ln big"><span>Sisa Pembayaran</span><b>{{ fmt(Math.max(form.aktual - form.dibayar, 0)) }}</b></div>
        <div class="ln"><span>Status</span><b :style="{ color: calcStatus.color }">{{ calcStatus.label }}</b></div>
      </div>

      <div class="field"><label>Jatuh Tempo</label><input v-model="form.jatuhTempo" type="date"></div>
      <div class="field"><label>Catatan</label><textarea v-model="form.remarks" placeholder="cth: DP 50%, sisa H-7"></textarea></div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">Batal</button>
        <button class="btn" @click="save">Simpan</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { grp, num, fmt } from '../../utils/index'

const props = defineProps({ show: Boolean, itemId: { default: null } })
const emit  = defineEmits(['close'])
const store = useWeddingStore()

const item = computed(() => props.itemId != null ? store.budget.find(b => b.id === props.itemId) : null)

const form = ref({ item: '', estimasi: 0, aktual: 0, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: '' })

watch(() => props.show, open => {
  if (!open || !item.value) return
  const b = item.value
  form.value = { item: b.item, estimasi: b.estimasi, aktual: b.aktual, uangMuka: b.uangMuka, dibayar: b.dibayar, jatuhTempo: b.jatuhTempo || '', remarks: b.remarks || '' }
})

const calcStatus = computed(() => store.bStatus({ aktual: form.value.aktual, dibayar: form.value.dibayar }))

function curInput(e, field) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  form.value[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
}

function save() {
  const b = item.value
  if (!b) return
  Object.assign(b, {
    item: form.value.item.trim(),
    estimasi:   form.value.estimasi,
    aktual:     form.value.aktual,
    uangMuka:   form.value.uangMuka,
    dibayar:    form.value.dibayar,
    jatuhTempo: form.value.jatuhTempo,
    remarks:    form.value.remarks.trim(),
  })
  store.saveB()
  store.toast('Item disimpan')
  emit('close')
}
</script>
