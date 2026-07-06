<template>
  <transition name="mse-fade">
    <div v-if="id != null" class="mse-overlay" @click.self="close">
      <div class="mse-sheet">
        <div class="mse-head">
          <span>Edit Item Seserahan</span>
          <button class="mse-x" aria-label="Tutup" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div v-if="s" class="mse-body">
          <label class="mse-lbl">Nama Item</label>
          <input class="mse-in" type="text" :value="s.item" placeholder="Nama item..." @input="e => setField('item', e.target.value)">

          <label class="mse-lbl">Status</label>
          <div class="mse-seg">
            <button class="mse-seg-btn" :class="{ off: !s.status }" @click="setStatus(false)">Belum Dibeli</button>
            <button class="mse-seg-btn" :class="{ on: s.status }" @click="setStatus(true)">Sudah Dibeli</button>
          </div>

          <label class="mse-lbl">Budget</label>
          <div class="mse-cur">
            <span class="mse-rp">Rp</span>
            <input class="mse-in mse-in-cur" type="text" inputmode="numeric" :value="grp(s.budget)" @input="e => onCur('budget', e)">
          </div>

          <label class="mse-lbl">Harga Aktual</label>
          <div class="mse-cur">
            <span class="mse-rp">Rp</span>
            <input class="mse-in mse-in-cur" type="text" inputmode="numeric" :value="grp(s.harga)" @input="e => onCur('harga', e)">
          </div>

          <label class="mse-lbl">Link Referensi</label>
          <div class="mse-link">
            <input class="mse-in" type="text" :value="s.link" placeholder="https://..." @input="e => setField('link', e.target.value)">
            <button class="mse-open" :disabled="!s.link" title="Buka link" @click="openLink(s.link)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </div>
        </div>

        <div class="mse-foot">
          <button class="mse-del" @click="del">Hapus</button>
          <button class="mse-done" @click="close">Selesai</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, num, openLink } from '../utils/index'

const props = defineProps({ id: { type: [Number, String], default: null } })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const s = computed(() => store.seserahan.find(x => x.id === props.id))

function setField(field, val) {
  const o = s.value
  if (!o) return
  o[field] = field === 'link' ? val.trim() : val
  store.saveS()
}

function setStatus(val) {
  const o = s.value
  if (!o) return
  o.status = val
  store.saveS()
}

function onCur(field, e) {
  const o = s.value
  if (!o) return
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  o[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveS()
}

function close() {
  try { store.removeEmptySeserahan?.(props.id) } catch (_) {}
  emit('close')
}

async function del() {
  const o = s.value
  if (!o) { emit('close'); return }
  const isEmpty = !(o.item || '').trim() && !o.budget && !o.harga && !(o.link || '').trim()
  if (isEmpty) { close(); return }
  await store.delSeserahan(o.id)
  if (!s.value) emit('close')
}
</script>

<style scoped>
.mse-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(36, 8, 8, .42);
}
.mse-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(36, 8, 8, .26);
}
.mse-head {
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
.mse-x {
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
.mse-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 6px;
  display: flex;
  flex-direction: column;
}
.mse-lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  margin-bottom: 6px;
}
.mse-lbl:not(:first-child) { margin-top: 16px; }
.mse-in {
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
.mse-in:focus {
  outline: none;
  border-color: var(--gold);
  background: #fff;
  box-shadow: 0 0 0 3px var(--gold-soft);
}
.mse-cur {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mse-rp {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.mse-in-cur { text-align: right; font-variant-numeric: tabular-nums; }
.mse-link {
  display: flex;
  gap: 8px;
}
.mse-open {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
}
.mse-open:disabled { opacity: .4; cursor: default; }
.mse-seg {
  display: flex;
  gap: 8px;
}
.mse-seg-btn {
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
.mse-seg-btn.on {
  border-color: transparent;
  background: var(--green);
  color: #fff;
  font-weight: 600;
}
.mse-seg-btn.off {
  border-color: var(--muted);
  color: var(--ink);
  font-weight: 600;
}
.mse-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
}
.mse-del {
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
.mse-del:active { background: var(--rose-soft); }
.mse-done {
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
.mse-done:active { background: var(--maroon); }

.mse-fade-enter-active,
.mse-fade-leave-active { transition: opacity .22s ease; }
.mse-fade-enter-active .mse-sheet,
.mse-fade-leave-active .mse-sheet { transition: transform .22s ease; }
.mse-fade-enter-from,
.mse-fade-leave-to { opacity: 0; }
.mse-fade-enter-from .mse-sheet,
.mse-fade-leave-to .mse-sheet { transform: translateY(100%); }
</style>
