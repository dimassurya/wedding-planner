<template>
  <div class="rc-wrap">
    <div v-if="!items.length && emptyLabel" class="rc-empty">{{ emptyLabel }}</div>

    <div v-for="(item, idx) in items" :key="idx" class="rc-card" :class="{ editing: editingIndex === idx }">
      <!-- Edit mode: form field sesuai schema -->
      <template v-if="editingIndex === idx">
        <div class="rc-form-grid">
          <div v-for="field in fields" v-show="!field.hidden || !field.hidden(item)" :key="field.key" class="rc-field" :class="{ full: field.full }">
            <label>{{ field.label }}</label>

            <textarea
              v-if="field.type === 'textarea'"
              v-model="item[field.key]"
              :placeholder="field.placeholder"
              rows="2"
            ></textarea>

            <div v-else-if="field.type === 'select'" class="select-wrap">
              <select :value="displaySelectValue(item, field)" @change="e => setSelectValue(item, field, e.target.value)">
                <option v-if="field.placeholder" value="" disabled>{{ field.placeholder }}</option>
                <option v-for="opt in resolveOptions(field, item)" :key="String(opt.value)" :value="String(opt.value ?? '')">{{ opt.label }}</option>
              </select>
            </div>

            <div v-else-if="field.type === 'currency'" class="cur-wrap rc-cur"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(item[field.key])" @input="e => setCurrencyValue(item, field, e)">
            </div>

            <input
              v-else-if="field.type === 'date'"
              type="date"
              :value="item[field.key] || ''"
              @change="e => item[field.key] = e.target.value || null"
            >

            <input
              v-else
              :type="field.type === 'number' ? 'number' : 'text'"
              v-model="item[field.key]"
              :placeholder="field.placeholder"
            >
          </div>
        </div>
        <div class="rc-actions">
          <button type="button" class="rc-btn rc-btn-del" @click="removeItem(idx)">Hapus</button>
          <button type="button" class="rc-btn rc-btn-done" @click="editingIndex = null">Selesai</button>
        </div>
      </template>

      <!-- View mode: ringkasan -->
      <template v-else>
        <div class="rc-card-head">
          <span class="rc-card-ico">{{ resolveIcon(item) }}</span>
          <div class="rc-card-main">
            <div class="rc-card-title">{{ title(item) }}</div>
            <div v-for="(line, i) in subtitleLines(item)" :key="i" class="rc-card-sub">{{ line }}</div>
          </div>
          <div class="rc-card-actions">
            <button type="button" class="rc-btn rc-btn-edit" @click="editingIndex = idx">Edit</button>
            <button type="button" class="rc-btn rc-btn-del" @click="removeItem(idx)">Hapus</button>
          </div>
        </div>
      </template>
    </div>

    <button type="button" class="rc-add" @click="addItem">{{ addLabel }}</button>
  </div>
</template>

<script setup>
// Komponen generik buat semua pola "dynamic repeatable form" di app ini
// (Included Vendor, Vendor Rekanan, Food Stall, Team WO, Area Venue,
// Layanan WO, Isi Paket Souvenir, Biaya Tambahan, dst). Cukup kasih
// `fields` (schema) + `title`/`subtitle` (fungsi ringkasan) + `newItem`
// (factory item kosong) — nggak perlu bikin UI card baru tiap fitur.
//
// Item diedit LANGSUNG di array yang dioper lewat prop `items` (push/
// splice/assign field in-place), bukan lewat emit v-model — ngikutin pola
// yang sudah dipakai di seluruh VendorModal.vue (form.value.xxx.push(...)),
// bukan pola one-way-data-flow yang app ini emang nggak pakai di tempat lain.
import { ref } from 'vue'
import { grp, num } from '../utils/index'

const props = defineProps({
  items: { type: Array, required: true },
  // [{ key, label, type: 'text'|'number'|'date'|'textarea'|'select'|'currency',
  //    placeholder, full, options: array | (item)=>array, valueType: 'number',
  //    onChange: (item)=>void }]
  fields: { type: Array, required: true },
  icon: { type: [String, Function], default: '•' },
  title: { type: Function, required: true },      // (item) => string
  subtitle: { type: Function, default: null },     // (item) => string | string[] | null
  newItem: { type: Function, required: true },     // () => object
  addLabel: { type: String, default: '+ Tambah' },
  emptyLabel: { type: String, default: '' },
})

const editingIndex = ref(null)

function resolveIcon(item) {
  return typeof props.icon === 'function' ? props.icon(item) : props.icon
}
function subtitleLines(item) {
  if (!props.subtitle) return []
  const r = props.subtitle(item)
  if (!r) return []
  return (Array.isArray(r) ? r : [r]).filter(Boolean)
}
function resolveOptions(field, item) {
  return typeof field.options === 'function' ? field.options(item) : (field.options || [])
}
function displaySelectValue(item, field) {
  const v = item[field.key]
  return v === null || v === undefined ? '' : String(v)
}
function setSelectValue(item, field, raw) {
  item[field.key] = field.valueType === 'number' ? (raw === '' ? null : Number(raw)) : raw
  field.onChange?.(item)
}
function setCurrencyValue(item, field, e) {
  e.target.value = grp(e.target.value)
  item[field.key] = num(e.target.value)
}
function addItem() {
  props.items.push(props.newItem())
  editingIndex.value = props.items.length - 1
}
function removeItem(idx) {
  props.items.splice(idx, 1)
  if (editingIndex.value === idx) editingIndex.value = null
  else if (editingIndex.value != null && editingIndex.value > idx) editingIndex.value--
}
</script>

<style scoped>
.rc-wrap { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.rc-empty { font-size: 12.5px; color: var(--muted); padding: 4px 0 2px; }

.rc-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
}
.rc-card.editing { border-color: var(--gold); }

.rc-card-head { display: flex; align-items: flex-start; gap: 10px; }
.rc-card-ico {
  flex: none; width: 30px; height: 30px; display: grid; place-items: center;
  font-size: 15px; background: var(--gold-soft); border-radius: 8px;
}
.rc-card-main { flex: 1; min-width: 0; }
.rc-card-title { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13.5px; color: var(--cacao); }
.rc-card-sub { font-size: 12px; color: var(--muted); margin-top: 2px; line-height: 1.4; }
.rc-card-actions { flex: none; display: flex; gap: 6px; }

.rc-btn {
  font-family: 'Jost', sans-serif;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.rc-btn-edit:hover { background: var(--gold-soft); border-color: var(--gold); }
.rc-btn-del { color: var(--rose); }
.rc-btn-del:hover { background: var(--rose-soft); border-color: var(--rose); }
.rc-btn-done { background: var(--plum); color: #fff; border-color: var(--plum); }
.rc-btn-done:hover { background: var(--wine); }

.rc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
.rc-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.rc-field.full { grid-column: 1 / -1; }
.rc-field label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .02em; }
.rc-field input,
.rc-field textarea,
.rc-field select {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  color: var(--ink);
  background: var(--ivory);
  box-sizing: border-box;
}
.rc-field select { appearance: none; padding-right: 28px; cursor: pointer; }
.rc-field textarea { resize: vertical; font-family: inherit; }
.rc-cur { width: 100%; }
.rc-cur input.cur { width: 100%; box-sizing: border-box; padding: 7px 9px 7px 34px; border: 1px solid var(--line); border-radius: 7px; font-family: 'Jost', sans-serif; font-size: 13px; color: var(--ink); background: var(--ivory); }
.rc-cur .cur-rp { left: 9px; font-size: 12.5px; }

.rc-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }

.rc-add {
  align-self: flex-start;
  width: 100%;
  padding: 9px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: none;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.rc-add:hover { background: var(--gold-soft); border-color: var(--gold); }
</style>
