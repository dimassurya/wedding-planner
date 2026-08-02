<template>
  <div class="mad-wrap">
    <div v-for="g in rows" :key="g.id" class="mad-group" :class="'mad-grp-' + grupAccent(g.grup)" :data-gid="g.id">
      <div class="mad-head">
        <input
          class="mad-grup-name"
          type="text"
          :value="g.grup"
          placeholder="Nama bagian..."
          @input="e => onGrup(g, e.target.value)"
          @blur="onGrupBlur(g)"
        >
        <div class="mad-head-row">
          <span class="mad-badge">{{ g.items.filter(i => i.status).length }}/{{ g.items.length }}</span>
          <button class="mad-add" @click="addItem(g)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Syarat
          </button>
          <button class="mad-del-grp" title="Hapus bagian" @click="store.delAdminGroup(g.id)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      <div class="mad-rows">
        <div v-if="!g.items.length" class="mad-empty-row">Belum ada syarat di bagian ini.</div>
        <div v-for="it in g.items" :key="it.id" class="mad-row" :class="{ done: it.status }">
          <SwitchToggle :model-value="!!it.status" title="Sudah lengkap?" @update:model-value="v => onToggle(it, v)" />
          <div class="mad-body">
            <input
              class="mad-syarat"
              type="text"
              :value="it.syarat"
              placeholder="Tulis syarat..."
              @input="e => onSyarat(it, e.target.value)"
              @blur="onSyaratBlur(g, it)"
            >
            <input
              v-if="editingDateIds.has(it.id)"
              class="mad-date-input" type="date" :data-id="it.id"
              :value="it.tanggal || ''"
              @change="e => onTanggal(it, e.target.value)"
              @blur="stopEditDate(it.id)"
            >
            <button v-else-if="it.tanggal" class="mad-date-chip" :class="{ late: dateInfo(it).late }" @click="startEditDate(it.id)">
              📅 {{ dateInfo(it).text }}<span v-if="dateInfo(it).rel"> · {{ dateInfo(it).rel }}</span>
            </button>
            <button v-else class="mad-date-add" @click="startEditDate(it.id)">📅 Tambah Tanggal</button>
          </div>
          <button class="mad-del-item item-action-btn" title="Hapus syarat" @click="delItem(g, it)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { daysLeft, fmtDate } from '../utils/index'
import SwitchToggle from '../components/SwitchToggle.vue'

defineProps({ rows: { type: Array, default: () => [] } })

const store = useWeddingStore()

function grupAccent(name) {
  if (/wanita/i.test(name)) return 'wanita'
  if (/pria/i.test(name)) return 'pria'
  return ''
}

function onGrup(g, val) {
  g.grup = val
  store.saveA()
}

function onGrupBlur(g) {
  if (!g.grup.trim() && !g.items.length) {
    store.admin = store.admin.filter(x => x.id !== g.id)
    store.saveA()
  }
}

async function addItem(g) {
  const row = await store.addAdminItem(g.id)
  if (!row) return
  await nextTick()
  const inputs = document.querySelectorAll(`.mad-group[data-gid="${g.id}"] .mad-syarat`)
  if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: 'center' }); last.focus() }
}

function onToggle(it, val) {
  it.status = val
  store.saveA()
}

function onSyarat(it, val) {
  it.syarat = val
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

// Tanggal per syarat — sama seperti versi desktop (AdminTab.vue): rumah
// datanya di sini, tab Timeline cuma baca. Kosong wajib null (kolom date).
const editingDateIds = ref(new Set())

function onTanggal(it, val) {
  it.tanggal = val || null
  store.saveA()
}
function startEditDate(id) {
  const s = new Set(editingDateIds.value); s.add(id); editingDateIds.value = s
  nextTick(() => {
    const el = document.querySelector(`.mad-date-input[data-id="${id}"]`)
    el?.focus()
    el?.showPicker?.()
  })
}
function stopEditDate(id) {
  const s = new Set(editingDateIds.value); s.delete(id); editingDateIds.value = s
}
function dateInfo(it) {
  const d = daysLeft(it.tanggal)
  let rel = ''
  if (!it.status) {
    if (d === 0) rel = 'Hari ini'
    else if (d > 0) rel = `${d} hari lagi`
    else rel = `Terlambat ${Math.abs(d)} hari`
  }
  return { text: fmtDate(it.tanggal), rel, late: !it.status && d < 0 }
}
</script>

<style scoped>
.mad-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mad-group {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
}

/* Head */
.mad-head {
  padding: 13px 14px;
  background: var(--plum);
  border-bottom: 1px solid rgba(255,255,255,.15);
}
.mad-grup-name {
  display: block;
  width: 100%;
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--gold);
  background: transparent;
  border: none;
  padding: 2px 0;
}
.mad-grup-name::placeholder { color: rgba(205,159,101,.45); font-style: italic; font-weight: 400; }
.mad-grup-name:focus { outline: none; }
.mad-head-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.mad-badge {
  font-size: var(--m-sub);
  font-weight: 600;
  color: var(--plum);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 3px 11px;
  font-variant-numeric: tabular-nums;
}
.mad-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 7px 12px;
  border: 1.5px solid var(--line);
  border-radius: 100px;
  background: var(--paper);
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.mad-add:active { background: var(--gold-soft); border-color: var(--gold); }
.mad-del-grp {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--rose-soft);
  border-radius: 100px;
  background: var(--paper);
  color: var(--rose);
  cursor: pointer;
  transition: background .15s;
}
.mad-del-grp:active { background: var(--rose-soft); }

/* Rows */
.mad-empty-row {
  padding: 22px 16px;
  text-align: center;
  font-size: var(--m-sub);
  color: var(--muted);
}
.mad-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  transition: background .15s;
}
.mad-row:last-child { border-bottom: none; }
.mad-row.done { background: rgba(61, 80, 39, .08); }
.mad-body { flex: 1; min-width: 0; }
.mad-syarat {
  width: 100%;
  min-width: 0;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-value);
  color: var(--ink);
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 8px;
  padding: 7px 8px;
  transition: background .15s, border-color .15s;
}
.mad-syarat::placeholder { color: #c2b4bc; font-style: italic; }
.mad-syarat:hover { background: var(--ivory); }
.mad-syarat:focus { outline: none; border-color: var(--gold); background: #fff; }
.mad-row.done .mad-syarat { color: var(--muted); text-decoration: line-through; }
/* Tanggal syarat — baris kecil di bawah nama syarat */
.mad-date-chip, .mad-date-add {
  display: block;
  margin: 1px 0 0 8px;
  padding: 2px 0;
  border: none;
  background: none;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  color: var(--muted);
  text-align: left;
  cursor: pointer;
}
.mad-date-chip.late { color: var(--rose); font-weight: 600; }
.mad-date-add { opacity: .75; }
.mad-date-input {
  margin: 4px 0 0 8px;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  color: var(--ink);
  border: 1.5px solid var(--gold);
  background: #fff;
  border-radius: 8px;
  padding: 5px 7px;
}
.mad-del-item {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid var(--rose-soft);
  border-radius: 8px;
  background: var(--ivory);
  color: var(--rose);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.mad-del-item:active { background: var(--rose-soft); }
</style>
