<template>
  <div class="mg-list">
    <div v-if="!rows.length" class="mg-empty">
      <div class="mg-empty-big">Belum ada tamu</div>
      <div>Tidak ada yang cocok, atau tambah tamu baru.</div>
    </div>

    <div v-if="rows.length && !isSelecting" class="mg-hint">Ketuk kartu untuk lihat detail · tekan lama untuk pilih banyak</div>

    <div
      v-for="g in rows"
      :key="g.id"
      class="mg-card"
      :class="{ unconf: (g.kehadiran || 'belum') === 'tidak', 'mg-sel': store.isSelected(g.id), 'mg-open': isOpen(g.id) && !isSelecting }"
      @click="onCardClick(g)"
      @touchstart.passive="onTouchStart(g.id)"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @touchmove="onTouchEnd"
    >
      <!-- Baris 1 — identitas: nama, jumlah orang, chip relasi singkat.
           Dikasih lebar penuh (dulu sebaris sama dropdown+aksi, kolomnya
           kesisa ~60px jadi nama & badge kepotong berbaris-baris). -->
      <div class="mg-head">
        <!-- Checkbox (selection mode) -->
        <div v-if="isSelecting" class="mg-cbx" :class="{ on: store.isSelected(g.id) }">
          <svg v-if="store.isSelected(g.id)" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="mg-ident">
          <span class="mg-name">{{ g.nama }}</span>
          <span class="mg-pax">({{ g.jumlah }} orang)</span>
          <!-- Chip relasi versi singkat (Keluarga/Teman/Tetangga/Lainnya).
               Pihak pria/wanita tetap kebaca dari warna chip-nya; label
               panjangnya ada di panel detail. -->
          <span class="mg-badge" :title="META[g.relasi]?.label" :style="{ background: META[g.relasi]?.bg, color: META[g.relasi]?.text }">
            {{ META[g.relasi]?.group || 'Lainnya' }}
          </span>
          <span v-if="g.undangan && g.undangan !== 'keduanya'" class="mg-chip-inv">{{ g.undangan }}</span>
          <!-- Penanda ringkas: ada info khusus tanpa perlu buka panel -->
          <span v-if="!isSelecting && infoChips(g).length" class="mg-info-dot">
            {{ infoChips(g).slice(0, 3).map(c => c.icon).join(' ') }}<template v-if="infoChips(g).length > 3">+{{ infoChips(g).length - 3 }}</template>
          </span>
        </div>

        <!-- Indikator buka/tutup — sengaja di ujung kanan, terpisah dari
             barisan aksi (bukan tombol: seluruh kartu yang diketuk). -->
        <span v-if="!isSelecting" class="mg-chev" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </span>
      </div>

      <!-- Baris 2 — aksi: kehadiran di kiri, edit & hapus di kanan -->
      <div v-if="!isSelecting" class="mg-actions" @click.stop>
        <select
          class="mg-keh-sel"
          :class="'ks-' + (g.kehadiran || 'belum')"
          :value="g.kehadiran || 'belum'"
          @change="e => setKehadiran(g, e.target.value)"
        >
          <option v-for="k in KEHADIRAN_ORDER" :key="k" :value="k">{{ KEHADIRAN_STATUS[k].label }}</option>
        </select>
        <button class="mg-act item-action-btn" title="Edit" @click="$emit('edit', g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
        </button>
        <button class="mg-act del item-action-btn" title="Hapus" @click="store.delGuest(g.id)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>

      <!-- Panel detail — kebuka pas kartu diketuk -->
      <div v-if="isOpen(g.id) && !isSelecting" class="mg-panel" @click.stop>
        <!-- Label relasi versi panjang — di baris atas cuma versi singkat -->
        <div class="mg-panel-meta">
          👥 {{ META[g.relasi]?.label || 'Lainnya' }} · Diundang ke {{ g.undangan || 'keduanya' }}
        </div>

        <div class="mg-panel-lbl">✨ Informasi Penting</div>

        <template v-if="infoChips(g).length || (g.catatan || '').trim()">
          <div v-if="infoChips(g).length" class="mg-chips">
            <span v-for="c in infoChips(g)" :key="c.id" class="mg-info-chip">{{ c.icon }} {{ c.label }}</span>
          </div>
          <div v-for="(d, i) in infoDetails(g)" :key="i" class="mg-detail">• {{ d }}</div>
          <div v-if="(g.catatan || '').trim()" class="mg-note">📝 {{ g.catatan }}</div>
        </template>
        <div v-else class="mg-panel-empty">Tidak ada informasi khusus untuk tamu ini.</div>

        <button class="mg-panel-edit" @click="$emit('edit', g.id)">
          {{ infoChips(g).length || (g.catatan || '').trim() ? 'Ubah data tamu' : 'Tambah informasi penting' }} →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { META, KEHADIRAN_STATUS, KEHADIRAN_ORDER, INFORMASI_PENTING_OPTIONS } from '../data/constants'

defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['edit'])

const store = useWeddingStore()
const isSelecting = computed(() => store.selectedCount > 0)

// ── Panel detail per kartu ──────────────────────────────────────────
// Boleh lebih dari satu kartu kebuka sekaligus (accordion yang nutup
// otomatis bikin bingung pas user mau bandingin dua tamu).
const openIds = ref(new Set())
function isOpen(id) { return openIds.value.has(id) }
function toggleOpen(id) {
  const s = new Set(openIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openIds.value = s
}

// Informasi Penting — datanya dari kolom jsonb guests."informasiPenting"
// (db/028). Baris lama belum punya field ini, makanya semua akses dijaga
// optional chaining.
function infoChips(g) {
  const flags = g.informasiPenting?.flags || []
  return INFORMASI_PENTING_OPTIONS.filter(o => flags.includes(o.id))
}

// Field tambahan milik chip tertentu (alergi/menginap/pendamping) dijadikan
// kalimat pendek — cuma yang chip-nya aktif DAN isinya ada.
function infoDetails(g) {
  const d = g.informasiPenting || {}
  const flags = d.flags || []
  const out = []
  if (flags.includes('alergi') && (d.jenisAlergi || '').trim()) {
    out.push(`Alergi: ${d.jenisAlergi.trim()}`)
  }
  if (flags.includes('menginap')) {
    const parts = []
    if (d.jumlahKamar) parts.push(`${d.jumlahKamar} kamar`)
    if ((d.catatanMenginap || '').trim()) parts.push(d.catatanMenginap.trim())
    if (parts.length) out.push(`Menginap: ${parts.join(' · ')}`)
  }
  if (flags.includes('pendamping') && d.jumlahPendamping) {
    out.push(`Butuh ${d.jumlahPendamping} pendamping`)
  }
  return out
}

let _pressTimer  = null
let _didLongPress = false

function onTouchStart(id) {
  _pressTimer = setTimeout(() => {
    _didLongPress = true
    store.toggleSelected(id, true)
    if (navigator.vibrate) navigator.vibrate(30)
  }, 500)
}

function onTouchEnd() {
  clearTimeout(_pressTimer)
  _pressTimer = null
}

function onCardClick(g) {
  if (_didLongPress) { _didLongPress = false; return }
  if (isSelecting.value) {
    store.toggleSelected(g.id, !store.isSelected(g.id))
    return
  }
  toggleOpen(g.id)
}

function setKehadiran(g, val) {
  g.kehadiran = val
  store.saveG()
}
</script>

<style scoped>
.mg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Kartu bertumpuk 3 blok: .mg-head (identitas) → .mg-actions (kehadiran,
   edit, hapus) → .mg-panel (detail, kalau dibuka). Dulu semuanya sebaris
   dalam satu flex-row, bikin kolom nama kesisa ~60px di layar HP. */
.mg-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 13px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  transition: border-color .15s, background .15s;
  -webkit-user-select: none;
  user-select: none;
}

.mg-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mg-card.unconf { opacity: .72; }

.mg-card.mg-sel {
  border-color: var(--wine);
  background: rgba(129,1,0,.04);
  opacity: 1;
}

.mg-card.mg-open { border-color: var(--gold); }

/* Checkbox — anak flex biasa (dulu absolute + padding-left kartu; nggak
   bisa dipertahankan karena "tengah kartu" berubah begitu panel kebuka). */
.mg-cbx {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background .15s, border-color .15s;
}

.mg-cbx.on {
  background: var(--wine);
  border-color: var(--wine);
}

.mg-cbx svg { width: 13px; height: 13px; }

/* Identitas: nama → jumlah orang → chip relasi, mengalir dalam satu blok
   yang boleh wrap. Semua di baris atas biar nama nggak pernah kepotong. */
.mg-ident {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 7px;
}

/* Huruf awal tiap kata otomatis kapital lewat CSS (bukan mengubah data) —
   user tetap bebas mengetik "syara"/"mas fudin", tampilannya konsisten
   "Syara"/"Mas Fudin". text-transform: capitalize sengaja dipilih, BUKAN
   uppercase penuh: nama panjang jadi susah dibaca kalau kapital semua. */
.mg-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: calc(var(--m-title) + 2px);
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
  word-break: break-word;
  text-transform: capitalize;
}

.mg-pax {
  font-size: var(--m-sub);
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.mg-badge {
  max-width: 100%;
  font-size: var(--m-chip);
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 100px;
  line-height: 1.3;
  white-space: nowrap;
}

/* Chip "diundang ke" — cuma nongol kalau bukan Keduanya */
.mg-chip-inv {
  font-size: var(--m-chip);
  font-weight: 600;
  color: var(--plum);
  background: var(--gold-soft);
  border-radius: 100px;
  padding: 3px 9px;
  line-height: 1.3;
  text-transform: capitalize;
  white-space: nowrap;
}

/* Penanda ada info khusus — emoji doang, biar kebaca sekilas tanpa buka panel */
.mg-info-dot {
  font-size: var(--m-chip);
  letter-spacing: .04em;
  white-space: nowrap;
}

/* Melar isi semua ruang sisa di kiri tombol aksi — dulu dipatok lebar
   isi teksnya doang, nyisain ruang kosong yang bikin baris ini keliatan
   tanggung. */
.mg-keh-sel {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  font-family: 'Jost', sans-serif;
  font-size: var(--m-value);
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 8px 14px;
  cursor: pointer;
  background: var(--paper);
}
.mg-keh-sel.ks-belum   { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.mg-keh-sel.ks-hadir   { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.mg-keh-sel.ks-tidak   { color: #7a1a1a; background: #F8E8E8; border-color: #e8c6c6; }
.mg-keh-sel.ks-hampers { color: #0A1D4B; background: #E3E8F2; border-color: #b9c6e0; }

/* Baris aksi: dropdown kehadiran mengisi seluruh ruang sisa, tombol edit
   & hapus tetap seukuran ikonnya di ujung kanan. */
.mg-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.mg-act {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  background: var(--ivory);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.mg-act:active { background: var(--gold-soft); }
.mg-act.del { color: var(--rose); }
.mg-act.del:active { background: var(--rose-soft); }

/* Chevron indikator buka/tutup — pojok kanan atas, di luar barisan aksi */
.mg-chev {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  color: var(--muted);
  transition: transform .18s ease, color .15s;
}
.mg-card.mg-open .mg-chev { transform: rotate(180deg); color: var(--plum); }

/* ── Panel detail ── */
.mg-panel {
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px dashed var(--line);
  -webkit-user-select: text;
  user-select: text;
}
.mg-panel-meta {
  font-size: var(--m-sub);
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 10px;
  text-transform: capitalize;
}
.mg-panel-lbl {
  font-size: var(--m-label);
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}
.mg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mg-info-chip {
  font-size: var(--m-chip);
  font-weight: 600;
  color: var(--plum);
  background: var(--gold-soft);
  border-radius: 100px;
  padding: 4px 10px;
  line-height: 1.3;
}
.mg-detail {
  font-size: var(--m-sub);
  color: var(--ink);
  line-height: 1.5;
  margin-top: 6px;
}
.mg-note {
  font-size: var(--m-sub);
  color: var(--muted);
  line-height: 1.5;
  margin-top: 8px;
  background: var(--ivory);
  border-radius: 9px;
  padding: 8px 10px;
  word-break: break-word;
}
.mg-panel-empty {
  font-size: var(--m-sub);
  color: var(--muted);
  font-style: italic;
  line-height: 1.5;
}
.mg-panel-edit {
  margin-top: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: none;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub);
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.mg-panel-edit:active { background: var(--gold-soft); border-color: var(--gold); }

.mg-hint {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 2px 0 4px;
  letter-spacing: .01em;
}

.mg-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
.mg-empty-big { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
</style>
