<template>
  <section class="panel active" id="panel-seserahan">
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
        <div class="num">{{ store.seserahan.length }}</div><div class="lbl">Total item</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ sudah }}</div><div class="lbl">Sudah dibeli</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="16" cy="12" r="2"/></svg></div>
        <div class="num">{{ fmt(tBudget) }}</div><div class="lbl">Total budget</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
        <div class="num">{{ fmt(tHarga) }}</div><div class="lbl">Harga aktual</div>
      </div>
    </div>

    <div class="controls">
      <button class="icon-btn solid" @click="addItem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Item
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('seserahan')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="SESERAHAN_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileSeserahanList v-if="isMobile" :rows="store.seserahan" v-model:editId="mobileEditId" />

    <!-- Table (PC) -->
    <div v-else class="card table-card">
      <div class="table-scroll">
      <div class="s-head">
        <div class="s-cbx"><input type="checkbox" class="cbx" :checked="allSel" :indeterminate.prop="someSel && !allSel" @change="toggleAll"></div>
        <div>Item</div><div>Status</div><div class="r">Budget</div><div class="r">Harga Aktual</div><div>Link Referensi</div><div class="s-actions"></div>
      </div>

      <div v-if="!store.seserahan.length" class="empty">
        <div class="big">Belum ada item seserahan</div>
        <div>Klik Tambah Item untuk mulai.</div>
      </div>

      <div v-for="s in store.seserahan" :key="s.id" class="s-row" :class="{ sel: store.isSelected(s.id) }" :data-id="s.id">
        <div class="s-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(s.id)" @change="e => store.toggleSelected(s.id, e.target.checked)"></div>
        <div class="s-item">
          <input type="text" :value="s.item" placeholder="Nama item..." @input="e => onText(s, 'item', e.target.value)" @blur="onItemBlur(s)">
        </div>
        <div class="s-stat cStat">
          <SwitchToggle :model-value="!!s.status" title="Sudah Dibeli?" @update:model-value="v => onToggle(s, v)" />
          <span class="v-lbl">{{ s.status ? 'Sudah Dibeli' : 'Belum Dibeli' }}</span>
        </div>
        <div class="s-cell cE s-bud">
          <span class="rp">Rp</span>
          <input type="text" inputmode="numeric" :value="grp(s.budget)" @input="e => onCur(s, 'budget', e)">
        </div>
        <div class="s-cell cA s-hrg">
          <span class="rp">Rp</span>
          <input type="text" inputmode="numeric" :value="grp(s.harga)" @input="e => onCur(s, 'harga', e)">
        </div>
        <div class="s-link">
          <input type="text" :value="s.link" placeholder="https://..." @change="e => onText(s, 'link', e.target.value)">
          <button class="icon-btn item-action-btn" :disabled="!s.link" :style="{ opacity: s.link ? 1 : 0.5 }" @click="openLink(s.link)" title="Buka Link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
        <div class="s-actions r">
          <button class="icon-btn item-action-btn del" @click="delItem(s)" title="Hapus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, grp, num, openLink } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileSeserahanList from '../mobile layout/MobileSeserahanList.vue'
import TourBtn from '../components/TourBtn.vue'

const store        = useWeddingStore()
const importRef    = ref(null)
const isMobile     = useIsMobile()
const mobileEditId = ref(null)

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'seserahan') addItem()
})

const SESERAHAN_STEPS = computed(() => [
  {
    selector: '#panel-seserahan .stat-grid',
    icon: '🎁',
    title: 'Ringkasan Seserahan',
    desc: 'Total item, berapa yang sudah disiapkan, total budget yang direncanakan, dan total harga aktual yang sudah diketahui.',
  },
  {
    selector: '#panel-seserahan .controls',
    icon: '➕',
    title: 'Tambah Item',
    desc: 'Tambahkan item seserahan satu per satu — cincin, kebaya, mukena, dll. Isi nama, budget rencana, dan harga aktual kalau sudah tahu.',
  },
  {
    selector: isMobile.value ? '.ms-card' : '.s-row',
    icon: '📋',
    title: isMobile.value ? 'Kartu Item' : 'Baris Item',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama, harga aktual, budget, dan status. Ketuk untuk edit detail lengkap.'
      : 'Setiap baris berisi nama item, status, budget, harga aktual, dan link referensi — semua bisa diedit langsung.',
  },
  {
    selector: isMobile.value ? '.ms-price-row' : '.s-bud',
    icon: '💰',
    title: 'Budget vs Harga Aktual',
    desc: 'Budget adalah anggaran rencana yang kamu tetapkan. Harga Aktual adalah harga nyata setelah tahu harganya. Selisih keduanya bisa kamu pantau dari ringkasan di atas.',
  },
  {
    selector: isMobile.value ? '.ms-status' : '.s-stat',
    icon: '✅',
    title: 'Status Persiapan',
    desc: 'Aktifkan toggle saat item sudah benar-benar disiapkan atau dibeli. Angka "Sudah Disiapkan" di ringkasan atas akan update otomatis.',
  },
  {
    selector: '.s-link',
    icon: '🔗',
    title: 'Link Referensi',
    desc: 'Tempel link produk dari Tokopedia, Shopee, atau manapun. Klik ikon panah untuk langsung buka link tersebut di browser.',
  },
])

const sudah   = computed(() => store.seserahan.filter(s => s.status).length)
const tBudget = computed(() => store.seserahan.reduce((s, x) => s + (x.budget || 0), 0))
const tHarga  = computed(() => store.seserahan.reduce((s, x) => s + (x.harga  || 0), 0))

const allSel  = computed(() => store.seserahan.length > 0 && store.seserahan.every(s => store.isSelected(s.id)))
const someSel = computed(() => store.seserahan.some(s => store.isSelected(s.id)))

function toggleAll(e) {
  store.seserahan.forEach(s => store.toggleSelected(s.id, e.target.checked))
}

async function addItem() {
  const id = Date.now()
  store.seserahan.push({ id, item: '', status: false, budget: 0, harga: 0, link: '' })
  store.saveS()
  // Mobile: langsung buka popup edit untuk item baru
  if (isMobile.value) { mobileEditId.value = id; return }
  await nextTick()
  const rows = document.querySelectorAll('.s-row')
  if (rows.length) {
    const last = rows[rows.length - 1]
    last.scrollIntoView({ behavior: 'smooth' })
    last.querySelector('input')?.focus()
  }
}

function onText(s, field, val) {
  s[field] = val.trim !== undefined ? val : val
  if (field !== 'link') s[field] = val
  else s.link = val.trim()
  store.saveS()
}

function onToggle(s, val) {
  s.status = val
  store.saveS()
}

function onCur(s, field, e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  s[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveS()
}

function onItemBlur(s) {
  if (!s.item?.trim()) {
    store.seserahan.splice(store.seserahan.findIndex(x => x.id === s.id), 1)
    store.saveS()
  }
}

function delItem(s) {
  store.delSeserahan(s.id)
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('seserahan', f)
  e.target.value = ''
}
</script>
