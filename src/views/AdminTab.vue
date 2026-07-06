<template>
  <section class="panel active" id="panel-admin">
    <div class="stat-grid">
      <div class="stat"><div class="accent a-plum"></div><div class="num">{{ total }}</div><div class="lbl">Total Syarat</div></div>
      <div class="stat"><div class="accent a-teal"></div><div class="num">{{ done }}</div><div class="lbl">Sudah Lengkap</div></div>
      <div class="stat"><div class="accent a-rose"></div><div class="num">{{ total - done }}</div><div class="lbl">Belum Lengkap</div></div>
    </div>
    <div class="b-prog-wrap">
      <div class="b-prog-bar"><div class="b-prog-fill" :style="{ width: pct + '%', background: '#0A1D4B' }"></div></div>
      <span class="b-prog-pct">{{ pct }}% selesai</span>
    </div>

    <div class="adm-info">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1" stroke-linecap="round"/></svg>
      Template dokumen sudah diisi sesuai persyaratan umum KUA. Nama dokumen bisa diedit langsung, dan kamu bisa tambah atau hapus sesuai kebutuhan daerahmu.
    </div>

    <div class="controls">
      <button class="icon-btn solid" @click="addGroup">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Bagian
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('admin')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="ADMIN_STEPS" />
    </div>

    <!-- Mobile: kartu ala checklist -->
    <div v-if="isMobile" id="adminBody">
      <div v-if="!store.admin.length" class="card">
        <div class="empty">
          <div class="big">Belum ada bagian</div>
          <div>Klik "Tambah Bagian" untuk membuat daftar syarat baru.</div>
        </div>
      </div>
      <MobileAdminList v-else :rows="store.admin" />
    </div>

    <!-- Web -->
    <div v-else id="adminBody">
      <div v-if="!store.admin.length" class="card">
        <div class="empty">
          <div class="big">Belum ada bagian</div>
          <div>Klik "Tambah Bagian" untuk membuat daftar syarat baru.</div>
        </div>
      </div>

      <div v-for="g in store.admin" :key="g.id" class="card adm-group" :class="'adm-grp-' + grupAccent(g.grup)" :data-gid="g.id">
        <div class="adm-group-head">
          <input type="text" class="adm-grup-name" :value="g.grup" placeholder="Nama bagian..." @input="e => { g.grup = e.target.value; store.saveA() }" @blur="onGrupBlur(g)">
          <span class="adm-badge">{{ g.items.filter(i => i.status).length }}/{{ g.items.length }}</span>
          <button class="icon-btn adm-add-item" @click="addItem(g)" title="Tambah syarat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Syarat
          </button>
          <button class="icon-btn" @click="delGroup(g)" title="Hapus bagian">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="adm-head"><div>No</div><div>Syarat</div><div>Status</div><div></div></div>
        <div class="adm-rows">
          <div v-if="!g.items.length" class="empty" style="padding:28px 20px"><div>Belum ada syarat di bagian ini.</div></div>
          <div v-for="(it, i) in g.items" :key="it.id" class="adm-row" :class="{ done: it.status }" :data-gid="g.id" :data-id="it.id">
            <div class="adm-no">{{ i + 1 }}</div>
            <div class="adm-syarat">
              <input type="text" :value="it.syarat" placeholder="Tulis syarat..." @input="e => { it.syarat = e.target.value; store.saveA() }" @blur="onSyaratBlur(g, it)">
            </div>
            <div class="adm-stat">
              <SwitchToggle :model-value="!!it.status" title="Sudah lengkap?" @update:model-value="v => onToggle(it, v)" />
              <span class="v-lbl">{{ it.status ? 'Sudah' : 'Belum' }}</span>
            </div>
            <div class="adm-act r">
              <button class="icon-btn" @click="delItem(g, it)" title="Hapus syarat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import SwitchToggle from '../components/SwitchToggle.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileAdminList from '../mobile layout/MobileAdminList.vue'
import TourBtn from '../components/TourBtn.vue'

const store     = useWeddingStore()
const importRef = ref(null)
const isMobile  = useIsMobile()

const ADMIN_STEPS = [
  {
    selector: '#panel-admin .stat-grid',
    icon: '📄',
    title: 'Progres Dokumen',
    desc: 'Total syarat dokumen, berapa yang sudah dilengkapi, dan progress bar persentasenya. Semua dihitung otomatis dari status di setiap baris.',
  },
  {
    selector: '#panel-admin .adm-info',
    icon: 'ℹ️',
    title: 'Template KUA',
    desc: 'Template ini sudah diisi berdasarkan persyaratan umum KUA. Nama dokumen bisa diedit langsung, dan kamu bisa tambah atau hapus item sesuai kebutuhan daerahmu.',
  },
  {
    selector: '#panel-admin .controls',
    icon: '➕',
    title: 'Tambah Bagian',
    desc: 'Dokumen dikelompokkan per bagian, misalnya "Dokumen Pria" atau "Dokumen Wanita". Ketuk Tambah Bagian untuk membuat grup baru.',
  },
  {
    selector: '.adm-group, .mad-group',
    icon: '📁',
    title: 'Kartu Bagian',
    desc: 'Setiap bagian adalah satu grup dokumen. Header bagian berwarna untuk membedakan pihak — edit nama bagian langsung di sana.',
  },
  {
    selector: '.adm-group-head, .mad-head',
    icon: '🗂️',
    title: 'Header Bagian',
    desc: 'Angka di kanan menunjukkan progres dokumen per bagian. Ketuk + untuk menambah syarat/dokumen baru ke dalam bagian ini.',
  },
  {
    selector: '.adm-row, .mad-row',
    icon: '☑️',
    title: 'Baris Syarat',
    desc: 'Setiap baris adalah satu dokumen atau syarat. Edit nama langsung di sini, lalu aktifkan toggle saat dokumen sudah dilengkapi.',
  },
]

function grupAccent(name) {
  if (/wanita/i.test(name)) return 'wanita'
  if (/pria/i.test(name)) return 'pria'
  return ''
}

const total = computed(() => store.admin.reduce((s, g) => s + g.items.length, 0))
const done  = computed(() => store.admin.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const pct   = computed(() => total.value ? Math.round(done.value / total.value * 100) : 0)

function nextGroupId() { return store.admin.length ? Math.max(...store.admin.map(g => g.id)) + 1 : 1 }
function nextItemId(g) { return g.items.length ? Math.max(...g.items.map(i => i.id)) + 1 : 1 }

async function addGroup() {
  const id = nextGroupId()
  store.admin.push({ id, grup: '', items: [] })
  store.saveA()
  await nextTick()
  const sel = isMobile.value
    ? `.mad-group[data-gid="${id}"] .mad-grup-name`
    : `.adm-group[data-gid="${id}"] .adm-grup-name`
  const el = document.querySelector(sel)
  if (el) { el.scrollIntoView({ block: 'center' }); el.focus() }
}

function onGrupBlur(g) {
  if (!g.grup.trim() && !g.items.length) {
    store.admin = store.admin.filter(x => x.id !== g.id)
    store.saveA()
  }
}

async function addItem(g) {
  g.items.push({ id: nextItemId(g), syarat: '', status: false })
  store.saveA()
  await nextTick()
  const inputs = document.querySelectorAll(`.adm-group[data-gid="${g.id}"] .adm-row input[data-af='syarat'], .adm-group[data-gid="${g.id}"] .adm-syarat input`)
  if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: 'center' }); last.focus() }
}

function onToggle(it, val) {
  it.status = val
  store.saveA()
}

function onSyaratBlur(g, it) {
  if (!it.syarat.trim()) {
    g.items = g.items.filter(x => x.id !== it.id)
    store.saveA()
  }
}

function delItem(g, it) {
  g.items = g.items.filter(x => x.id !== it.id)
  store.saveA()
}

function delGroup(g) {
  store.delAdminGroup(g.id)
}

function onImport(e) {
  const f = e.target.files?.[0]
  if (f) store.importTab('admin', f)
  e.target.value = ''
}
</script>

<style scoped>
.adm-group-head {
  background: var(--plum) !important;
  border-bottom: 1px solid rgba(255,255,255,.15) !important;
}
.adm-grup-name {
  color: var(--gold) !important;
  font-size: 18px !important;
  background: transparent !important;
  border-color: transparent !important;
}
.adm-grup-name:focus { background: rgba(255,255,255,.12) !important; border-color: rgba(255,255,255,.3) !important; outline: none !important; box-shadow: none !important; }
.adm-badge { color: var(--plum) !important; }
.adm-group-head .icon-btn {
  background: transparent !important;
  border-color: rgba(255,255,255,.3) !important;
  color: rgba(255,255,255,.85) !important;
}
.adm-group-head .icon-btn:hover {
  background: rgba(255,255,255,.15) !important;
  border-color: rgba(255,255,255,.55) !important;
  color: #fff !important;
}

.adm-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #EDF4F3;
  border: 1px solid #B8D8D4;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #0A1D4B;
  line-height: 1.5;
  margin-bottom: 14px;
}
.adm-info svg { flex-shrink: 0; margin-top: 2px; }
</style>
