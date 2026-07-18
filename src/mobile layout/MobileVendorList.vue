<template>
  <div class="mv-wrap">
    <div v-if="!rows.length" class="mv-empty">
      <div class="mv-empty-big">Tidak ada vendor</div>
      <div>Belum ada data vendor untuk kategori ini.</div>
    </div>

    <div v-for="v in rows" :key="v.id" class="mv-card" :class="{ used: v.jadi }" @click="detailId = v.id">
      <div class="mv-main">
        <div class="mv-title">
          <span class="mv-name">{{ v.nama || 'Tanpa nama' }}</span>
          <span v-if="v.alamat" class="mv-addr">{{ v.alamat }}</span>
        </div>
        <div class="mv-price-row">
          <span class="mv-price">Rp {{ grp(v.harga) }}</span>
          <span class="mv-badge">{{ badgeText(v) }}</span>
        </div>
        <span v-if="capInfo(v)" class="mv-cap" :class="{ over: capInfo(v).over }">
          👥 muat {{ capInfo(v).muat }} · tamu {{ capInfo(v).tamu }}
          <template v-if="capInfo(v).over">· lebih {{ capInfo(v).delta }}</template>
          <template v-else>· sisa {{ capInfo(v).delta }}</template>
        </span>
        <span v-if="payInfo(v)" class="mv-pay" :class="{ lunas: payInfo(v).lunas }">
          {{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}
        </span>
      </div>

      <div class="mv-actions" @click.stop>
        <select
          class="mv-status-sel"
          :class="'vs-' + (v.status || (v.jadi ? 'dipakai' : 'incar'))"
          :value="v.status || (v.jadi ? 'dipakai' : 'incar')"
          @change="e => store.setVendorStatus(v, e.target.value)"
        >
          <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
        </select>
        <button class="mv-act wa item-action-btn" :disabled="!waLink(v.hp)" title="WhatsApp" @click="openWa(v)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m5.8 14.16c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.59-1.2-3.03s.76-2.15 1.03-2.45c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.27.14.43.12.58-.07.15-.2.67-.78.85-1.05.18-.27.36-.22.61-.13.24.09 1.54.73 1.81.86.27.14.44.2.51.31.06.11.06.66-.18 1.34"/></svg>
        </button>
        <button class="mv-act item-action-btn" title="Edit" @click="$emit('edit', v.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="mv-act del item-action-btn" title="Hapus" @click="store.delVendor(v.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <MobileVendorDetail :id="detailId" @close="detailId = null" @edit="onDetailEdit" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER } from '../data/constants'
import { grp } from '../utils/index'
import { waLink, openWa } from './waLink'
import MobileVendorDetail from './MobileVendorDetail.vue'

defineProps({ rows: { type: Array, default: () => [] } })
const emit = defineEmits(['edit'])

const store = useWeddingStore()
const detailId = ref(null)

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

function paxMultText(v) {
  if (v.paxPengali === 'orang') return `${tOrang.value} org`
  if (v.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  return v.paxManualVal
}
function badgeText(v) {
  if (v.tipeHarga === 'pax') return `Rp ${grp(v.hargaPax)} × ${paxMultText(v)}`
  return 'All In'
}

function capInfo(v) {
  if (v.category !== 'venue' || !v.kapasitas) return null
  const diff = tOrang.value - v.kapasitas
  return { muat: v.kapasitas, tamu: tOrang.value, over: diff > 0, delta: Math.abs(diff) }
}

function payInfo(v) {
  return store.vendorPayInfo(v)
}

function onDetailEdit(id) {
  detailId.value = null
  emit('edit', id)
}
</script>

<style scoped>
.mv-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mv-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  cursor: pointer;
}
.mv-card.used { border-color: var(--green); }

.mv-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mv-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 7px;
}
.mv-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
  word-break: break-word;
}
.mv-addr {
  font-size: var(--m-sub);
  color: var(--muted);
}
.mv-price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mv-price {
  font-size: var(--m-value);
  font-weight: 700;
  color: var(--plum);
}
.mv-badge {
  font-size: var(--m-chip);
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  color: #3d5027;
  background: #e4edd8;
  line-height: 1.3;
}
.mv-cap {
  align-self: flex-start;
  font-size: var(--m-sub);
  font-weight: 600;
  color: #3b6d11;
  background: var(--green-soft);
  border-radius: 100px;
  padding: 2px 9px;
}
.mv-cap.over { color: #7a1a1a; background: var(--rose-soft); }
.mv-pay {
  align-self: flex-start;
  font-size: var(--m-sub);
  font-weight: 600;
  color: var(--rose);
}
.mv-pay.lunas { color: var(--green); }
.mv-status-sel {
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 6px 10px;
  cursor: pointer;
  background: var(--paper);
}
.mv-status-sel.vs-incar     { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.mv-status-sel.vs-dihubungi { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }
.mv-status-sel.vs-dipakai   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.mv-status-sel.vs-batal     { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }
.mv-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
}
.mv-status .mv-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--muted);
  background: transparent;
}
.mv-status.ok { color: var(--green); }
.mv-status.ok .mv-dot { background: var(--green); border-color: var(--green); }

.mv-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 3px;
}
.mv-act {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  background: var(--ivory);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s, opacity .15s;
}
.mv-act:active { background: var(--gold-soft); }
.mv-act.wa { color: #25a35a; }
.mv-act.wa:active { background: #dff3e6; }
.mv-act.wa:disabled { color: var(--line); cursor: default; }
.mv-act.del { color: var(--rose); }
.mv-act.del:active { background: var(--rose-soft); }
</style>
