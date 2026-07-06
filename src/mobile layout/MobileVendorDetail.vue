<template>
  <transition name="mvd-fade">
    <div v-if="id != null && v" class="mvd-overlay" @click.self="$emit('close')">
      <div class="mvd-sheet">
        <div class="mvd-head">
          <div class="mvd-head-main">
            <div class="mvd-name">{{ v.nama || 'Tanpa nama' }}</div>
            <div class="mvd-cat">{{ catLabel(v.category) }}</div>
          </div>
          <button class="mvd-x" aria-label="Tutup" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div class="mvd-body">
          <div class="mvd-price">
            Rp {{ grp(v.harga) }}
            <span class="mvd-badge">{{ badgeText(v) }}</span>
          </div>
          <div class="mvd-status" :class="{ ok: v.jadi }">
            <span class="mvd-dot"></span>{{ v.jadi ? 'Dipakai' : 'Belum dipakai' }}
          </div>

          <div v-if="v.alamat" class="mvd-row">
            <span class="mvd-lbl">Alamat</span>
            <span class="mvd-val">{{ v.alamat }}</span>
          </div>
          <div class="mvd-row">
            <span class="mvd-lbl">No HP</span>
            <span class="mvd-val">{{ v.hp || '—' }}</span>
          </div>
          <div class="mvd-row">
            <span class="mvd-lbl">Deskripsi</span>
            <span class="mvd-val">{{ v.deskripsi || '—' }}</span>
          </div>
        </div>

        <div class="mvd-foot">
          <button class="mvd-wa" :disabled="!waLink(v.hp)" @click="openWa(v)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m5.8 14.16c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.59-1.2-3.03s.76-2.15 1.03-2.45c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.27.14.43.12.58-.07.15-.2.67-.78.85-1.05.18-.27.36-.22.61-.13.24.09 1.54.73 1.81.86.27.14.44.2.51.31.06.11.06.66-.18 1.34"/></svg>
            WhatsApp
          </button>
          <button class="mvd-edit" @click="$emit('edit', id)">Edit</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES } from '../data/constants'
import { grp } from '../utils/index'
import { waLink, openWa } from './waLink'

const props = defineProps({ id: { type: [Number, String], default: null } })
defineEmits(['close', 'edit'])

const store = useWeddingStore()
const v = computed(() => store.vendors.find(x => x.id === props.id))

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)
function paxMultText(vv) {
  if (vv.paxPengali === 'orang') return `${tOrang.value} org`
  if (vv.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  return vv.paxManualVal
}
function badgeText(vv) {
  if (vv.tipeHarga === 'pax') return `Rp ${grp(vv.hargaPax)} × ${paxMultText(vv)}`
  return 'All In'
}
</script>

<style scoped>
.mvd-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(36, 8, 8, .42);
}
.mvd-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(36, 8, 8, .26);
}
.mvd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
}
.mvd-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
}
.mvd-cat {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--plum);
}
.mvd-x {
  flex: none;
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
.mvd-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
}
.mvd-price {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  font-size: 20px;
  font-weight: 700;
  color: var(--plum);
}
.mvd-badge {
  font-size: 10.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  color: #3d5027;
  background: #e4edd8;
}
.mvd-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}
.mvd-status .mvd-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
}
.mvd-status.ok { color: var(--green); }
.mvd-status.ok .mvd-dot { background: var(--green); border-color: var(--green); }
.mvd-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  margin-top: 12px;
}
.mvd-lbl {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
}
.mvd-val {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.mvd-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
}
.mvd-wa {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  border: 1.5px solid #cdead8;
  border-radius: 12px;
  background: #eaf7ef;
  color: #1c8049;
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.mvd-wa:disabled { opacity: .45; cursor: default; }
.mvd-edit {
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
.mvd-edit:active { background: var(--maroon); }

.mvd-fade-enter-active,
.mvd-fade-leave-active { transition: opacity .22s ease; }
.mvd-fade-enter-active .mvd-sheet,
.mvd-fade-leave-active .mvd-sheet { transition: transform .22s ease; }
.mvd-fade-enter-from,
.mvd-fade-leave-to { opacity: 0; }
.mvd-fade-enter-from .mvd-sheet,
.mvd-fade-leave-to .mvd-sheet { transform: translateY(100%); }
</style>
