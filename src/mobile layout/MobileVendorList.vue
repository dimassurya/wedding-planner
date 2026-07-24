<template>
  <div class="mv-wrap">
    <div v-if="!rows.length" class="mv-empty">
      <div class="mv-empty-big">Tidak ada vendor</div>
      <div>Belum ada data vendor untuk kategori ini.</div>
    </div>

    <div v-for="v in rows" :key="v.id" class="mv-card" :class="['mvs-' + statusKey(v), { expanded: expandedId === v.id }]">
      <div class="mv-row" @click="toggleExpand(v.id)">
        <button type="button" class="mv-exp-btn" @click.stop="toggleExpand(v.id)" :aria-label="expandedId === v.id ? 'Tutup detail' : 'Buka detail'">
          <svg class="mv-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="mv-main">
          <div class="mv-top">
            <span class="mv-name">{{ v.nama || 'Tanpa nama' }}</span>
            <select
              class="mv-status-sel"
              :class="'vs-' + statusKey(v)"
              :value="statusKey(v)"
              @click.stop
              @change="e => store.setVendorStatus(v, e.target.value)"
            >
              <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
            </select>
          </div>
          <div class="mv-sub">
            <span class="mv-price">Rp {{ grp(v.harga) }} <small>· {{ v.tipeHarga === 'pax' ? 'Per pax' : 'All in' }}</small></span>
            <span v-if="capInfo(v)" class="mv-cap" :class="{ over: capInfo(v).over }">{{ v.kapasitas }} org</span>
          </div>
        </div>
      </div>

      <!-- Detail info (expand ke bawah) -->
      <div v-if="expandedId === v.id" class="mv-body">
        <!-- Payment info -->
        <div v-if="payInfo(v)" class="mv-payblock">
          <div class="mv-pay-top">
            <span :class="{ 'mv-lunas': payInfo(v).lunas }">{{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}</span>
            <span class="mv-pay-sub">dibayar Rp {{ grp(payInfo(v).dibayar) }} / Rp {{ grp(payInfo(v).total) }}</span>
          </div>
          <div class="mv-paybar"><span :style="{ width: payInfo(v).pct + '%' }"></span></div>
          <div v-if="payInfo(v).jatuhTempo" class="mv-due">⏰ Jatuh tempo {{ fmtDate(payInfo(v).jatuhTempo) }}</div>
        </div>

        <!-- Pax breakdown -->
        <div v-if="v.tipeHarga === 'pax'" class="mv-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ paxMultText(v) }}</div>

        <!-- Detail info -->
        <div v-if="!v.hp && !v.alamat && !v.email && !v.website && !v.deskripsi" class="mv-empty-info">Belum ada info tambahan — lengkapi lewat tombol Edit.</div>
        <div v-else class="mv-details">
          <div v-if="v.hp" class="mv-detail-row">
            <span class="mv-detail-lbl">📱 Telepon</span>
            <span class="mv-detail-val">{{ v.hp }}</span>
          </div>
          <div v-if="v.website" class="mv-detail-row">
            <span class="mv-detail-lbl">🌐 Website/IG</span>
            <span class="mv-detail-val"><a :href="v.website.startsWith('http') ? v.website : 'https://' + v.website" target="_blank" rel="noopener" class="mv-link">{{ v.website }}</a></span>
          </div>
          <div v-if="v.email" class="mv-detail-row">
            <span class="mv-detail-lbl">✉️ Email</span>
            <span class="mv-detail-val">{{ v.email }}</span>
          </div>
          <div v-if="v.alamat" class="mv-detail-row">
            <span class="mv-detail-lbl">📍 Alamat</span>
            <span class="mv-detail-val">{{ v.alamat }}</span>
          </div>
          <div v-if="v.deskripsi" class="mv-desc">{{ v.deskripsi }}</div>
        </div>

        <!-- Actions -->
        <div class="mv-actions">
          <button v-if="v.hp" class="mv-act-btn wa" @click.stop="openWa(v)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m5.8 14.16c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.59-1.2-3.03s.76-2.15 1.03-2.45c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.27.14.43.12.58-.07.15-.2.67-.78.85-1.05.18-.27.36-.22.61-.13.24.09 1.54.73 1.81.86.27.14.44.2.51.31.06.11.06.66-.18 1.34"/></svg>
            WA
          </button>
          <button class="mv-act-btn edit" @click.stop="$emit('edit', v.id)">Edit</button>
          <button class="mv-act-btn del" @click.stop="store.delVendor(v.id)">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER } from '../data/constants'
import { grp, fmtDate } from '../utils/index'
import { openWa } from './waLink'

defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['edit'])

const store = useWeddingStore()
const expandedId = ref(null)

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

const statusKey = v => v.status || (v.jadi ? 'dipakai' : 'incar')
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function paxMultText(v) {
  if (v.paxPengali === 'orang') return `${tOrang.value} org`
  if (v.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  if (v.paxPengali === 'hampers') return `${store.hampersCount} hampers`
  return v.paxManualVal
}
function capInfo(v) {
  if (!v.kapasitas) return null
  const diff = tOrang.value - v.kapasitas
  return { muat: v.kapasitas, tamu: tOrang.value, over: diff > 0, delta: Math.abs(diff) }
}

function payInfo(v) {
  return store.vendorPayInfo(v)
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
  flex-direction: column;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  overflow: hidden;
}
.mv-card.mvs-dihubungi { border-left-color: #0A1D4B; }
.mv-card.mvs-dipakai   { border-left-color: var(--green); }
.mv-card.mvs-batal     { border-left-color: var(--rose); }

/* Row (klik buka/tutup) */
.mv-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
}
.mv-exp-btn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin-top: 2px;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  flex: none;
}
.mv-chev { transition: transform .2s; }
.mv-card.expanded .mv-chev { transform: rotate(180deg); }

.mv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.mv-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.mv-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title, 17px);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
  word-break: break-word;
}
.mv-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mv-price {
  font-size: var(--m-value, 15px);
  font-weight: 700;
  color: var(--plum);
}
.mv-price small { font-weight: 500; color: var(--muted); }
.mv-cap {
  font-size: var(--m-sub, 12px);
  font-weight: 600;
  color: #3b6d11;
  background: var(--green-soft);
  border-radius: 100px;
  padding: 2px 9px;
}
.mv-cap.over { color: #7a1a1a; background: var(--rose-soft); }
.mv-status-sel {
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub, 12px);
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 5px 10px;
  cursor: pointer;
  background: var(--paper);
  flex: none;
}
.mv-status-sel.vs-incar     { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.mv-status-sel.vs-dihubungi { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }
.mv-status-sel.vs-dipakai   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.mv-status-sel.vs-batal     { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }

/* Body (expand ke bawah) */
.mv-body {
  padding: 0 14px 14px 34px;
  border-top: 1px dashed var(--line);
}
.mv-paxinfo { padding-top: 10px; font-size: 11.5px; color: var(--muted); }
.mv-empty-info { padding-top: 10px; font-size: 12px; color: var(--muted); }

/* Payment block */
.mv-payblock {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--ivory);
  border-radius: 10px;
}
.mv-pay-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ink); }
.mv-pay-sub { font-size: 11px; font-weight: 500; color: var(--muted); }
.mv-lunas { color: var(--green); }
.mv-paybar { height: 5px; background: var(--line); border-radius: 100px; overflow: hidden; margin: 7px 0 5px; }
.mv-paybar > span { display: block; height: 100%; background: var(--gold); border-radius: 100px; }
.mv-due { font-size: 11.5px; color: #7a5c28; }

/* Detail info */
.mv-details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mv-detail-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  color: var(--ink);
}
.mv-detail-lbl {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .03em;
  white-space: nowrap;
  margin-right: 2px;
}
.mv-detail-val {
  word-break: break-word;
}
.mv-link { color: var(--plum); text-decoration: none; }
.mv-link:active { text-decoration: underline; }
.mv-desc {
  margin-top: 4px;
  font-size: 12.5px;
  color: #5f4a4a;
  font-style: italic;
  line-height: 1.45;
  white-space: pre-wrap;
}

/* Actions */
.mv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.mv-act-btn {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.mv-act-btn:active { background: var(--gold-soft); border-color: var(--gold); }
.mv-act-btn.wa { background: #25D366; color: #fff; border-color: #25D366; }
.mv-act-btn.wa:active { filter: brightness(.95); }
.mv-act-btn.del { color: var(--rose); }
.mv-act-btn.del:active { background: var(--rose-soft); border-color: var(--rose); }
</style>
