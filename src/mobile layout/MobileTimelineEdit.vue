<template>
  <transition name="mte-fade">
    <div v-if="id != null" class="mte-overlay" @click.self="close">
      <div class="mte-sheet">
        <div class="mte-head">
          <span>Edit Tugas</span>
          <button class="mte-x" aria-label="Tutup" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div v-if="item" class="mte-body">
          <label class="mte-lbl">Tugas</label>
          <input class="mte-in" type="text" :value="item.tugas" placeholder="Nama tugas..." @input="e => setField('tugas', e.target.value)">

          <label class="mte-lbl">Deadline</label>
          <input class="mte-in" type="date" :value="item.deadline" @change="e => setField('deadline', e.target.value)">

          <label class="mte-lbl">Status</label>
          <div class="mte-seg">
            <button
              v-for="(st, k) in TL_STATUS"
              :key="k"
              class="mte-seg-btn"
              :class="{ on: item.status === k }"
              :style="item.status === k ? statusStyle(k) : null"
              @click="setStatus(k)"
            >{{ st.label }}</button>
          </div>

          <label class="mte-lbl">Penanggung Jawab</label>
          <div class="mte-seg">
            <button class="mte-seg-btn" :class="{ on: !item.pic }" @click="setField('pic', '')">—</button>
            <button
              v-for="(p, k) in TL_PIC"
              :key="k"
              class="mte-seg-btn"
              :class="{ on: item.pic === k }"
              :style="item.pic === k ? picStyle(k) : null"
              @click="setField('pic', k)"
            >{{ p.label }}</button>
          </div>

          <template v-if="item.status === 'selesai'">
            <label class="mte-lbl">Tanggal Selesai</label>
            <input class="mte-in" type="date" :value="item.tanggalSelesai" @change="e => setField('tanggalSelesai', e.target.value)">
          </template>

          <label class="mte-lbl">Catatan</label>
          <input class="mte-in" type="text" :value="item.catatan" placeholder="—" @input="e => setField('catatan', e.target.value)">
        </div>

        <div class="mte-foot">
          <button class="mte-del" @click="del">Hapus</button>
          <button class="mte-done" @click="close">Selesai</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { TL_STATUS, TL_PIC } from '../data/constants'

const props = defineProps({ id: { type: [Number, String], default: null } })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const item = computed(() => store.timeline.find(t => t.id === props.id))

const STATUS_STYLE = {
  belum:   { background: '#B32E33', color: '#fff' },
  sedang:  { background: '#CD9F65', color: '#3A2000' },
  selesai: { background: '#CD9F65', color: '#3a2a10' },
}
const PIC_STYLE = {
  pria:     { background: '#0A1D4B', color: '#fff' },
  wanita:   { background: '#6E151A', color: '#fff' },
  keduanya: { background: '#CD9F65', color: '#3A2000' },
}
const statusStyle = k => STATUS_STYLE[k]
const picStyle = k => PIC_STYLE[k]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function setField(field, val) {
  const o = item.value
  if (!o) return
  o[field] = val
  store.saveTL()
}

function setStatus(k) {
  const o = item.value
  if (!o) return
  o.status = k
  if (k === 'selesai' && !o.tanggalSelesai) o.tanggalSelesai = todayISO()
  store.saveTL()
}

function close() {
  // kalau tugas dibiarkan kosong (mis. batal tambah), buang saja
  try { store.removeEmptyTimeline?.(props.id) } catch (_) {}
  emit('close')
}

async function del() {
  const o = item.value
  if (!o) { emit('close'); return }
  // tugas baru yang belum diisi — buang saja tanpa konfirmasi
  const isEmpty = !(o.tugas || '').trim() && !o.deadline && !o.catatan
  if (isEmpty) { close(); return }
  await store.delTimeline(o.id)
  if (!item.value) emit('close')
}
</script>

<style scoped>
.mte-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(36, 8, 8, .42);
}
.mte-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(36, 8, 8, .26);
}
.mte-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--plum);
}
.mte-x {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
}
.mte-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 6px;
  display: flex;
  flex-direction: column;
}
.mte-lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  margin-bottom: 6px;
}
.mte-lbl:not(:first-child) { margin-top: 16px; }
.mte-in {
  width: 100%;
  font-family: 'Jost', sans-serif;
  font-size: 14.5px;
  color: var(--ink);
  background: var(--ivory);
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 11px 12px;
  transition: border-color .15s, box-shadow .15s;
}
.mte-in:focus {
  outline: none;
  border-color: var(--gold);
  background: #fff;
  box-shadow: 0 0 0 3px var(--gold-soft);
}
.mte-seg {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}
.mte-seg-btn {
  flex: 1;
  min-width: 64px;
  padding: 10px 8px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--ivory);
  color: var(--ink);
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.mte-seg-btn.on {
  border-color: transparent;
  font-weight: 600;
}
.mte-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
}
.mte-del {
  padding: 12px 18px;
  border: 1.5px solid var(--rose-soft);
  border-radius: 12px;
  background: var(--paper);
  color: var(--rose);
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.mte-del:active { background: var(--rose-soft); }
.mte-done {
  flex: 1;
  border: none;
  border-radius: 12px;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.mte-done:active { background: var(--maroon); }

.mte-fade-enter-active,
.mte-fade-leave-active { transition: opacity .22s ease; }
.mte-fade-enter-active .mte-sheet,
.mte-fade-leave-active .mte-sheet { transition: transform .22s ease; }
.mte-fade-enter-from,
.mte-fade-leave-to { opacity: 0; }
.mte-fade-enter-from .mte-sheet,
.mte-fade-leave-to .mte-sheet { transform: translateY(100%); }
</style>
