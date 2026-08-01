<template>
  <div class="gift-form">
    <div class="field">
      <label>Jenis</label>
      <div class="gf-seg">
        <button type="button" class="gf-seg-btn" :class="{ on: gift.type === 'mahar' }" @click="setType('mahar')">💍 Mahar</button>
        <button type="button" class="gf-seg-btn" :class="{ on: gift.type === 'seserahan' }" @click="setType('seserahan')">🎁 Seserahan</button>
      </div>
    </div>

    <div class="field">
      <label>Nama Barang</label>
      <input type="text" :value="gift.item" placeholder="cth: Cincin Emas" @input="e => setField('item', e.target.value)">
    </div>

    <div class="row2">
      <div class="field">
        <label>Kategori</label>
        <input type="text" :value="gift.kategori" placeholder="cth: Perhiasan" @input="e => setField('kategori', e.target.value)">
      </div>
      <div class="field">
        <label>Status</label>
        <select :value="gift.status" @change="e => setField('status', e.target.value)">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ GIFT_STATUS_OPTIONS[s].label }}</option>
        </select>
      </div>
    </div>

    <div class="row2">
      <div class="field">
        <label>Harga Estimasi</label>
        <div class="cur-wrap"><span class="cur-rp">Rp</span>
          <input class="cur" type="text" inputmode="numeric" :value="grp(gift.hargaEstimasi)" @input="e => onCur('hargaEstimasi', e)">
        </div>
      </div>
      <div class="field">
        <label>Harga Aktual</label>
        <div class="cur-wrap"><span class="cur-rp">Rp</span>
          <input class="cur" type="text" inputmode="numeric" :value="grp(gift.hargaAktual)" @input="e => onCur('hargaAktual', e)">
        </div>
      </div>
    </div>

    <div class="field">
      <label>Tanggal Pembelian</label>
      <input type="date" :value="gift.tanggalPembelian || ''" @change="e => setField('tanggalPembelian', e.target.value || null)">
    </div>

    <div class="field">
      <label>Catatan</label>
      <input type="text" :value="gift.catatan" placeholder="Catatan singkat tentang item ini..." @input="e => setField('catatan', e.target.value)">
    </div>

    <div class="field">
      <label class="gf-check-lbl">
        <input type="checkbox" :checked="gift.includeInBudget" @change="e => setField('includeInBudget', e.target.checked)">
        Masukkan ke Budget
      </label>
      <div class="field-hint">Item ini akan muncul sebagai baris tersendiri di tab Budget, mengikuti Harga Estimasi &amp; Aktual di atas.</div>
    </div>

    <details class="gf-more">
      <summary>Informasi Tambahan</summary>
      <div class="gf-more-body">
        <div class="field"><label>Nama Toko</label>
          <input type="text" :value="gift.namaToko" placeholder="cth: Toko Emas Sentosa" @input="e => setField('namaToko', e.target.value)">
        </div>
        <div class="field"><label>Link Marketplace</label>
          <input type="text" :value="gift.linkMarketplace" placeholder="https://..." @input="e => setField('linkMarketplace', e.target.value)">
        </div>
        <div class="row2">
          <div class="field"><label>WhatsApp Penjual</label>
            <input type="text" :value="gift.whatsappPenjual" placeholder="08xxxxxxxxxx" @input="e => setField('whatsappPenjual', e.target.value)">
          </div>
          <div class="field"><label>Instagram</label>
            <input type="text" :value="gift.instagram" placeholder="@namatoko" @input="e => setField('instagram', e.target.value)">
          </div>
        </div>
        <div class="field"><label>Website</label>
          <input type="text" :value="gift.website" placeholder="https://..." @input="e => setField('website', e.target.value)">
        </div>
        <div class="field"><label>Alamat</label>
          <input type="text" :value="gift.alamat" placeholder="Alamat toko..." @input="e => setField('alamat', e.target.value)">
        </div>
        <div class="field"><label>Catatan Tambahan</label>
          <textarea :value="gift.catatanTambahan" placeholder="Catatan lain-lain..." @input="e => setField('catatanTambahan', e.target.value)"></textarea>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { grp, num } from '../utils/index'
import { GIFT_STATUS_OPTIONS, GIFT_STATUS_BY_TYPE } from '../data/constants'

const props = defineProps({ gift: { type: Object, required: true } })

const store = useWeddingStore()

const statusOptions = computed(() => GIFT_STATUS_BY_TYPE[props.gift.type] || GIFT_STATUS_BY_TYPE.mahar)

function setField(field, val) {
  props.gift[field] = val
  if (field === 'type' && !statusOptions.value.includes(props.gift.status)) {
    props.gift.status = 'belum_dibeli'
  }
  store.saveGifts()
}

function setType(type) { setField('type', type) }

function onCur(field, e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  props.gift[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveGifts()
}
</script>

<style scoped>
.gf-seg {
  display: flex;
  gap: 8px;
}
.gf-seg-btn {
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
.gf-seg-btn.on {
  border-color: transparent;
  background: var(--plum);
  color: #fff;
  font-weight: 600;
}

.gf-check-lbl {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.gf-check-lbl input[type="checkbox"] {
  width: 17px;
  height: 17px;
  accent-color: var(--plum);
  cursor: pointer;
}

.gf-more {
  margin-top: 4px;
  margin-bottom: 16px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--ivory);
  overflow: hidden;
}
.gf-more summary {
  list-style: none;
  cursor: pointer;
  padding: 12px 14px;
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--plum);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gf-more summary::-webkit-details-marker { display: none; }
.gf-more summary::after {
  content: '▾';
  color: var(--muted);
  transition: transform .15s ease;
}
.gf-more[open] summary::after { transform: rotate(180deg); }
.gf-more[open] summary { border-bottom: 1px solid var(--line); }
.gf-more-body {
  padding: 14px 14px 2px;
}
</style>
