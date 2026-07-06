<template>
  <transition name="mme-fade">
    <div v-if="id != null" class="mme-overlay" @click.self="close">
      <div class="mme-sheet">
        <div class="mme-head">
          <span>Edit Item Mahar</span>
          <button class="mme-x" aria-label="Tutup" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div v-if="m" class="mme-body">
          <label class="mme-lbl">Nama Item</label>
          <input class="mme-in" type="text" :value="m.item" placeholder="Nama item..." @input="e => setItem(e.target.value)">

          <label class="mme-lbl">Status</label>
          <div class="mme-seg">
            <button class="mme-seg-btn" :class="{ off: !m.status }" @click="setStatus(false)">Belum</button>
            <button class="mme-seg-btn" :class="{ on: m.status }" @click="setStatus(true)">Sudah</button>
          </div>

          <label class="mme-lbl">Harga / Nilai</label>
          <div class="mme-cur">
            <span class="mme-rp">Rp</span>
            <input class="mme-in mme-in-cur" type="text" inputmode="numeric" :value="grp(m.harga)" @input="onCur">
          </div>
        </div>

        <div class="mme-foot">
          <button class="mme-del" @click="del">Hapus</button>
          <button class="mme-done" @click="close">Selesai</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, num } from '../utils/index'

const props = defineProps({ id: { type: [Number, String], default: null } })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const m = computed(() => store.mahar.find(x => x.id === props.id))

function setItem(val) {
  const o = m.value
  if (!o) return
  o.item = val
  store.saveM()
}

function setStatus(val) {
  const o = m.value
  if (!o) return
  o.status = val
  store.saveM()
}

function onCur(e) {
  const o = m.value
  if (!o) return
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  o.harga = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveM()
}

function close() {
  try { store.removeEmptyMahar?.(props.id) } catch (_) {}
  emit('close')
}

async function del() {
  const o = m.value
  if (!o) { emit('close'); return }
  const isEmpty = !(o.item || '').trim() && !o.harga
  if (isEmpty) { close(); return }
  await store.delMahar(o.id)
  if (!m.value) emit('close')
}
</script>

<style scoped>
.mme-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(36, 8, 8, .42);
}
.mme-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(36, 8, 8, .26);
}
.mme-head {
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
.mme-x {
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
.mme-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 6px;
  display: flex;
  flex-direction: column;
}
.mme-lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  margin-bottom: 6px;
}
.mme-lbl:not(:first-child) { margin-top: 16px; }
.mme-in {
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
.mme-in:focus {
  outline: none;
  border-color: var(--gold);
  background: #fff;
  box-shadow: 0 0 0 3px var(--gold-soft);
}
.mme-cur {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mme-rp {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.mme-in-cur { text-align: right; font-variant-numeric: tabular-nums; }
.mme-seg {
  display: flex;
  gap: 8px;
}
.mme-seg-btn {
  flex: 1;
  padding: 11px 8px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--ivory);
  color: var(--ink);
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.mme-seg-btn.on {
  border-color: transparent;
  background: var(--green);
  color: #fff;
  font-weight: 600;
}
.mme-seg-btn.off {
  border-color: var(--muted);
  color: var(--ink);
  font-weight: 600;
}
.mme-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
}
.mme-del {
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
.mme-del:active { background: var(--rose-soft); }
.mme-done {
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
.mme-done:active { background: var(--maroon); }

.mme-fade-enter-active,
.mme-fade-leave-active { transition: opacity .22s ease; }
.mme-fade-enter-active .mme-sheet,
.mme-fade-leave-active .mme-sheet { transition: transform .22s ease; }
.mme-fade-enter-from,
.mme-fade-leave-to { opacity: 0; }
.mme-fade-enter-from .mme-sheet,
.mme-fade-leave-to .mme-sheet { transform: translateY(100%); }
</style>
