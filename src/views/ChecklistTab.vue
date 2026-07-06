<template>
  <section class="panel active" id="panel-checklist">
    <div class="stat-grid">
      <div class="stat"><div class="accent a-plum"></div><div class="num">{{ total }}</div><div class="lbl">Total Tugas</div></div>
      <div class="stat"><div class="accent a-teal"></div><div class="num">{{ done }}</div><div class="lbl">Selesai</div></div>
      <div class="stat"><div class="accent a-rose"></div><div class="num">{{ total - done }}</div><div class="lbl">Belum Selesai</div></div>
    </div>
    <div class="b-prog-wrap">
      <div class="b-prog-bar"><div class="b-prog-fill" :style="{ width: pct + '%', background: '#CD9F65' }"></div></div>
      <span class="b-prog-pct">{{ pct }}% selesai</span>
    </div>

    <div class="controls">
      <button class="icon-btn solid" @click="addFase">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Fase
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('checklist')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="CHECKLIST_STEPS" />
    </div>

    <div id="checklistBody">
      <div v-if="!store.checklist.length" class="card">
        <div class="empty">
          <div class="big">Belum ada fase</div>
          <div>Klik "Tambah Fase" untuk membuat daftar tugas baru.</div>
        </div>
      </div>

      <div v-else class="ck-grid" ref="ckGrid">
        <div
          v-for="g in store.checklist"
          :key="g.id"
          class="card ck-fase"
          :data-gid="g.id"
          draggable="false"
          @dragstart="onDragStart($event, g)"
          @dragover.prevent="onDragOver($event)"
          @dragend="onDragEnd"
        >
          <div class="ck-fase-head">
            <span class="ck-drag" title="Seret untuk pindah urutan" @mousedown="enableDrag($event, g)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2.1"/><circle cx="15" cy="5" r="2.1"/><circle cx="9" cy="12" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="9" cy="19" r="2.1"/><circle cx="15" cy="19" r="2.1"/></svg>
            </span>
            <div class="ck-fase-label">
              <input type="text" class="ck-fase-name" :value="g.fase" placeholder="Nama fase..." @input="e => { g.fase = e.target.value; store.saveCK() }">
              <span v-if="faseTargetDate(g.fase)" class="ck-fase-date">{{ faseTargetDate(g.fase) }}</span>
            </div>
            <span class="ck-badge">{{ g.items.filter(i => i.status).length }}/{{ g.items.length }}</span>
            <button class="icon-btn ck-add-item" @click="addTugas(g)" title="Tambah tugas">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            </button>
            <button class="icon-btn del-fase-btn" @click="delFase(g)" title="Hapus fase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <div class="ck-rows">
            <div v-if="!g.items.length" class="empty" style="padding:24px 16px"><div>Belum ada tugas di fase ini.</div></div>
            <div v-for="it in g.items" :key="it.id" class="ck-row" :class="{ done: it.status }" :data-gid="g.id" :data-id="it.id">
              <SwitchToggle :model-value="!!it.status" title="Selesai?" @update:model-value="v => onToggle(it, v)" />
              <div class="ck-tugas">
                <input type="text" :value="it.tugas" placeholder="Tulis tugas..." @input="e => { it.tugas = e.target.value; store.saveCK() }" @blur="onTugasBlur(g, it)">
              </div>
              <button class="icon-btn del-tugas-btn" @click="delTugas(g, it)" title="Hapus tugas">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import SwitchToggle from '../components/SwitchToggle.vue'
import TourBtn from '../components/TourBtn.vue'

const CHECKLIST_STEPS = [
  {
    selector: '#panel-checklist .stat-grid',
    icon: '✅',
    title: 'Progres Checklist',
    desc: 'Total tugas, berapa yang selesai, dan progress bar di bawahnya — semua update otomatis tiap tugas di-centang.',
  },
  {
    selector: '#panel-checklist .controls',
    icon: '➕',
    title: 'Tambah Fase',
    desc: 'Checklist dikelompokkan per fase waktu, misalnya "6 Bulan Sebelum" atau "H-1 Minggu". Ketuk Tambah Fase untuk membuat grup baru.',
  },
  {
    selector: '#panel-checklist .ck-fase',
    icon: '📁',
    title: 'Kartu Fase',
    desc: 'Setiap fase adalah satu grup tugas. Kalau nama fase mengandung waktu seperti "3 Bulan Sebelum", tanggal target otomatis muncul di bawah namanya.',
  },
  {
    selector: '#panel-checklist .ck-fase-head',
    icon: '🗂️',
    title: 'Header Fase',
    desc: 'Edit nama fase langsung di sini. Angka di kanan menunjukkan progres tugas per fase. Ketuk + untuk tambah tugas baru ke fase ini.',
  },
  {
    selector: '#panel-checklist .ck-row',
    icon: '☑️',
    title: 'Baris Tugas',
    desc: 'Aktifkan toggle untuk tandai tugas selesai. Ketuk teksnya untuk edit. Baris yang dikosongkan akan terhapus otomatis saat kamu klik di luar.',
  },
]

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

const store   = useWeddingStore()
const ckGrid  = ref(null)
const importRef = ref(null)

function faseTargetDate(faseName) {
  const wDate = store.couple?.tanggal
  if (!wDate) return null
  const m1 = faseName.match(/^(\d+)\s*[Bb]ulan\s*[Ss]ebelum/i)
  const m2 = faseName.match(/^[Hh]-(\d+)\s*[Bb]ulan/i)
  const months = m1 ? parseInt(m1[1]) : m2 ? parseInt(m2[1]) : null
  if (!months) return null
  const d = new Date(wDate + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

let dragCard = null
let dragGid  = null

const total = computed(() => store.checklist.reduce((s, g) => s + g.items.length, 0))
const done  = computed(() => store.checklist.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const pct   = computed(() => total.value ? Math.round(done.value / total.value * 100) : 0)

function nextFaseId()    { return store.checklist.length ? Math.max(...store.checklist.map(g => g.id)) + 1 : 1 }
function nextTugasId(g)  { return g.items.length ? Math.max(...g.items.map(i => i.id)) + 1 : 1 }

function addFase() {
  const name = prompt('Nama fase baru (cth: Hari-H, H-1 Minggu, dll):')
  if (!name?.trim()) return
  store.checklist.push({ id: nextFaseId(), fase: name.trim(), items: [] })
  store.saveCK()
}

async function addTugas(g) {
  g.items.push({ id: nextTugasId(g), tugas: '', status: false })
  store.saveCK()
  await nextTick()
  const inputs = document.querySelectorAll(`.ck-fase[data-gid="${g.id}"] .ck-row input`)
  if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: 'center' }); last.focus() }
}

function onToggle(it, val) {
  it.status = val
  store.saveCK()
}

function onTugasBlur(g, it) {
  if (!it.tugas.trim()) {
    g.items = g.items.filter(x => x.id !== it.id)
    store.saveCK()
  }
}

function delTugas(g, it) {
  g.items = g.items.filter(x => x.id !== it.id)
  store.saveCK()
}

function delFase(g) {
  if (!confirm(`Hapus fase "${g.fase}" beserta semua tugasnya?`)) return
  store.checklist.splice(store.checklist.findIndex(x => x.id === g.id), 1)
  store.saveCK()
}

// Drag reorder
function enableDrag(e, g) {
  const card = e.target.closest('.ck-fase')
  if (card) { card.draggable = true; dragGid = g.id }
}

function onDragStart(e, g) {
  dragCard = e.currentTarget
  dragGid  = g.id
  dragCard.classList.add('dragging')
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e) {
  if (!dragCard || !ckGrid.value) return
  const cards = [...ckGrid.value.querySelectorAll('.ck-fase:not(.dragging)')]
  let best = null, bestDist = Infinity, before = true
  cards.forEach(card => {
    const r = card.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const d = Math.hypot(e.clientX - cx, e.clientY - cy)
    if (d < bestDist) { bestDist = d; best = card; before = (e.clientY < cy - 6) || (Math.abs(e.clientY - cy) <= r.height / 2 && e.clientX < cx) }
  })
  if (best && best !== dragCard) ckGrid.value.insertBefore(dragCard, before ? best : best.nextSibling)
}

function onDragEnd() {
  if (!dragCard) return
  dragCard.classList.remove('dragging')
  dragCard.draggable = false
  dragCard = null
  if (ckGrid.value) {
    const ids = [...ckGrid.value.querySelectorAll('.ck-fase')].map(c => parseInt(c.dataset.gid))
    store.checklist.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    store.saveCK()
  }
}

document.addEventListener('mouseup', () => {
  if (!dragCard && ckGrid.value) {
    ckGrid.value.querySelectorAll('.ck-fase[draggable="true"]').forEach(c => c.draggable = false)
  }
})

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('checklist', f)
  e.target.value = ''
}
</script>

<style scoped>
.ck-fase-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ck-fase-name { width: 100%; }

.ck-fase-date {
  font-size: 11px;
  color: var(--muted);
  font-weight: 400;
  padding-left: 2px;
  letter-spacing: .01em;
}
</style>
