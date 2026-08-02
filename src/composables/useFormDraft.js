import { watch, nextTick, onBeforeUnmount, isRef } from 'vue'

// ─────────────────────────────────────────────────────────────────────
//  Draft form modal yang selamat dari refresh.
//
//  Modal Tambah/Edit (Tamu, Vendor, Transaksi Keuangan) nyimpen isian di
//  state lokal sampai user menekan Simpan — refresh yang tidak sengaja
//  bikin semua ketikan hilang. Composable ini:
//
//   1. Menyimpan draft ke sessionStorage tiap kali user mengubah form
//      (debounced), selama modalnya terbuka.
//   2. Memunculkan dialog bawaan browser "perubahan belum tersimpan"
//      saat halaman mau ditutup/refresh selagi form kotor.
//   3. Memulihkan draft otomatis begitu modal yang sama dibuka lagi
//      (konteks harus cocok: sama-sama "tambah baru" atau edit id yang
//      sama), lalu memanggil onRestore biar modal bisa kasih toast.
//
//  Draft dihapus saat modal ditutup secara sadar (Simpan/Batal) — refresh
//  tidak melewati jalur itu, jadi draftnya selamat. sessionStorage dipilih
//  (bukan localStorage) supaya draft cuma hidup sepanjang sesi tab browser:
//  pas dibuka lagi besok, form kembali bersih.
// ─────────────────────────────────────────────────────────────────────

// Peringatan beforeunload dipakai bareng semua form (counter, 1 listener).
let _dirtyCount = 0
const _warnUnload = e => { e.preventDefault(); e.returnValue = '' }
function _setDirtyGuard(on) {
  const was = _dirtyCount > 0
  _dirtyCount += on ? 1 : -1
  const now = _dirtyCount > 0
  if (!was && now) window.addEventListener('beforeunload', _warnUnload)
  if (was && !now) window.removeEventListener('beforeunload', _warnUnload)
}

// name    : id unik draft, jadi key sessionStorage ('wp_draft_' + name).
// show    : () => boolean — modal lagi terbuka?
// form    : ref(object) ATAU reactive(object) berisi isian form.
// context : () => id yang membedakan "form yang mana" (mis. editId, null
//           buat tambah baru) — draft cuma dipulihkan kalau konteks cocok.
// onRestore : dipanggil setelah draft dipulihkan (buat toast).
export function useFormDraft(name, { show, form, context = () => null, onRestore = null }) {
  const KEY = 'wp_draft_' + name
  const getForm = () => (isRef(form) ? form.value : form)
  const setForm = data => {
    if (isRef(form)) form.value = { ...form.value, ...data }
    else Object.assign(form, data)
  }

  let armed = false    // baru pantau perubahan SETELAH modal selesai ngisi form awalnya
  let baseline = ''    // snapshot form saat siap — pembanding "beneran diubah user?"
  let dirty = false
  let timer = null

  const readDraft = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { return null }
  }
  const saveDraft = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ ctx: context() ?? null, data: getForm() })) } catch (_) {}
  }
  const clearDraft = () => { try { sessionStorage.removeItem(KEY) } catch (_) {} }

  function setDirty(on) {
    if (dirty === on) return
    dirty = on
    _setDirtyGuard(on)
  }

  // Simpan draft SEKARANG (lewati debounce) — dipanggil browser pas halaman
  // ditutup/refresh; tanpa ini ketikan ~detik terakhir bisa belum tersimpan.
  const flushNow = () => { if (dirty) { clearTimeout(timer); saveDraft() } }
  window.addEventListener('pagehide', flushNow)

  watch(show, open => {
    if (open) {
      armed = false
      // Modal ngisi form-nya sendiri di watcher `show` miliknya (jalan
      // duluan karena dideklarasikan lebih dulu — panggil useFormDraft
      // SETELAH watcher itu). Tunggu inisialisasi selesai, pulihkan draft
      // kalau konteksnya cocok, baru mulai pantau ketikan user.
      nextTick(() => {
        const d = readDraft()
        if (d && (d.ctx ?? null) === (context() ?? null) && d.data && typeof d.data === 'object') {
          setForm(d.data)
          onRestore?.()
        }
        nextTick(() => {
          baseline = JSON.stringify(getForm())
          armed = true
        })
      })
    } else {
      // Ditutup sadar (Simpan/Batal/overlay) — draft tidak dibutuhkan lagi.
      clearTimeout(timer)
      clearDraft()
      armed = false
      setDirty(false)
    }
  })

  watch(() => getForm(), () => {
    if (!armed || !show()) return
    const changed = JSON.stringify(getForm()) !== baseline
    setDirty(changed)
    clearTimeout(timer)
    if (changed) timer = setTimeout(saveDraft, 250)
    else clearDraft()   // balik persis ke kondisi awal — tidak ada yang perlu disimpan
  }, { deep: true })

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', flushNow)
    clearTimeout(timer)
    setDirty(false)
  })

  // Buat alur "Simpan & Tambah Lagi": entri barusan sudah tersimpan, form
  // di-reset tanpa nutup modal — buang draft lama & ambil baseline baru.
  function rebaseline() {
    clearTimeout(timer)
    clearDraft()
    setDirty(false)
    armed = false
    nextTick(() => { baseline = JSON.stringify(getForm()); armed = true })
  }

  return { rebaseline }
}
