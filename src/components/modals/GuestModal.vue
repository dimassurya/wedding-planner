<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ editId ? 'Ubah Data Tamu' : 'Tambah Tamu' }}</h3>
      <div class="sub">{{ editId ? guest?.nama : 'Isi data tamu undangan' }}</div>

      <div class="field">
        <label>Nama Tamu</label>
        <input ref="namaInput" v-model="form.nama" type="text" placeholder="cth: Tante Ririn &amp; Om Ferdi" autocomplete="off">
      </div>

      <div class="field">
        <label>Jumlah Orang</label>
        <Stepper v-model="form.jumlah" :min="1" />
        <div v-if="form.jumlah > 1" class="gm-helper">👥 {{ form.jumlah }} orang dihitung dari 1 undangan ini</div>
      </div>

      <div class="field">
        <label>Diundang ke</label>
        <div class="gm-segmented">
          <button
            v-for="opt in UNDANGAN_OPTIONS" :key="opt.value" type="button"
            class="gm-seg-btn" :class="{ on: form.undangan === opt.value }"
            @click="form.undangan = opt.value"
          >{{ opt.label }}</button>
        </div>
      </div>

      <div class="field">
        <label>Relasi</label>
        <div class="select-wrap">
          <select v-model="form.relasi">
            <option v-for="k in ORDER" :key="k" :value="k">{{ RELASI_ICONS[k] }} {{ META[k].label }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Kehadiran</label>
        <div class="select-wrap">
          <select
            v-model="form.kehadiran"
            class="gm-kehadiran-sel"
            :style="{ background: KEHADIRAN_STATUS[form.kehadiran].bg, color: KEHADIRAN_STATUS[form.kehadiran].text, borderColor: KEHADIRAN_STATUS[form.kehadiran].color }"
          >
            <option v-for="k in KEHADIRAN_ORDER" :key="k" :value="k">{{ KEHADIRAN_ICONS[k] }} {{ KEHADIRAN_STATUS[k].label }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Catatan <span class="lbl-opt">(opsional)</span></label>
        <textarea v-model="form.catatan" rows="2" placeholder="Info bebas di luar yang sudah terstruktur di bawah..."></textarea>
      </div>

      <!-- ✨ Informasi Penting — accordion, progressive disclosure -->
      <div class="gm-accordion">
        <button type="button" class="gm-accordion-head" @click="showInfoPenting = !showInfoPenting">
          <span>✨ Informasi Penting <span class="lbl-opt">(Opsional)</span></span>
          <span class="gm-accordion-toggle">{{ showInfoPenting ? '▲ Tutup' : '▼ Tambahkan' }}</span>
        </button>

        <div v-if="!showInfoPenting && selectedInfoPenting.length" class="gm-accordion-summary">
          <span v-for="opt in selectedInfoPenting" :key="opt.id" class="gm-summary-chip">{{ opt.icon }} {{ opt.label }}</span>
        </div>

        <div v-if="showInfoPenting" class="gm-accordion-body">
          <div class="gm-chipgrid">
            <button
              v-for="opt in INFORMASI_PENTING_OPTIONS" :key="opt.id" type="button"
              class="gm-chip" :class="{ on: form.informasiPenting.flags.includes(opt.id) }"
              @click="toggleInfoFlag(opt.id)"
            >{{ opt.icon }} {{ opt.label }}</button>
          </div>

          <div v-if="form.informasiPenting.flags.includes('alergi')" class="field gm-subfield">
            <label>Jenis Alergi</label>
            <input v-model="form.informasiPenting.jenisAlergi" type="text" placeholder="cth: kacang, seafood, udang">
          </div>

          <template v-if="form.informasiPenting.flags.includes('menginap')">
            <div class="field gm-subfield">
              <label>Jumlah Kamar</label>
              <Stepper v-model="form.informasiPenting.jumlahKamar" :min="1" />
            </div>
            <div class="field gm-subfield">
              <label>Catatan Menginap <span class="lbl-opt">(opsional)</span></label>
              <input v-model="form.informasiPenting.catatanMenginap" type="text" placeholder="cth: check-in H-1">
            </div>
          </template>

          <div v-if="form.informasiPenting.flags.includes('pendamping')" class="field gm-subfield">
            <label>Jumlah Pendamping</label>
            <Stepper v-model="form.informasiPenting.jumlahPendamping" :min="1" />
          </div>
        </div>
      </div>

      <div v-if="editId" class="modal-quick-row">
        <span class="modal-quick-lbl">Aksi lain</span>
        <button type="button" class="item-action-btn" title="Duplikasi tamu" @click="handleDuplicate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button type="button" class="item-action-btn del" title="Hapus tamu" @click="handleDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>

      <div class="gm-footer">
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="$emit('close')">Batal</button>
          <button class="btn" @click="save(false)">Simpan</button>
        </div>
        <button v-if="!editId" type="button" class="gm-save-again" @click="save(true)">+ Simpan &amp; Tambah Lagi</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { META, ORDER, KEHADIRAN_STATUS, KEHADIRAN_ORDER, INFORMASI_PENTING_OPTIONS } from '../../data/constants'
import { useFormDraft } from '../../composables/useFormDraft'
import Stepper from '../Stepper.vue'

const props = defineProps({ show: Boolean, editId: { type: Number, default: null } })
const emit  = defineEmits(['close'])
const store = useWeddingStore()
const namaInput = ref(null)

const guest = computed(() => props.editId ? store.guests.find(g => g.id === props.editId) : null)

const UNDANGAN_OPTIONS = [
  { value: 'akad', label: 'Akad' },
  { value: 'resepsi', label: 'Resepsi' },
  { value: 'keduanya', label: 'Keduanya' },
]

// Icon presentasi doang — bukan bagian data model (META/KEHADIRAN_STATUS
// tetap sumber kebenaran buat label/warna/relasi).
const RELASI_ICONS = { cpp: '👨‍👩‍👧', cpw: '👨‍👩‍👧', teman_pria: '👫', teman_wanita: '👫', tetangga_pria: '🏠', tetangga_wanita: '🏠', lainnya: '📌' }
const KEHADIRAN_ICONS = { belum: '🟡', hadir: '🟢', tidak: '🔴', hampers: '🎁' }

const showInfoPenting = ref(false)

function blankForm() {
  return {
    nama: '', jumlah: 2, undangan: 'keduanya', relasi: 'cpp', kehadiran: 'belum', catatan: '',
    // Informasi Penting sekarang BENERAN tersimpan (kolom jsonb
    // guests."informasiPenting", lihat db/028) — dipakai kolom Informasi
    // Penting di tabel desktop, statistik Special Attention, dan panel
    // detail kartu tamu mobile.
    informasiPenting: { flags: [], jenisAlergi: '', jumlahKamar: 1, catatanMenginap: '', jumlahPendamping: 1 },
  }
}
const form = ref(blankForm())

const selectedInfoPenting = computed(() => INFORMASI_PENTING_OPTIONS.filter(o => form.value.informasiPenting.flags.includes(o.id)))
function toggleInfoFlag(id) {
  const flags = form.value.informasiPenting.flags
  const idx = flags.indexOf(id)
  if (idx > -1) flags.splice(idx, 1)
  else flags.push(id)
}

watch(() => props.show, open => {
  if (!open) return
  if (guest.value) {
    const g = guest.value
    const blank = blankForm()
    form.value = {
      ...blank,
      nama: g.nama, jumlah: g.jumlah, undangan: g.undangan || 'keduanya',
      relasi: g.relasi, kehadiran: g.kehadiran || 'belum', catatan: g.catatan || '',
      // Merge ke bentuk lengkap: baris lama (sebelum db/028) nggak punya
      // field ini, dan flags wajib array baru — bukan referensi ke array
      // milik store, biar batal-edit nggak diam-diam mengubah data.
      informasiPenting: {
        ...blank.informasiPenting,
        ...(g.informasiPenting || {}),
        flags: [...(g.informasiPenting?.flags || [])],
      },
    }
  } else {
    form.value = blankForm()
  }
  // Jangan sembunyiin data yang udah keisi di balik accordion — pola sama
  // seperti showMore* di VendorModal.
  showInfoPenting.value = form.value.informasiPenting.flags.length > 0
  nextTick(() => namaInput.value?.focus())
})

// Draft anti-refresh — WAJIB dipanggil setelah watcher `show` di atas,
// biar inisialisasi form selesai dulu sebelum draft dipulihkan.
const { rebaseline } = useFormDraft('guest', {
  show: () => props.show,
  form,
  context: () => props.editId ?? null,
  onRestore: () => store.toast('Isian terakhirmu dipulihkan'),
})

// Bersihkan sebelum simpan: field tambahan cuma disertakan kalau chip
// pemiliknya aktif, biar nggak ada sisa data yatim (mis. "jenis alergi"
// masih kesimpen padahal chip Alergi udah dimatikan).
function cleanInfoPenting() {
  const ip = form.value.informasiPenting
  const flags = [...ip.flags]
  const out = { flags }
  if (flags.includes('alergi')) out.jenisAlergi = (ip.jenisAlergi || '').trim()
  if (flags.includes('menginap')) {
    out.jumlahKamar = ip.jumlahKamar || 1
    out.catatanMenginap = (ip.catatanMenginap || '').trim()
  }
  if (flags.includes('pendamping')) out.jumlahPendamping = ip.jumlahPendamping || 1
  return out
}

async function save(addAnother) {
  if (!form.value.nama.trim()) { store.toast('Nama belum diisi'); return }
  const ok = await store.saveGuest({
    nama:      form.value.nama.trim(),
    jumlah:    form.value.jumlah,
    undangan:  form.value.undangan,
    relasi:    form.value.relasi,
    kehadiran: form.value.kehadiran,
    catatan:   form.value.catatan.trim(),
    informasiPenting: cleanInfoPenting(),
  }, props.editId)
  if (!ok) return   // saveGuest sudah toast pesan errornya sendiri
  store.toast(props.editId ? 'Perubahan tersimpan' : 'Tamu ditambahkan')
  if (addAnother && !props.editId) {
    // Relasi & Diundang-ke dibiarin nempel — biasanya nambah beberapa tamu
    // beruntun dari grup/sisi yang sama. Sisanya balik ke kosong.
    form.value = { ...blankForm(), undangan: form.value.undangan, relasi: form.value.relasi }
    showInfoPenting.value = false
    rebaseline()   // entri barusan sudah tersimpan — draft lama dibuang
    nextTick(() => namaInput.value?.focus())
    return
  }
  emit('close')
}

function handleDuplicate() {
  if (!props.editId) return
  store.duplicateGuest(props.editId)
  emit('close')
}

async function handleDelete() {
  if (!props.editId) return
  const id = props.editId
  await store.delGuest(id)
  // delGuest membatalkan diam-diam kalau user cancel di dialog konfirmasi —
  // cek datanya beneran hilang dulu sebelum modal ditutup.
  if (!store.guests.some(g => g.id === id)) emit('close')
}
</script>

<style scoped>
.lbl-opt { font-weight: 400; color: var(--muted); font-size: 11px; }

.gm-helper { margin-top: 6px; font-size: 12px; color: var(--muted); }

/* Segmented button — "Diundang ke" */
.gm-segmented {
  display: flex;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}
.gm-seg-btn {
  flex: 1;
  min-height: 44px;
  border: none;
  background: var(--paper);
  color: var(--muted);
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.gm-seg-btn + .gm-seg-btn { border-left: 1.5px solid var(--line); }
.gm-seg-btn.on { background: var(--plum); color: #fff; font-weight: 700; }

.gm-kehadiran-sel { font-weight: 600; transition: background .15s, color .15s, border-color .15s; }

/* Accordion — Informasi Penting */
.gm-accordion { margin-bottom: 16px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.gm-accordion-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 15px;
  border: none;
  background: var(--ivory);
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  min-height: 44px;
}
.gm-accordion-toggle { font-size: 12px; font-weight: 600; color: var(--plum); white-space: nowrap; }
.gm-accordion-summary { display: flex; flex-wrap: wrap; gap: 6px; padding: 12px 15px; background: var(--paper); }
.gm-summary-chip {
  font-size: 12px; font-weight: 600; color: var(--plum);
  background: var(--gold-soft); border-radius: 100px; padding: 4px 11px;
}
.gm-accordion-body { padding: 14px 15px 4px; background: var(--paper); border-top: 1px dashed var(--line); }

.gm-chipgrid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.gm-chip {
  min-height: 40px;
  padding: 0 14px;
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  background: var(--ivory);
  border: 1.5px solid var(--line);
  border-radius: 100px;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.gm-chip.on { background: var(--plum); border-color: var(--plum); color: #fff; font-weight: 700; }
.gm-subfield { margin-top: 14px; }

/* Footer */
.gm-save-again {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  min-height: 44px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  background: none;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.gm-save-again:hover { background: var(--gold-soft); border-color: var(--gold); }

.modal-quick-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  margin-top: 6px;
  border-top: 1px solid var(--line);
}
.modal-quick-lbl { font-size: 12px; color: var(--muted); margin-right: auto; }

/* Footer nempel di bawah pas modal-nya discroll (form makin panjang
   gara-gara accordion dibuka) — biar Simpan selalu gampang dijangkau.

   PENTING: padding-bottom modal HARUS 0. Titik "nempel bawah" elemen
   sticky dihitung browser dari tepi KONTEN scroll container — kalau
   modal masih punya padding-bottom 30px, footer berhenti 30px di atas
   dasar modal dan konten yang discroll kelihatan lewat strip itu
   (kejadian nyata di form Tambah Tamu). Ganti rugi ruangnya dibawa
   footer sendiri lewat padding-bottom di bawah. Margin samping negatif
   = kebalikan padding samping .modal (28px), biar full-bleed tanpa
   celah. Radius bawah ngikutin radius modal (20px). */
.gm-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin: 4px -28px 0;
  padding: 12px 28px calc(18px + env(safe-area-inset-bottom, 0px));
  background: var(--paper);
  border-top: 1px solid var(--line);
  border-radius: 0 0 20px 20px;
  box-shadow: 0 -8px 16px -12px rgba(36, 8, 8, .25);
}
.gm-footer .modal-actions { margin-top: 0; }

/* Scoped ke modal milik komponen ini saja — modal lain tetap normal. */
.modal { padding-bottom: 0; }
</style>
