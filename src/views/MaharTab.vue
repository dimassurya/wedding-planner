<template>
  <section class="panel active" id="panel-mahar">
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="26" height="18" viewBox="0 0 26 18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6.5"/><circle cx="17" cy="9" r="6.5"/></svg></div>
        <div class="num">{{ store.mahar.length }}</div><div class="lbl">Total item</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ sudah }}</div><div class="lbl">Sudah disiapkan</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
        <div class="num">{{ fmt(tHarga) }}</div><div class="lbl">Total nilai mahar</div>
      </div>
    </div>

    <div class="controls st-toolbar" :class="{ sticky: !isMobile }" ref="toolbarRef">
      <button class="icon-btn solid" @click="addItem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Item
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('mahar')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="MAHAR_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileMaharList v-if="isMobile" :rows="store.mahar" v-model:editId="mobileEditId" />

    <!-- Table (PC) -->
    <div v-else class="card st-card">
      <div class="st-inner">
      <div class="m-head" :style="{ top: headTop + 'px' }">
        <div class="m-cbx"><input type="checkbox" class="cbx" :checked="allSel" :indeterminate.prop="someSel && !allSel" @change="toggleAll"></div>
        <div>Item</div><div>Status</div><div class="r">Harga / Nilai</div><div class="m-actions"></div>
      </div>

      <div v-if="!store.mahar.length" class="empty">
        <div class="big">Belum ada item mahar</div>
        <div>Klik Tambah Item untuk mulai.</div>
      </div>

      <div v-for="m in store.mahar" :key="m.id" class="m-row" :class="{ sel: store.isSelected(m.id) }" :data-id="m.id">
        <div class="m-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" :checked="store.isSelected(m.id)" @change="e => store.toggleSelected(m.id, e.target.checked)"></div>
        <div class="m-item">
          <input type="text" :value="m.item" placeholder="Nama item..." @input="e => onText(m, e.target.value)" @blur="onItemBlur(m)">
        </div>
        <div class="m-stat cStat">
          <SwitchToggle :model-value="!!m.status" title="Sudah Disiapkan?" @update:model-value="v => onToggle(m, v)" />
          <span class="v-lbl">{{ m.status ? 'Sudah Disiapkan' : 'Belum Disiapkan' }}</span>
        </div>
        <div class="m-cell cA m-hrg">
          <span class="rp">Rp</span>
          <input type="text" inputmode="numeric" :value="grp(m.harga)" @input="e => onCur(m, e)">
        </div>
        <div class="m-actions r">
          <button class="icon-btn item-action-btn del" @click="delItem(m)" title="Hapus">
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
import { fmt, grp, num } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileMaharList from '../mobile layout/MobileMaharList.vue'
import TourBtn from '../components/TourBtn.vue'
import { useStickyThead } from '../composables/useStickyThead'

const store        = useWeddingStore()
const importRef    = ref(null)
const isMobile     = useIsMobile()
const mobileEditId = ref(null)
const { toolbarRef, headTop } = useStickyThead()

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'mahar') addItem()
})

const MAHAR_STEPS = computed(() => [
  {
    selector: '#panel-mahar .stat-grid',
    icon: '💍',
    title: 'Ringkasan Mahar',
    desc: 'Total item mahar, berapa yang sudah disiapkan, dan total nilai keseluruhan. Semua angka update otomatis.',
  },
  {
    selector: '#panel-mahar .controls',
    icon: '➕',
    title: 'Tambah Item Mahar',
    desc: 'Tambahkan komponen mahar satu per satu — uang tunai, emas, Al-Quran, dll. Isi nama dan nilai masing-masing item.',
  },
  {
    selector: isMobile.value ? '.mm-card' : '.m-row',
    icon: '📋',
    title: isMobile.value ? 'Kartu Item' : 'Baris Item',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama item, nilai, dan status persiapan. Ketuk untuk edit detail.'
      : 'Edit nama item dan nilai langsung di baris. Klik toggle untuk tandai item sudah disiapkan.',
  },
  {
    selector: isMobile.value ? '.mm-status' : '.m-stat',
    icon: '✅',
    title: 'Status Disiapkan',
    desc: 'Aktifkan saat item sudah benar-benar ada dan siap diserahkan. Angka "Sudah Disiapkan" di ringkasan akan terupdate.',
  },
  {
    selector: isMobile.value ? '.mm-price' : '.m-hrg',
    icon: '💰',
    title: 'Nilai Item',
    desc: 'Isi nilai nominal tiap item mahar. Total keseluruhan langsung terhitung otomatis di ringkasan atas.',
  },
])

const sudah  = computed(() => store.mahar.filter(m => m.status).length)
const tHarga = computed(() => store.mahar.reduce((s, x) => s + (x.harga || 0), 0))

const allSel  = computed(() => store.mahar.length > 0 && store.mahar.every(m => store.isSelected(m.id)))
const someSel = computed(() => store.mahar.some(m => store.isSelected(m.id)))

function toggleAll(e) {
  store.mahar.forEach(m => store.toggleSelected(m.id, e.target.checked))
}

async function addItem() {
  const row = await store.addMaharItem()
  if (!row) return
  const id = row.id
  // Mobile: langsung buka popup edit untuk item baru
  if (isMobile.value) { mobileEditId.value = id; return }
  await nextTick()
  const rows = document.querySelectorAll('.m-row')
  if (rows.length) {
    const last = rows[rows.length - 1]
    last.scrollIntoView({ behavior: 'smooth' })
    last.querySelector('input')?.focus()
  }
}

function onText(m, val) {
  m.item = val
  store.saveM()
}

function onToggle(m, val) {
  m.status = val
  store.saveM()
}

function onCur(m, e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  m.harga = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
  store.saveM()
}

function onItemBlur(m) {
  if (!m.item?.trim()) {
    store.mahar.splice(store.mahar.findIndex(x => x.id === m.id), 1)
    store.saveM()
  }
}

function delItem(m) {
  store.delMahar(m.id)
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('mahar', f)
  e.target.value = ''
}
</script>
