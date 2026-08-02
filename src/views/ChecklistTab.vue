<template>
  <section class="panel active" id="panel-checklist">
    <!-- Hero — satu-satunya card besar, fokus ke progress checklist -->
    <div class="ch-hero">
      <div class="ch-hero-title">✅ Checklist Persiapan</div>

      <div class="ch-hero-progress">
        <div class="ch-hero-bar"><div class="ch-hero-bar-fill" :style="{ width: pct + '%' }"></div></div>
        <div class="ch-hero-pct-row">
          <span class="ch-hero-pct">{{ pct }}%</span>
          <span class="ch-hero-pct-lbl">tugas selesai</span>
        </div>
      </div>

      <div class="ch-hero-stats">
        <div class="ch-hero-stat">
          <div class="ch-hero-stat-val">{{ total }}</div>
          <div class="ch-hero-stat-lbl">Total Tugas</div>
        </div>
        <div class="ch-hero-stat">
          <div class="ch-hero-stat-val">{{ done }}</div>
          <div class="ch-hero-stat-lbl">Selesai</div>
        </div>
        <div class="ch-hero-stat">
          <div class="ch-hero-stat-val">{{ total - done }}</div>
          <div class="ch-hero-stat-lbl">Belum Selesai</div>
        </div>
      </div>

      <div class="ch-hero-insight" :class="'tone-' + insight.tone">
        <span>{{ insight.icon }}</span>{{ insight.text }}
      </div>
    </div>

    <!-- Mini card — info pendukung, sengaja kecil & sekunder dari Hero -->
    <div class="ch-mini-grid">
      <div class="ch-mini">
        <span class="ch-mini-ico">📋</span>
        <div><div class="ch-mini-val">{{ total }}</div><div class="ch-mini-lbl">Total Tugas</div></div>
      </div>
      <div class="ch-mini">
        <span class="ch-mini-ico">✅</span>
        <div><div class="ch-mini-val">{{ done }}</div><div class="ch-mini-lbl">Sudah Selesai</div></div>
      </div>
      <div class="ch-mini">
        <span class="ch-mini-ico">⏳</span>
        <div><div class="ch-mini-val">{{ total - done }}</div><div class="ch-mini-lbl">Belum Selesai</div></div>
      </div>
      <div v-if="deadlineThisWeek > 0" class="ch-mini">
        <span class="ch-mini-ico">📅</span>
        <div><div class="ch-mini-val">{{ deadlineThisWeek }}</div><div class="ch-mini-lbl">Deadline Minggu Ini</div></div>
      </div>
    </div>

    <div class="controls">
      <button class="icon-btn solid" @click="openAddKategori">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Kategori
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
          <div class="big">Belum ada kategori</div>
          <div>Klik "Tambah Kategori" untuk membuat daftar tugas baru.</div>
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
            <span class="ck-kat-icon">{{ kategoriIcon(g.kategori) }}</span>
            <div class="ck-fase-label">
              <input type="text" class="ck-fase-name" :value="g.kategori" placeholder="Nama kategori..." @input="e => { g.kategori = e.target.value; store.saveCK() }">
            </div>
            <span class="ck-badge">{{ g.items.filter(i => i.status).length }}/{{ g.items.length }}</span>
            <button class="icon-btn ck-collapse-btn" :class="{ open: !isCollapsed(g.id) }" @click="toggleCollapse(g.id)" title="Buka/tutup kategori">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button class="icon-btn ck-add-item" @click="addTugas(g)" title="Tambah tugas">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            </button>
            <button class="icon-btn del-fase-btn" @click="delKategori(g)" title="Hapus kategori">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <div class="ck-rows" v-show="!isCollapsed(g.id)">
            <div v-if="!g.items.length" class="empty" style="padding:24px 16px"><div>Belum ada tugas di kategori ini.</div></div>
            <div v-for="it in g.items" :key="it.id" class="ck-item-wrap">
              <div class="ck-row-v" :class="{ done: it.status }" :data-gid="g.id" :data-id="it.id">
                <SwitchToggle class="ck-v-toggle" :model-value="!!it.status" title="Selesai?" @update:model-value="v => onToggle(it, v)" />

                <div class="ck-v-body">
                  <textarea v-if="isEditingTugas(it.id)" class="ck-tugas-input" :data-id="it.id" rows="1" :value="it.tugas" placeholder="Tulis tugas..." @input="e => onTugasInput(e, it)" @blur="stopEditTugas(g, it)"></textarea>
                  <div v-else class="ck-tugas-text" :class="{ done: it.status }" @click="startEditTugas(it.id)">{{ it.tugas || 'Tulis tugas...' }}</div>

                  <input v-if="editingDeadlineIds.has(it.id)" class="ck-deadline-input" type="date" :value="it.deadline || ''" :data-id="it.id" @change="e => onDeadline(it, e.target.value)" @blur="stopEditDeadline(it.id)">
                  <div v-else-if="it.deadline" class="ck-deadline-line" :class="{ late: deadlineInfo(it).late }" @click="startEditDeadline(it.id)">
                    📅 {{ deadlineInfo(it).text }}<span v-if="deadlineInfo(it).rel"> • {{ deadlineInfo(it).rel }}</span>
                  </div>

                  <div v-if="isEditingNote(it.id)" class="ck-note-edit">
                    <input class="ck-note-input" :data-id="it.id" type="text" :value="it.catatan" placeholder="Catatan singkat..." @input="e => onCatatan(it, e.target.value)" @blur="stopEditNote(it.id)" @keyup.enter="stopEditNote(it.id)">
                  </div>
                  <div v-else-if="hasNote(it)" class="ck-note-line" @click="startEditNote(it.id)">📝 {{ it.catatan }}</div>

                  <div v-if="showDeadlineAdd(it) || showNoteAdd(it)" class="ck-v-extra">
                    <button v-if="showDeadlineAdd(it)" class="ck-add-mini" title="Tambah deadline" @click="startEditDeadline(it.id)">📅 Deadline</button>
                    <button v-if="showNoteAdd(it)" class="ck-add-mini" title="Tambah catatan" @click="startEditNote(it.id)">📝 Catatan</button>
                  </div>
                </div>

                <button class="icon-btn del-tugas-btn item-action-btn" @click="delTugas(g, it)" title="Hapus tugas">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" :class="{ show: showAddKategori }" @click.self="showAddKategori = false">
      <div class="modal ck-add-modal" v-if="showAddKategori">
        <h3>Tambah Kategori</h3>
        <div class="sub">Buat kategori agar checklist lebih rapi dan mudah dikelola.</div>

        <div class="field">
          <label>Nama Kategori</label>
          <input ref="kategoriInputEl" type="text" v-model="newKategoriName" placeholder="Contoh: Persiapan Vendor" @keyup.enter="confirmAddKategori">
        </div>

        <div v-if="kategoriSuggestions.length" class="ck-kat-suggest">
          <button v-for="k in kategoriSuggestions" :key="k.label" type="button" class="ck-kat-chip" @click="newKategoriName = k.label">
            {{ k.icon }} {{ k.label }}
          </button>
        </div>

        <div class="modal-actions">
          <button class="ck-add-cancel" @click="showAddKategori = false">Batal</button>
          <button class="btn" :disabled="!newKategoriName.trim()" @click="confirmAddKategori">Tambah</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { daysLeft, fmtDate } from '../utils/index'
import { CHECKLIST_KATEGORI_DEFAULTS, CHECKLIST_KATEGORI_FALLBACK_ICON } from '../data/constants'
import SwitchToggle from '../components/SwitchToggle.vue'
import TourBtn from '../components/TourBtn.vue'

const CHECKLIST_STEPS = [
  {
    selector: '#panel-checklist .ch-hero',
    icon: '✅',
    title: 'Progres Checklist',
    desc: 'Total tugas, berapa yang selesai, dan progress bar di bawahnya — semua update otomatis tiap tugas di-centang.',
  },
  {
    selector: '#panel-checklist .controls',
    icon: '➕',
    title: 'Tambah Kategori',
    desc: 'Tugas dikelompokkan per kategori, misalnya "Vendor" atau "Dokumen" — bukan lagi per bulan. Ketuk Tambah Kategori untuk membuat grup baru.',
  },
  {
    selector: '#panel-checklist .ck-fase',
    icon: '📁',
    title: 'Kartu Kategori',
    desc: 'Setiap kategori adalah satu grup tugas, bisa dibuka/ditutup lewat panah di headernya. Progres kecil di kanan menunjukkan berapa tugas yang sudah selesai.',
  },
  {
    selector: '#panel-checklist .ck-row-v',
    icon: '☑️',
    title: 'Baris Tugas',
    desc: 'Aktifkan toggle untuk tandai tugas selesai. Ketuk ikon 📅 buat kasih Deadline (otomatis muncul di Agenda) atau ikon 📝 buat tambah catatan singkat.',
  },
]

const store     = useWeddingStore()
const ckGrid    = ref(null)
const importRef = ref(null)
const collapsedIds       = ref(new Set())
const editingNoteIds     = ref(new Set())
const editingDeadlineIds = ref(new Set())
const editingTugasIds    = ref(new Set())

let dragCard = null
let dragGid  = null

const total = computed(() => store.checklist.reduce((s, g) => s + g.items.length, 0))
const done  = computed(() => store.checklist.reduce((s, g) => s + g.items.filter(i => i.status).length, 0))
const pct   = computed(() => total.value ? Math.round(done.value / total.value * 100) : 0)

const insight = computed(() => {
  if (!total.value) return { icon: '✅', tone: 'info', text: 'Belum ada tugas checklist yang dicatat.' }
  if (done.value === total.value) return { icon: '🎉', tone: 'good', text: 'Selamat! Semua tugas checklist sudah selesai.' }
  return { icon: '⏳', tone: 'info', text: `Masih ada ${total.value - done.value} tugas yang perlu diselesaikan.` }
})

const deadlineThisWeek = computed(() => {
  let count = 0
  store.checklist.forEach(g => g.items.forEach(it => {
    if (!it.deadline || it.status) return
    const d = daysLeft(it.deadline)
    if (d !== null && d >= 0 && d <= 7) count++
  }))
  return count
})

function kategoriIcon(name) {
  const found = CHECKLIST_KATEGORI_DEFAULTS.find(k => k.label.toLowerCase() === (name || '').trim().toLowerCase())
  return found ? found.icon : CHECKLIST_KATEGORI_FALLBACK_ICON
}

function isCollapsed(id) { return collapsedIds.value.has(id) }
function toggleCollapse(id) {
  const s = new Set(collapsedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  collapsedIds.value = s
}

const showAddKategori  = ref(false)
const newKategoriName  = ref('')
const kategoriInputEl  = ref(null)

const kategoriSuggestions = computed(() => {
  const existing = new Set(store.checklist.map(g => (g.kategori || '').trim().toLowerCase()))
  return CHECKLIST_KATEGORI_DEFAULTS.filter(k => !existing.has(k.label.toLowerCase()))
})

function openAddKategori() {
  newKategoriName.value = ''
  showAddKategori.value = true
  nextTick(() => kategoriInputEl.value?.focus())
}

async function confirmAddKategori() {
  const name = newKategoriName.value.trim()
  if (!name) return
  showAddKategori.value = false
  await store.addChecklistGroup(name)
}

async function addTugas(g) {
  const row = await store.addChecklistItem(g.id)
  if (!row) return
  startEditTugas(row.id)
}

function onToggle(it, val) {
  it.status = val
  store.saveCK()
}

function onDeadline(it, val) {
  // kolom deadline di DB bertipe date — string kosong dari <input type="date">
  // yang di-clear harus jadi null, bukan '' (Postgres nolak '' sbg date).
  it.deadline = val || null
  store.saveCK()
}

function deadlineInfo(it) {
  const d = daysLeft(it.deadline)
  let rel = ''
  if (!it.status) {
    if (d === 0) rel = 'Hari ini'
    else if (d > 0) rel = `${d} hari lagi`
    else rel = `Terlambat ${Math.abs(d)} hari`
  }
  return { text: fmtDate(it.deadline), rel, late: !it.status && d < 0 }
}
function startEditDeadline(id) {
  const s = new Set(editingDeadlineIds.value); s.add(id); editingDeadlineIds.value = s
  nextTick(() => {
    const el = document.querySelector(`.ck-deadline-input[data-id="${id}"]`)
    el?.focus()
    el?.showPicker?.()
  })
}
function stopEditDeadline(id) {
  const s = new Set(editingDeadlineIds.value); s.delete(id); editingDeadlineIds.value = s
}
function showDeadlineAdd(it) { return !it.deadline && !editingDeadlineIds.value.has(it.id) }
function showNoteAdd(it) { return !hasNote(it) && !editingNoteIds.value.has(it.id) }

function autoGrow(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
function isEditingTugas(id) { return editingTugasIds.value.has(id) }
function startEditTugas(id) {
  const s = new Set(editingTugasIds.value); s.add(id); editingTugasIds.value = s
  nextTick(() => {
    const el = document.querySelector(`.ck-tugas-input[data-id="${id}"]`)
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    autoGrow(el)
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
function stopEditTugas(g, it) {
  const s = new Set(editingTugasIds.value); s.delete(it.id); editingTugasIds.value = s
  onTugasBlur(g, it)
}
function onTugasInput(e, it) {
  it.tugas = e.target.value
  store.saveCK()
  autoGrow(e.target)
}

function hasNote(it) { return !!(it.catatan || '').trim() }
function isEditingNote(id) { return editingNoteIds.value.has(id) }
function startEditNote(id) {
  const s = new Set(editingNoteIds.value); s.add(id); editingNoteIds.value = s
  nextTick(() => document.querySelector(`.ck-note-input[data-id="${id}"]`)?.focus())
}
function stopEditNote(id) {
  const s = new Set(editingNoteIds.value); s.delete(id); editingNoteIds.value = s
}
function onCatatan(it, val) {
  it.catatan = val
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

async function delKategori(g) {
  const ok = await store.askConfirm({
    title: 'Hapus kategori?',
    message: `Kategori "${g.kategori}" beserta semua tugasnya akan dihapus.`,
    confirmLabel: 'Hapus',
  })
  if (!ok) return
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
    store.checklist.forEach((g, i) => { g.position = i })
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
/* ── Hero — satu-satunya card besar, fokus ke progress checklist ── */
.ch-hero {
  position: relative;
  background: linear-gradient(135deg, var(--paper) 55%, var(--gold-soft) 160%);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 24px 24px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05), 0 14px 34px rgba(36, 8, 8, .07);
}
.ch-hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  font-weight: 600;
  color: var(--plum);
  margin-bottom: 18px;
}
.ch-hero-progress { margin-bottom: 18px; }
.ch-hero-bar { height: 9px; background: var(--ivory); border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
.ch-hero-bar-fill { height: 100%; background: linear-gradient(90deg, #E5C99A, #CD9F65); border-radius: 100px; transition: width .5s cubic-bezier(.22,1,.36,1); }
.ch-hero-pct-row { display: flex; align-items: baseline; gap: 7px; }
.ch-hero-pct { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 700; color: var(--ink); }
.ch-hero-pct-lbl { font-size: 12.5px; color: var(--muted); }

.ch-hero-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  margin-bottom: 16px;
}
.ch-hero-stat { flex: 1; min-width: 96px; }
.ch-hero-stat-val { font-family: 'Jost', sans-serif; font-size: 19px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
.ch-hero-stat-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; }

.ch-hero-insight {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  padding: 11px 14px;
  border-radius: 12px;
}
.ch-hero-insight.tone-info { background: var(--gold-soft); color: #6b4f1f; }
.ch-hero-insight.tone-good { background: #EAF3DE; color: #2b5010; }

/* ── Modal Tambah Kategori ── */
.ck-add-modal { max-width: 420px; }
.ck-kat-suggest {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: -6px 0 18px;
}
.ck-kat-chip {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink);
  background: var(--ivory);
  border: 1.5px solid var(--line);
  border-radius: 100px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.ck-kat-chip:hover { background: var(--gold-soft); border-color: var(--gold); }
.ck-add-modal .btn:disabled { opacity: .45; cursor: default; }
.ck-add-modal .btn:disabled:hover { background: var(--plum); }
.ck-add-cancel {
  flex: none;
  padding: 0 20px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--ivory);
  color: var(--ink);
  font-family: 'Jost', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.ck-add-cancel:hover { background: #fff; border-color: var(--muted); }

/* ── Mini card — info pendukung, sengaja kecil & sekunder dari Hero ── */
.ch-mini-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.ch-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
}
.ch-mini-ico { flex: none; font-size: 19px; }
.ch-mini-val { font-family: 'Jost', sans-serif; font-size: 15.5px; font-weight: 700; color: var(--ink); line-height: 1.15; font-variant-numeric: tabular-nums; }
.ch-mini-lbl { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; margin-top: 2px; }

/* ── Kategori ── */
.ck-kat-icon { flex: none; font-size: 17px; }
.ck-collapse-btn {
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent !important;
  border-color: rgba(255,255,255,.3) !important;
  color: rgba(255,255,255,.85) !important;
  transition: transform .15s, background .15s;
}
.ck-collapse-btn.open svg { transform: rotate(180deg); }
.ck-collapse-btn svg { transition: transform .15s; }
.ck-collapse-btn:hover { background: rgba(255,255,255,.15) !important; }

/* ── Item tugas: layout vertikal — nama tugas jadi fokus utama, deadline
   & catatan di bawahnya sebagai info pendukung ringan (bukan sebaris). ── */
.ck-item-wrap:not(:last-child) { border-bottom: 1px solid var(--line); }
.ck-row-v {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  transition: background .15s;
}
.ck-row-v:hover { background: var(--ivory); }
.ck-row-v.done { background: rgba(205,159,101,.10); }
.ck-row-v.done:hover { background: rgba(61,80,39,.12); }
.ck-v-toggle { flex: none; margin-top: 2px; }
.ck-row-v .del-tugas-btn { margin-top: 2px; }
.ck-v-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ck-tugas-text {
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--ink);
  cursor: text;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  padding: 2px 0;
}
.ck-tugas-text.done { color: var(--muted); text-decoration: line-through; }
.ck-tugas-input {
  width: 100%;
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--ink);
  border: 1.5px solid var(--gold);
  background: #fff;
  border-radius: 8px;
  padding: 5px 8px;
  resize: none;
  overflow: hidden;
  outline: none;
  box-shadow: 0 0 0 3px var(--gold-soft);
}

.ck-deadline-line, .ck-note-line {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
  cursor: pointer;
  word-break: break-word;
}
.ck-deadline-line:hover, .ck-note-line:hover { color: var(--plum); }
.ck-deadline-line.late { color: var(--rose); font-weight: 600; }
.ck-row-v.done .ck-deadline-line { color: var(--muted); font-weight: 400; }

.ck-deadline-input {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  color: var(--ink);
  border: 1.5px solid var(--gold);
  background: #fff;
  border-radius: 8px;
  padding: 4px 6px;
  align-self: flex-start;
}

.ck-note-edit input {
  width: 100%;
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  color: var(--ink);
  background: var(--ivory);
  border: 1.5px solid var(--line);
  border-radius: 8px;
  padding: 6px 10px;
  transition: .15s;
}
.ck-note-edit input:focus { outline: none; border-color: var(--gold); background: #fff; }

.ck-v-extra { display: flex; gap: 4px; margin-top: 1px; }
.ck-add-mini {
  flex: none;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 11.5px;
  font-family: 'Jost', sans-serif;
  cursor: pointer;
  border-radius: 6px;
  padding: 3px 7px;
  opacity: .75;
  transition: background .15s, opacity .15s;
}
.ck-add-mini:hover { background: var(--ivory); opacity: 1; }

.ck-fase-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ck-fase-name { width: 100%; }
</style>
