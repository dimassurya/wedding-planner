<template>
  <section class="panel active" id="panel-timeline">
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg></div>
        <div class="num">{{ store.timeline.length }}</div><div class="lbl">Total tugas</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ done }}</div><div class="lbl">Selesai</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="num">{{ inProc }}</div><div class="lbl">Sedang dikerjakan</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg></div>
        <div class="num">{{ overdue }}</div><div class="lbl">Terlambat</div>
      </div>
    </div>
    <div class="b-prog-wrap">
      <div class="b-prog-bar"><div class="b-prog-fill" :style="{ width: pct + '%', background: '#CD9F65' }"></div></div>
      <span class="b-prog-pct">{{ pct }}% selesai</span>
    </div>

    <div class="controls">
      <button class="icon-btn solid" @click="addTask">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Tugas
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('timeline')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="TIMELINE_STEPS" />
    </div>

    <!-- Mobile: daftar kartu minimalis -->
    <MobileTimelineList v-if="isMobile" :rows="rows" v-model:editId="mobileEditId" />

    <!-- Web: tabel -->
    <div v-else class="card table-card">
      <div class="table-scroll">
      <div class="tl-head">
        <div>No</div><div>Tugas</div>
        <div class="ld">Deadline</div>
        <div class="ls">Status</div>
        <div class="lp">P.Jawab</div>
        <div class="lf">Tgl Selesai</div>
        <div class="lc">Catatan</div>
        <div class="tl-act"></div>
      </div>

      <div v-if="!rows.length" class="empty">
        <div class="big">Belum ada tugas</div>
        <div>Klik "Tambah Tugas" untuk mulai, atau isi jatuh tempo di tab Budget.</div>
      </div>

      <!-- Auto rows (from Budget) -->
      <template v-for="(r, i) in rows" :key="r.auto ? 'auto-' + i : r.id">
        <!-- Budget auto row -->
        <div v-if="r.auto" class="tl-row tl-auto" :class="{ 'tl-overdue': isOverdue(r) }">
          <div class="tl-no">{{ i + 1 }}</div>
          <div class="tl-tugas"><span class="tl-src">Budget</span><span class="tl-auto-name">{{ r.tugas }}</span></div>
          <div class="bm-lbl ld">Deadline</div>
          <div class="tl-cell tl-ro">{{ fmtDate(r.deadline) }}</div>
          <div class="bm-lbl ls">Status</div>
          <div class="tl-cell">
            <span class="chip" :style="{ background: TL_STATUS[r.status].bg, color: TL_STATUS[r.status].text }">
              <span class="cdot" :style="{ background: TL_STATUS[r.status].color }"></span>
              {{ TL_STATUS[r.status].label }}
            </span>
          </div>
          <div class="bm-lbl lp">Penanggung Jawab</div>
          <div class="tl-cell tl-ro">—</div>
          <div class="bm-lbl lf">Tgl Selesai</div>
          <div class="tl-cell tl-ro">—</div>
          <div class="bm-lbl lc">Catatan</div>
          <div class="tl-catatan tl-ro">{{ r.catatan }}</div>
          <div class="tl-act"></div>
        </div>

        <!-- Manual row -->
        <div v-else class="tl-row" :class="{ 'tl-overdue': isOverdue(r) }" :data-id="r.id">
          <div class="tl-no">{{ i + 1 }}</div>
          <div class="tl-tugas">
            <input type="text" :value="r.tugas" placeholder="Nama tugas..." @input="e => onText(r, 'tugas', e.target.value)" @blur="onTugasBlur(r)">
          </div>
          <div class="bm-lbl ld">Deadline</div>
          <div class="tl-cell">
            <input type="date" :value="r.deadline" @change="e => onChange(r, 'deadline', e.target.value)">
          </div>
          <div class="bm-lbl ls">Status</div>
          <div class="tl-cell">
            <select class="tl-status" :class="'tl-st-' + r.status" :value="r.status" @change="e => onStatusChange(r, e.target.value)">
              <option v-for="(st, k) in TL_STATUS" :key="k" :value="k">{{ st.label }}</option>
            </select>
          </div>
          <div class="bm-lbl lp">Penanggung Jawab</div>
          <div class="tl-cell">
            <select class="tl-pic" :class="'tl-pic-' + (r.pic || 'none')" :value="r.pic" @change="e => onChange(r, 'pic', e.target.value)">
              <option value="">—</option>
              <option v-for="(p, k) in TL_PIC" :key="k" :value="k">{{ p.label }}</option>
            </select>
          </div>
          <div class="bm-lbl lf">Tgl Selesai</div>
          <div class="tl-cell">
            <input v-if="r.status === 'selesai'" type="date" :value="r.tanggalSelesai" @change="e => onChange(r, 'tanggalSelesai', e.target.value)">
            <span v-else class="tl-ro">—</span>
          </div>
          <div class="bm-lbl lc">Catatan</div>
          <div class="tl-catatan">
            <input type="text" :value="r.catatan" placeholder="—" @input="e => onText(r, 'catatan', e.target.value)">
          </div>
          <div class="tl-act">
            <button class="icon-btn item-action-btn del" @click="delTask(r)" title="Hapus tugas">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmtDate } from '../utils/index'
import { TL_STATUS, TL_PIC } from '../data/constants'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileTimelineList from '../mobile layout/MobileTimelineList.vue'
import TourBtn from '../components/TourBtn.vue'

const store        = useWeddingStore()
const importRef    = ref(null)
const isMobile     = useIsMobile()
const mobileEditId = ref(null)

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'timeline') addTask()
})

const TIMELINE_STEPS = computed(() => [
  {
    selector: '#panel-timeline .stat-grid',
    icon: '📅',
    title: 'Status Timeline',
    desc: 'Empat angka sekaligus: total tugas, sudah selesai, sedang dikerjakan, dan yang sudah lewat deadline.',
  },
  {
    selector: '#panel-timeline .controls',
    icon: '➕',
    title: 'Tambah Tugas',
    desc: 'Buat tugas baru secara manual. Isi deadline, status, penanggung jawab, dan catatan langsung di barisnya.',
  },
  {
    selector: isMobile.value ? '.mtl-card' : '.tl-row:not(.tl-auto)',
    icon: '📋',
    title: isMobile.value ? 'Kartu Tugas' : 'Baris Tugas',
    desc: isMobile.value
      ? 'Setiap kartu menampilkan nama tugas, status, deadline, dan penanggung jawab. Ketuk untuk buka detail dan edit.'
      : 'Edit semua kolom langsung di baris — deadline, status, penanggung jawab, tanggal selesai, dan catatan.',
  },
  {
    selector: '.tl-auto',
    icon: '💰',
    title: 'Tugas dari Budget',
    desc: 'Baris berlabel "Budget" muncul otomatis dari item Budget yang punya jatuh tempo. Statusnya mengikuti status bayar di tab Budget, tidak bisa diedit manual.',
  },
])

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const today = todayISO()

const done    = computed(() => store.timeline.filter(t => t.status === 'selesai').length)
const inProc  = computed(() => store.timeline.filter(t => t.status === 'sedang').length)
const overdue = computed(() => store.timeline.filter(t => t.deadline && t.deadline < today && t.status !== 'selesai').length)
const pct     = computed(() => store.timeline.length ? Math.round(done.value / store.timeline.length * 100) : 0)

const budgetRows = computed(() =>
  store.budget.filter(b => b.jatuhTempo).map(b => {
    const st = store.bStatus(b)
    const status = st.key === 'lunas' ? 'selesai' : st.key === 'dp' ? 'sedang' : 'belum'
    return { auto: true, tugas: 'Bayar: ' + (b.item || 'tanpa nama'), deadline: b.jatuhTempo, status, catatan: b.remarks || 'Jatuh tempo pembayaran' }
  })
)

const rows = computed(() => {
  const manual = store.timeline.map(t => ({ ...t, auto: false }))
  return [...manual, ...budgetRows.value].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline < b.deadline ? -1 : (a.deadline > b.deadline ? 1 : 0)
  })
})

const isOverdue = r => r.deadline && r.deadline < today && r.status !== 'selesai'

async function addTask() {
  const id = store.timeline.length ? Math.max(...store.timeline.map(t => t.id)) + 1 : 1
  store.timeline.push({ id, tugas: '', deadline: '', status: 'belum', pic: '', tanggalSelesai: '', catatan: '' })
  store.saveTL()
  // Mobile: langsung buka popup edit untuk tugas baru
  if (isMobile.value) { mobileEditId.value = id; return }
  await nextTick()
  const inputs = document.querySelectorAll('.tl-row[data-id] input[type="text"]')
  if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: 'center' }); last.focus() }
}

// rows berisi salinan ({...t}); tulis balik ke objek asli di store agar tersimpan.
function realRow(r) { return store.timeline.find(t => t.id === r.id) }

function onText(r, field, val) {
  const o = realRow(r); if (!o) return
  o[field] = val
  store.saveTL()
}

function onChange(r, field, val) {
  const o = realRow(r); if (!o) return
  o[field] = val
  store.saveTL()
}

function onStatusChange(r, val) {
  const o = realRow(r); if (!o) return
  o.status = val
  if (val === 'selesai' && !o.tanggalSelesai) o.tanggalSelesai = todayISO()
  store.saveTL()
}

function onTugasBlur(r) {
  if (!r.tugas.trim() && !r.deadline && !r.catatan) {
    store.timeline.splice(store.timeline.findIndex(x => x.id === r.id), 1)
    store.saveTL()
  }
}

function delTask(r) {
  store.delTimeline(r.id)
}

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('timeline', f)
  e.target.value = ''
}
</script>
