import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { supabase } from '../lib/supabase'
import {
  BUDGET_SEED, SESERAHAN_SEED, ADMIN_SEED, CHECKLIST_SEED, TIMELINE_SEED,
  VENDOR_CATEGORIES,
} from '../data/constants'
import { downloadJSON, downloadCSV, dateStamp, toCSV, fmt } from '../utils/index'

export const useWeddingStore = defineStore('wedding', () => {
  // ── Auth state ──────────────────────────────────────────────────
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const isPaid  = computed(() => !!profile.value?.paid_at)

  // ── Partner / shared dashboard ───────────────────────────────────
  const ownerUserId  = ref(null)   // user_id pemilik data (bisa berbeda dari user.id kalau partner)
  const isPartner    = ref(false)  // true kalau login sebagai pasangan (bukan owner)
  const partnerEmail = ref('')     // email pasangan (ditampilkan ke owner)
  const ownerEmail   = ref('')     // email owner (ditampilkan ke partner)

  // ── Onboarding / profil pasangan ────────────────────────────────
  const couple = ref({ pria: '', wanita: '', tanggal: '', jamMulai: '', jamSelesai: '' })
  const onboarded          = ref(false)   // sudah lewat welcome screen (persist di settings)
  const beginOnboarding    = ref(false)   // sementara: user klik "Bayar Sekarang"
  const isNewUser          = ref(false)   // true kalau belum pernah punya data (baru dibuat)
  const showWelcomeGuide   = ref(false)   // tampil sekali setelah onboarding selesai
  const tourSidebarOpen    = ref(false)   // dibuka sementara oleh product tour
  const tourSteps          = ref(null)    // null = global tour, array = tab-specific tour

  // ── App state ───────────────────────────────────────────────────
  const guests    = ref([])
  const budget    = ref([])
  const vendors   = ref([])
  const seserahan = ref([])
  const mahar     = ref([])
  const admin     = ref([])
  const checklist = ref([])
  const timeline  = ref([])

  const activeTab  = ref('home')
  const tabOrder   = ref([])
  const bFilter    = ref('all')
  const vFilter    = ref('wo')

  const selectedMap = reactive({})

  const toastMsg     = ref('')
  const toastVisible = ref(false)
  let _toastTimer = null

  const confirmShow    = ref(false)
  const confirmTitle   = ref('Konfirmasi')
  const confirmMessage = ref('')
  const confirmOk      = ref('Hapus')
  const confirmCancel  = ref('Batal')
  const confirmDanger  = ref(true)
  let _confirmResolve = null

  // ── Computed ─────────────────────────────────────────────────────
  const confirmedGuests = computed(() => guests.value.filter(g => g.konfirmasi !== false))
  const selectedCount   = computed(() => Object.keys(selectedMap).length)
  const selectedIds     = computed(() => Object.keys(selectedMap).map(k => isNaN(k) ? k : Number(k)))

  // ── Toast ─────────────────────────────────────────────────────────
  function toast(msg) {
    toastMsg.value = msg
    toastVisible.value = true
    clearTimeout(_toastTimer)
    _toastTimer = setTimeout(() => { toastVisible.value = false }, 2100)
  }

  // ── Confirm dialog ────────────────────────────────────────────────
  function askConfirm(opts = {}) {
    confirmTitle.value   = opts.title        ?? 'Konfirmasi'
    confirmMessage.value = opts.message      ?? ''
    confirmOk.value      = opts.confirmLabel ?? 'Hapus'
    confirmCancel.value  = opts.cancelLabel  ?? 'Batal'
    confirmDanger.value  = opts.danger !== false
    confirmShow.value    = true
    return new Promise(resolve => { _confirmResolve = resolve })
  }
  function resolveConfirm(val) {
    confirmShow.value = false
    const r = _confirmResolve
    _confirmResolve = null
    if (r) r(val)
  }

  // ── Selection helpers ─────────────────────────────────────────────
  function isSelected(id) { return !!selectedMap[String(id)] }
  function toggleSelected(id, on) {
    if (on) selectedMap[String(id)] = true
    else    delete selectedMap[String(id)]
  }
  function clearSelected() {
    Object.keys(selectedMap).forEach(k => delete selectedMap[k])
  }

  // ── Debounced Supabase save ────────────────────────────────────────
  const _timers = {}

  async function _upsert(data) {
    if (!user.value) return
    const uid = ownerUserId.value || user.value.id
    if (isPartner.value) {
      // Partner: row owner sudah pasti ada, pakai UPDATE bukan upsert
      // karena upsert butuh INSERT permission yang tidak dimiliki partner (RLS)
      await supabase.from('wedding_data').update(data).eq('user_id', uid)
    } else {
      await supabase.from('wedding_data')
        .upsert({ user_id: uid, ...data }, { onConflict: 'user_id' })
    }
  }

  function scheduleSave(col, val) {
    if (!user.value) return
    clearTimeout(_timers[col])
    _timers[col] = setTimeout(() => _upsert({ [col]: val }), 600)
  }

  // ── Save functions ─────────────────────────────────────────────────
  const saveG  = () => scheduleSave('guests',    guests.value)
  const saveB  = () => scheduleSave('budget',    budget.value)
  const saveV  = () => scheduleSave('vendors',   vendors.value)
  const saveA  = () => scheduleSave('admin',     admin.value)
  const saveCK = () => scheduleSave('checklist', checklist.value)
  const saveTL = () => scheduleSave('timeline',  timeline.value)

  function saveS() {
    syncSeserahanToBudget()
    scheduleSave('seserahan', seserahan.value)
    scheduleSave('budget',    budget.value)
  }

  function saveM() {
    syncMaharToBudget()
    scheduleSave('mahar',  mahar.value)
    scheduleSave('budget', budget.value)
  }

  function _settingsPayload() {
    return {
      tabOrder: tabOrder.value, vFilter: vFilter.value,
      couple: couple.value, onboarded: onboarded.value,
      showWelcomeGuide: showWelcomeGuide.value,
      ownerEmail: user.value?.email || '',
    }
  }
  function saveSettings() { scheduleSave('settings', _settingsPayload()) }

  function saveTabOrder(order) {
    tabOrder.value = order
    saveSettings()
  }

  // ── Onboarding ──────────────────────────────────────────────────
  function startOnboarding() { beginOnboarding.value = true }

  async function completeOnboarding(data) {
    couple.value = {
      pria: (data.pria || '').trim(),
      wanita: (data.wanita || '').trim(),
      tanggal: data.tanggal || '',
      jamMulai: data.jamMulai || '',
      jamSelesai: data.jamSelesai || '',
    }
    // Kumpulkan semua perubahan ke satu payload biar tersimpan dalam
    // sekali tulis (bukan debounce yang bisa hilang kalau user refresh cepat).
    const payload = {}
    // Pembersihan template yang tidak dipilih HANYA untuk user baru,
    // biar data user lama tidak terhapus kalau melewati onboarding.
    if (isNewUser.value) {
      const t = data.templates || {}
      if (!t.budget)    { budget.value = [];    payload.budget = budget.value }
      if (!t.timeline)  { timeline.value = [];  payload.timeline = timeline.value }
      if (!t.admin)     { admin.value = [];     payload.admin = admin.value }
      if (!t.checklist) { checklist.value = []; payload.checklist = checklist.value }
      if (!t.seserahan) { seserahan.value = []; payload.seserahan = seserahan.value }
    }
    onboarded.value = true
    beginOnboarding.value = false
    activeTab.value = 'home'
    // Simpan LANGSUNG (awaited), bukan lewat debounce, supaya flag onboarded
    // + profil pasangan pasti sudah masuk DB sebelum user sempat refresh.
    if (isNewUser.value) showWelcomeGuide.value = true
    clearTimeout(_timers.settings)
    payload.settings = _settingsPayload()
    await _upsert(payload)
    isNewUser.value = false
  }

  function startTour(steps = null) {
    tourSteps.value        = steps
    showWelcomeGuide.value = true
  }

  function dismissWelcomeGuide() {
    showWelcomeGuide.value = false
    tourSteps.value        = null
    saveSettings()
  }

  // ── Budget helpers ─────────────────────────────────────────────────
  function bStatus(b) {
    if (b.aktual <= 0) return { key: 'belum', label: 'Belum Diisi',  color: '#9C7575', bg: '#EDE5E2', text: '#6b4848' }
    if (b.dibayar >= b.aktual) return { key: 'lunas', label: 'Lunas',   color: '#E5C99A', bg: '#CD9F65', text: '#3a2a10' }
    if (b.dibayar > 0)  return { key: 'dp',    label: 'Sebagian',  color: '#CD9F65', bg: '#F0E6CB', text: '#7a5c28' }
    return                     { key: 'belum', label: 'Belum Bayar', color: '#B32E33', bg: '#F8E8E8', text: '#7a1a1a' }
  }

  const bSisa = b => Math.max((b.aktual || 0) - (b.dibayar || 0), 0)

  function nextBudgetId() {
    const nums = budget.value.map(b => b.id).filter(x => typeof x === 'number')
    return nums.length ? Math.max(...nums) + 1 : 1
  }

  function budgetOrigin(b) {
    if (b.vendorId) return { label: 'Vendor', cls: 'bo-vendor', managed: true, tip: 'Otomatis dari vendor yang Dipakai', tipDel: "Ditambahkan dari tab Vendor — untuk menghapus, matikan 'Dipakai' di tab Vendor" }
    if (b.id === 'seserahan_auto' || b.item === 'Total Seserahan') return { label: 'Seserahan', cls: 'bo-ser', managed: true, tip: 'Otomatis dari tab Seserahan', tipDel: 'Ditambahkan dari tab Seserahan — kelola item & nilainya dari tab Seserahan' }
    if (b.id === 'mahar_auto' || b.item === 'Total Mahar') return { label: 'Mahar', cls: 'bo-mahar', managed: true, tip: 'Otomatis dari tab Mahar', tipDel: 'Ditambahkan dari tab Mahar — kelola item & nilainya dari tab Mahar' }
    if (b.template) return { label: 'Template', cls: 'bo-tpl', managed: false, tip: 'Contoh bawaan — boleh diedit atau dihapus' }
    return null
  }

  // ── Sync seserahan / mahar → budget (save dihandle caller) ──────────
  function syncSeserahanToBudget() {
    const active  = seserahan.value.filter(x => x.status)
    const tBudget = active.reduce((s, x) => s + (parseInt(x.budget) || 0), 0)
    const tHarga  = active.reduce((s, x) => s + (parseInt(x.harga)  || 0), 0)
    const bIdx = budget.value.findIndex(b => b.id === 'seserahan_auto' || b.item === 'Total Seserahan')
    if (active.length === 0 || (tBudget === 0 && tHarga === 0)) {
      if (bIdx > -1) budget.value.splice(bIdx, 1)
    } else if (bIdx > -1) {
      budget.value[bIdx].estimasi = tBudget
      budget.value[bIdx].aktual   = tHarga
      budget.value[bIdx].item     = 'Total Seserahan'
    } else {
      budget.value.push({ id: 'seserahan_auto', item: 'Total Seserahan', kategori: 'lainnya', estimasi: tBudget, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: 'Sinkronisasi otomatis dari tab Seserahan' })
    }
  }

  function syncMaharToBudget() {
    const active = mahar.value.filter(x => x.status)
    const tHarga = active.reduce((s, x) => s + (parseInt(x.harga) || 0), 0)
    const bIdx = budget.value.findIndex(b => b.id === 'mahar_auto' || b.item === 'Total Mahar')
    if (active.length === 0 || tHarga === 0) {
      if (bIdx > -1) budget.value.splice(bIdx, 1)
    } else if (bIdx > -1) {
      budget.value[bIdx].estimasi = tHarga
      budget.value[bIdx].aktual   = tHarga
      budget.value[bIdx].item     = 'Total Mahar'
    } else {
      budget.value.push({ id: 'mahar_auto', item: 'Total Mahar', kategori: 'lainnya', estimasi: tHarga, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: 'Sinkronisasi otomatis dari tab Mahar' })
    }
  }

  // ── Vendor ↔ Budget ────────────────────────────────────────────────
  function handleVendorDecision(vendor, isJadi) {
    const existingIdx = budget.value.findIndex(b => b.vendorId === vendor.id)
    if (isJadi) {
      const cat = VENDOR_CATEGORIES.find(c => c.id === vendor.category)
      const catLabel = cat ? cat.label : vendor.category
      if (existingIdx > -1) {
        budget.value[existingIdx].estimasi = vendor.harga
        budget.value[existingIdx].aktual   = vendor.harga
        budget.value[existingIdx].remarks  = vendor.deskripsi
      } else {
        budget.value.push({ id: nextBudgetId(), vendorId: vendor.id, item: `${catLabel} - ${vendor.nama}`, estimasi: vendor.harga, aktual: vendor.harga, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: vendor.deskripsi })
      }
    } else {
      if (existingIdx > -1) budget.value.splice(existingIdx, 1)
    }
    saveB()
  }

  // ── Budget CRUD ────────────────────────────────────────────────────
  function addBudgetItem() {
    const id = nextBudgetId()
    budget.value.push({ id, item: '', estimasi: 0, aktual: 0, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: '' })
    bFilter.value = 'all'
    saveB()
    return id
  }

  function delBudget(id) {
    const b = budget.value.find(x => x.id === id)
    if (!b) return false
    if (b.id === 'seserahan_auto' || b.item === 'Total Seserahan' || b.id === 'mahar_auto' || b.item === 'Total Mahar') {
      const src = (b.id === 'mahar_auto' || b.item === 'Total Mahar') ? 'Mahar' : 'Seserahan'
      toast(`Item ini otomatis dari tab ${src} — kelola dari sana`)
      return false
    }
    if (b.vendorId) {
      if (!confirm(`"${b.item}" berasal dari vendor yang Dipakai.\n\nMenghapus dari Budget akan menonaktifkan "Dipakai" pada vendor itu. Lanjutkan?`)) return false
      const v = vendors.value.find(x => x.id === b.vendorId)
      if (v) { v.jadi = false; saveV() }
      budget.value = budget.value.filter(x => x.id !== id)
      saveB(); toast('Item dihapus & vendor dinonaktifkan')
      return true
    }
    if (!confirm(`Hapus item "${b.item || 'tanpa nama'}"?`)) return false
    budget.value = budget.value.filter(x => x.id !== id)
    saveB(); toast('Item dihapus')
    return true
  }

  function removeBudgetEmptyItem(id) {
    if (isNaN(id)) return
    const b = budget.value.find(x => x.id === id)
    if (b && !b.item?.trim()) {
      budget.value = budget.value.filter(x => x.id !== id)
      saveB()
    }
  }

  // ── Guest CRUD ─────────────────────────────────────────────────────
  function saveGuest(data, editId) {
    if (editId) {
      const g = guests.value.find(x => x.id === editId)
      if (g) Object.assign(g, data)
    } else {
      const id = guests.value.length ? Math.max(...guests.value.map(g => g.id)) + 1 : 1
      guests.value.push({ id, ...data })
    }
    saveG()
  }

  async function delGuest(id) {
    const g = guests.value.find(x => x.id === id)
    if (!g) return
    const ok = await askConfirm({
      title: 'Hapus tamu?',
      message: `"${g.nama}" akan dihapus dari daftar tamu.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    guests.value = guests.value.filter(x => x.id !== id)
    delete selectedMap[String(id)]
    saveG(); toast('Tamu dihapus')
  }

  function duplicateGuest(id) {
    const g = guests.value.find(x => x.id === id)
    if (!g) return
    const newId = guests.value.length ? Math.max(...guests.value.map(x => x.id)) + 1 : 1
    const idx = guests.value.findIndex(x => x.id === id)
    guests.value.splice(idx + 1, 0, { ...g, id: newId, nama: g.nama + ' (salin)' })
    saveG()
    toast('Tamu diduplikasi')
  }

  function removeEmptyTimeline(id) {
    const t = timeline.value.find(x => x.id === id)
    if (!t) return
    if (!(t.tugas || '').trim() && !t.deadline && !t.catatan) {
      timeline.value = timeline.value.filter(x => x.id !== id)
      saveTL()
    }
  }

  async function delTimeline(id) {
    const t = timeline.value.find(x => x.id === id)
    if (!t) return
    const ok = await askConfirm({
      title: 'Hapus tugas?',
      message: `"${t.tugas || 'tanpa nama'}" akan dihapus dari timeline.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    timeline.value = timeline.value.filter(x => x.id !== id)
    saveTL(); toast('Tugas dihapus')
  }

  async function delVendor(id) {
    const v = vendors.value.find(x => x.id === id)
    if (!v) return
    const ok = await askConfirm({
      title: 'Hapus vendor?',
      message: `"${v.nama || 'tanpa nama'}" akan dihapus.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    if (v.jadi) handleVendorDecision(v, false)
    vendors.value = vendors.value.filter(x => x.id !== id)
    delete selectedMap[String(id)]
    saveV(); toast('Vendor dihapus')
  }

  function removeEmptySeserahan(id) {
    const s = seserahan.value.find(x => x.id === id)
    if (!s) return
    if (!(s.item || '').trim() && !s.budget && !s.harga && !(s.link || '').trim()) {
      seserahan.value = seserahan.value.filter(x => x.id !== id)
      saveS()
    }
  }

  async function delSeserahan(id) {
    const s = seserahan.value.find(x => x.id === id)
    if (!s) return
    const ok = await askConfirm({
      title: 'Hapus item?',
      message: `"${s.item || 'tanpa nama'}" akan dihapus dari seserahan.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    seserahan.value = seserahan.value.filter(x => x.id !== id)
    delete selectedMap[String(id)]
    saveS(); toast('Item seserahan dihapus')
  }

  function removeEmptyMahar(id) {
    const m = mahar.value.find(x => x.id === id)
    if (!m) return
    if (!(m.item || '').trim() && !m.harga) {
      mahar.value = mahar.value.filter(x => x.id !== id)
      saveM()
    }
  }

  async function delMahar(id) {
    const m = mahar.value.find(x => x.id === id)
    if (!m) return
    const ok = await askConfirm({
      title: 'Hapus item?',
      message: `"${m.item || 'tanpa nama'}" akan dihapus dari mahar.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    mahar.value = mahar.value.filter(x => x.id !== id)
    delete selectedMap[String(id)]
    saveM(); toast('Item mahar dihapus')
  }

  async function delAdminGroup(id) {
    const g = admin.value.find(x => x.id === id)
    if (!g) return
    const ok = await askConfirm({
      title: 'Hapus bagian?',
      message: `Bagian "${g.grup || 'tanpa nama'}" beserta semua syaratnya akan dihapus.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    admin.value = admin.value.filter(x => x.id !== id)
    saveA(); toast('Bagian dihapus')
  }

  function exportGuestsCSV() {
    const META = { cpp:{label:'Keluarga Pengantin Pria'}, cpw:{label:'Keluarga Pengantin Wanita'}, teman_pria:{label:'Teman Pengantin Pria'}, teman_wanita:{label:'Teman Pengantin Wanita'}, tetangga_pria:{label:'Tetangga Pengantin Pria'}, tetangga_wanita:{label:'Tetangga Pengantin Wanita'}, lainnya:{label:'Lainnya'} }
    const head = ['No','Nama Lengkap','Jumlah Orang','Status Relasi','Undangan Untuk','Konfirmasi']
    const rows = guests.value.map((g, i) => [i+1, g.nama, g.jumlah, (META[g.status]||{label:'Lainnya'}).label, g.undangan||'keduanya', g.konfirmasi !== false ? 'Dikonfirmasi' : 'Belum'])
    downloadCSV('daftar-tamu-undangan.csv', toCSV(head, rows))
    toast('CSV tamu diunduh')
  }

  function exportBudgetCSV() {
    const head = ['No','Item','Status','Estimasi Budget','Aktual Budget','Selisih','Uang Muka','Sudah Dibayarkan','Sisa Pembayaran','Jatuh Tempo','Remarks']
    const rows = budget.value.map((b, i) => {
      const st = bStatus(b)
      return [i+1, b.item, st.label, b.estimasi, b.aktual, b.estimasi-b.aktual, b.uangMuka, b.dibayar, bSisa(b), b.jatuhTempo, b.remarks]
    })
    downloadCSV('anggaran-pernikahan.csv', toCSV(head, rows))
    toast('CSV anggaran diunduh')
  }

  // ── Bulk actions ───────────────────────────────────────────────────
  function applyBulk(tab, fields) {
    let c = 0
    if (tab === 'tamu') {
      const { status, undangan, konfirmasi } = fields
      if (!status && !undangan && konfirmasi === undefined) { toast('Pilih minimal satu perubahan'); return }
      guests.value.forEach(g => {
        if (!isSelected(g.id)) return
        if (status) g.status = status
        if (undangan) g.undangan = undangan
        if (konfirmasi !== undefined) g.konfirmasi = konfirmasi
        c++
      })
      if (c) saveG()
    } else if (tab === 'vendor') {
      const { kat, stat } = fields
      if (!kat && !stat) { toast('Pilih minimal satu perubahan'); return }
      vendors.value.forEach(v => {
        if (!isSelected(v.id)) return
        if (kat) v.category = kat
        if (stat) { v.jadi = (stat === 'jadi'); handleVendorDecision(v, v.jadi) }
        c++
      })
      if (c) saveV()
    } else if (tab === 'budget') {
      const { stat, due } = fields
      if (!stat && !due) { toast('Pilih minimal satu perubahan'); return }
      budget.value.forEach(b => {
        if (!isSelected(b.id)) return
        if (stat === 'lunas') b.dibayar = b.aktual
        else if (stat === 'belum') b.dibayar = 0
        if (due) b.jatuhTempo = due
        c++
      })
      if (c) saveB()
    } else if (tab === 'seserahan') {
      const { stat } = fields
      if (!stat) { toast('Pilih minimal satu perubahan'); return }
      seserahan.value.forEach(x => { if (isSelected(x.id)) { x.status = (stat === 'sudah'); c++ } })
      if (c) saveS()
    } else if (tab === 'mahar') {
      const { stat } = fields
      if (!stat) { toast('Pilih minimal satu perubahan'); return }
      mahar.value.forEach(x => { if (isSelected(x.id)) { x.status = (stat === 'sudah'); c++ } })
      if (c) saveM()
    }
    if (c) { clearSelected(); toast(`Berhasil mengubah ${c} item`); return true }
    return false
  }

  async function bulkDelete(tab) {
    const n = selectedIds.value.length
    if (!n) return
    const tabLabel = { tamu: 'tamu', vendor: 'vendor', budget: 'anggaran', seserahan: 'seserahan', mahar: 'mahar' }[tab] || tab
    const ok = await askConfirm({
      title: `Hapus ${n} item?`,
      message: `${n} item dari tab ${tabLabel} akan dihapus permanen.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    if (tab === 'tamu') { guests.value = guests.value.filter(x => !isSelected(x.id)); saveG() }
    else if (tab === 'vendor') { vendors.value = vendors.value.filter(x => !isSelected(x.id)); saveV() }
    else if (tab === 'budget') { budget.value = budget.value.filter(x => !isSelected(x.id)); saveB() }
    else if (tab === 'seserahan') { seserahan.value = seserahan.value.filter(x => !isSelected(x.id)); saveS() }
    else if (tab === 'mahar') { mahar.value = mahar.value.filter(x => !isSelected(x.id)); saveM() }
    clearSelected()
    toast(`${n} item dihapus`)
  }

  // ── Export / Import all ────────────────────────────────────────────
  function exportAll() {
    downloadJSON({
      app: 'wedding-planner', version: 1, exportedAt: new Date().toISOString(),
      data: { guests: guests.value, budget: budget.value, vendors: vendors.value, seserahan: seserahan.value, mahar: mahar.value, admin: admin.value, checklist: checklist.value, timeline: timeline.value },
      settings: { tabOrder: tabOrder.value },
    }, `wedding-planner-${dateStamp()}.json`)
    toast('Semua data diekspor')
  }

  function importAll(file) {
    const reader = new FileReader()
    reader.onload = async e => {
      let payload
      try { payload = JSON.parse(e.target.result) } catch { toast('File tidak bisa dibaca'); return }
      if (!payload || payload.app !== 'wedding-planner' || !payload.data) { toast('Bukan file backup Wedding Planner'); return }
      const d = payload.data
      const counts = [['guests','tamu'],['budget','budget'],['vendors','vendor'],['seserahan','seserahan'],['mahar','mahar'],['admin','administrasi'],['checklist','checklist'],['timeline','timeline']].map(([k,l]) => Array.isArray(d[k]) ? `${d[k].length} ${l}` : null).filter(Boolean)
      const when = payload.exportedAt ? new Date(payload.exportedAt).toLocaleDateString('id-ID') : 'tidak diketahui'
      if (!confirm(`Impor data dari file (dibuat ${when})?\n\nIsi: ${counts.join(', ')}.\n\nSEMUA data kamu saat ini akan DIGANTI.`)) return

      if (Array.isArray(d.guests))    guests.value    = d.guests
      if (Array.isArray(d.budget))    budget.value    = d.budget
      if (Array.isArray(d.vendors))   vendors.value   = d.vendors
      if (Array.isArray(d.seserahan)) seserahan.value = d.seserahan
      if (Array.isArray(d.mahar))     mahar.value     = d.mahar
      if (Array.isArray(d.admin))     admin.value     = d.admin
      if (Array.isArray(d.checklist)) checklist.value = d.checklist
      if (Array.isArray(d.timeline))  timeline.value  = d.timeline
      if (Array.isArray(payload.settings?.tabOrder)) tabOrder.value = payload.settings.tabOrder

      await _upsert({
        guests: guests.value, budget: budget.value, vendors: vendors.value,
        seserahan: seserahan.value, mahar: mahar.value, admin: admin.value,
        checklist: checklist.value, timeline: timeline.value,
        settings: { tabOrder: tabOrder.value, vFilter: vFilter.value },
      })
      toast('Data berhasil diimpor')
    }
    reader.readAsText(file)
  }

  // ── Export / Import per-tab ────────────────────────────────────────
  const TAB_IO = {
    tamu:      { label: 'tamu',         get: () => guests.value,    apply: v => { guests.value = v; clearSelected(); saveG() } },
    vendor:    { label: 'vendor',       get: () => vendors.value,   apply: v => { vendors.value = v; saveV() } },
    seserahan: { label: 'seserahan',    get: () => seserahan.value, apply: v => { seserahan.value = v; saveS() } },
    mahar:     { label: 'mahar',        get: () => mahar.value,     apply: v => { mahar.value = v; saveM() } },
    admin:     { label: 'administrasi', get: () => admin.value,     apply: v => { admin.value = v; saveA() } },
    checklist: { label: 'checklist',    get: () => checklist.value, apply: v => { checklist.value = v; saveCK() } },
    budget:    { label: 'budget',       get: () => budget.value,    apply: v => { budget.value = v; saveB() } },
    timeline:  { label: 'timeline',     get: () => timeline.value,  apply: v => { timeline.value = v; saveTL() } },
  }

  function exportTab(tab) {
    const cfg = TAB_IO[tab]
    if (!cfg) return
    downloadJSON({ app: 'wedding-planner', tab, version: 1, exportedAt: new Date().toISOString(), data: cfg.get() }, `wedding-planner-${tab}-${dateStamp()}.json`)
    toast(`Data ${cfg.label} diekspor`)
  }

  function importTab(tab, file) {
    const cfg = TAB_IO[tab]
    if (!cfg) return
    const reader = new FileReader()
    reader.onload = e => {
      let payload
      try { payload = JSON.parse(e.target.result) } catch { toast('File tidak bisa dibaca'); return }
      if (!payload || payload.app !== 'wedding-planner' || !Array.isArray(payload.data)) { toast('Bukan file data Wedding Planner'); return }
      if (payload.tab && payload.tab !== tab) { toast(`File ini untuk tab "${payload.tab}", bukan "${cfg.label}"`); return }
      if (!confirm(`Ganti semua data ${cfg.label} dengan ${payload.data.length} item dari file ini?`)) return
      cfg.apply(payload.data)
      toast(`Data ${cfg.label} diimpor`)
    }
    reader.readAsText(file)
  }

  // ── Supabase: load data ────────────────────────────────────────────
  function _applyData(data) {
    if (Array.isArray(data.guests))    guests.value    = data.guests
    if (Array.isArray(data.budget))    budget.value    = data.budget
    if (Array.isArray(data.vendors))   vendors.value   = data.vendors
    if (Array.isArray(data.seserahan)) seserahan.value = data.seserahan
    if (Array.isArray(data.mahar))     mahar.value     = data.mahar
    if (Array.isArray(data.admin))     admin.value     = data.admin
    if (Array.isArray(data.checklist)) checklist.value = data.checklist
    if (Array.isArray(data.timeline))  timeline.value  = data.timeline
    const s = data.settings || {}
    if (Array.isArray(s.tabOrder)) tabOrder.value = s.tabOrder

    if (s.vFilter) vFilter.value = s.vFilter
    if (s.ownerEmail) ownerEmail.value = s.ownerEmail
    if (s.couple) couple.value = { ...couple.value, ...s.couple }
    onboarded.value        = !!s.onboarded || isPaid.value
    showWelcomeGuide.value = !!s.showWelcomeGuide
    const seedNames = new Set(BUDGET_SEED.map(x => x.item))
    let changed = false
    budget.value.forEach(x => {
      if (x.template === undefined && !x.vendorId && x.id !== 'seserahan_auto' && x.id !== 'mahar_auto' && seedNames.has(x.item)) {
        x.template = true; changed = true
      }
    })
    if (changed) scheduleSave('budget', budget.value)
  }

  async function loadData(userId) {
    // Cek partner dulu — kalau user ini terdaftar sebagai partner di akun lain,
    // prioritaskan data bersama meski user ini punya data sendiri.
    const { data: pData } = await supabase.from('wedding_data')
      .select('*').eq('partner_user_id', userId).maybeSingle()

    if (pData) {
      ownerUserId.value  = pData.user_id
      isPartner.value    = true
      partnerEmail.value = user.value?.email || ''
      _applyData(pData)
      return
    }

    // Coba load sebagai owner
    const { data } = await supabase.from('wedding_data').select('*').eq('user_id', userId).maybeSingle()

    if (data) {
      ownerUserId.value  = userId
      isPartner.value    = false
      partnerEmail.value = data.partner_email || ''
      _applyData(data)
      if (!data.settings?.ownerEmail && user.value?.email) saveSettings()
      return
    }

    // Pengguna baru — isi data awal
    ownerUserId.value  = userId
    isPartner.value    = false
    partnerEmail.value = ''
    isNewUser.value    = true
    guests.value    = []
    budget.value    = BUDGET_SEED.slice()
    vendors.value   = []
    seserahan.value = SESERAHAN_SEED.map((item, i) => ({ id: i+1, item: item.item, status: false, budget: 0, harga: 0, link: '' }))
    mahar.value     = []
    admin.value     = JSON.parse(JSON.stringify(ADMIN_SEED))
    checklist.value = JSON.parse(JSON.stringify(CHECKLIST_SEED))
    timeline.value  = JSON.parse(JSON.stringify(TIMELINE_SEED))
    await supabase.from('wedding_data').insert({
      user_id: userId,
      guests: guests.value, budget: budget.value, vendors: vendors.value,
      seserahan: seserahan.value, mahar: mahar.value, admin: admin.value,
      checklist: checklist.value, timeline: timeline.value, settings: {},
    })
  }

  // ── Supabase: realtime sync ────────────────────────────────────────
  let _channel = null
  function subscribeRealtime(userId) {
    _channel?.unsubscribe()
    const listenId = ownerUserId.value || userId
    _channel = supabase.channel('wd:' + listenId)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'wedding_data',
        filter: `user_id=eq.${listenId}`,
      }, ({ new: d }) => {
        if (isPartner.value && d.partner_user_id === null) {
          isPartner.value    = false
          ownerUserId.value  = user.value.id
          partnerEmail.value = ''
          ownerEmail.value   = ''
          toast('Kamu dikeluarkan dari dashboard bersama')
          loadData(user.value.id)
          return
        }
        if (Array.isArray(d.guests))    guests.value    = d.guests
        if (Array.isArray(d.budget))    budget.value    = d.budget
        if (Array.isArray(d.vendors))   vendors.value   = d.vendors
        if (Array.isArray(d.seserahan)) seserahan.value = d.seserahan
        if (Array.isArray(d.mahar))     mahar.value     = d.mahar
        if (Array.isArray(d.admin))     admin.value     = d.admin
        if (Array.isArray(d.checklist)) checklist.value = d.checklist
        if (Array.isArray(d.timeline))  timeline.value  = d.timeline
      })
      .subscribe()
  }

  // ── Partner invite ─────────────────────────────────────────────────
  async function sendPartnerInvite(email) {
    const { data, error } = await supabase.from('partner_invitations')
      .insert({ owner_user_id: user.value.id, partner_email: email })
      .select('token').single()
    if (error) throw error
    return data.token
  }

  async function cancelPartnerInvite(id) {
    await supabase.from('partner_invitations').update({ status: 'cancelled' }).eq('id', id)
  }

  async function acceptPartnerInvite(token) {
    const { data: ownerUid, error } = await supabase.rpc('accept_partner_invite', {
      invite_token: token,
      partner_email_in: user.value.email,
    })
    if (error) throw new Error(error.message || 'Gagal menerima undangan')

    if (ownerUid) {
      // Set partner state langsung dari owner_uid yang dikembalikan RPC
      ownerUserId.value  = ownerUid
      isPartner.value    = true
      partnerEmail.value = user.value.email
      // Load data owner langsung — RLS partner_select mengizinkan karena
      // partner_user_id = auth.uid() baru saja di-set oleh RPC
      const { data } = await supabase.from('wedding_data')
        .select('*').eq('user_id', ownerUid).maybeSingle()
      if (data) _applyData(data)
    } else {
      await loadData(user.value.id)
    }
    subscribeRealtime(user.value.id)
  }

  async function removePartner() {
    const uid = ownerUserId.value || user.value.id
    // .select() mengembalikan baris yang BENAR-BENAR ter-update (dgn RLS).
    // Kalau kosong/eror, berarti gagal — jangan klaim sukses.
    const { data, error } = await supabase.from('wedding_data')
      .update({ partner_user_id: null, partner_email: null })
      .eq('user_id', uid)
      .select('user_id')
    if (error || !data?.length) {
      toast('Gagal menghapus pasangan, coba lagi')
      return
    }
    // Batalkan undangan yang masih aktif supaya link lama tak bisa dipakai join ulang
    await supabase.from('partner_invitations')
      .update({ status: 'cancelled' })
      .eq('owner_user_id', uid).in('status', ['pending', 'accepted'])
    partnerEmail.value = ''
    toast('Pasangan dihapus')
  }

  async function leavePartnership() {
    if (!isPartner.value || !ownerUserId.value) return
    // Lewat RPC security-definer: partner tak punya izin RLS utk mengubah
    // kolom kepemilikan langsung. Kalau owner sudah menghapus duluan,
    // RPC no-op — tak apa, kita tetap reset diri sendiri.
    const { error } = await supabase.rpc('leave_partnership')
    if (error) { toast('Gagal keluar, coba lagi'); return }
    isPartner.value    = false
    ownerUserId.value  = user.value.id
    partnerEmail.value = ''
    ownerEmail.value   = ''
    await loadData(user.value.id)
    subscribeRealtime(user.value.id)   // pindah channel ke dashboard sendiri
    toast('Kamu keluar dari dashboard bersama')
  }

  // Sinkronkan status kemitraan dgn DB — dipakai saat app kembali aktif,
  // karena realtime tak selalu sampai (RLS memblokir event pemutusan).
  async function revalidateMembership() {
    if (!user.value || loading.value) return
    if (isPartner.value) {
      // Masih terdaftar sbg partner di row owner?
      const { data } = await supabase.from('wedding_data')
        .select('user_id').eq('partner_user_id', user.value.id).maybeSingle()
      if (!data) {
        isPartner.value    = false
        ownerUserId.value  = user.value.id
        partnerEmail.value = ''
        ownerEmail.value   = ''
        toast('Kamu dikeluarkan dari dashboard bersama')
        await loadData(user.value.id)
        subscribeRealtime(user.value.id)
      }
    } else {
      // Owner: refresh status pasangan terkini
      const { data } = await supabase.from('wedding_data')
        .select('partner_email').eq('user_id', user.value.id).maybeSingle()
      if (data) partnerEmail.value = data.partner_email || ''
    }
  }

  async function _processPendingInvite() {
    const token = sessionStorage.getItem('pending_invite')
    if (!token || !user.value) return
    try {
      await acceptPartnerInvite(token)
      sessionStorage.removeItem('pending_invite')
      toast('Berhasil bergabung sebagai pasangan! 🎉')
    } catch (e) {
      sessionStorage.removeItem('pending_invite')
      toast(e.message || 'Gagal menerima undangan')
    }
  }

  // ── Auth ───────────────────────────────────────────────────────────
  async function loadProfile(id) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    profile.value = data
  }

  async function initAuth() {
    let initialDone = false
    // Saat app kembali ke depan, sinkronkan status kemitraan dgn DB.
    // Menutup celah realtime: partner yg dikeluarkan tak dpt event (RLS),
    // jadi cek ulang di sini biar statusnya ikut update tanpa perlu refresh.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') revalidateMembership()
    })
    window.addEventListener('focus', () => revalidateMembership())
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        try {
          if (session?.user) {
            user.value = session.user
            await loadProfile(session.user.id)
            await loadData(session.user.id)
            subscribeRealtime(session.user.id)
            await _processPendingInvite()
          }
        } catch (e) {
          console.error('[initAuth] INITIAL_SESSION error:', e)
        } finally {
          initialDone = true
          loading.value = false
        }
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        // SIGNED_IN dari _recoverAndRefresh bisa fire sebelum INITIAL_SESSION —
        // skip dulu, biarkan INITIAL_SESSION yang handle initial load.
        if (!initialDone) return
        if (user.value?.id === session.user.id) return
        loading.value = true
        try {
          user.value = session.user
          await loadProfile(session.user.id)
          await loadData(session.user.id)
          subscribeRealtime(session.user.id)
          await _processPendingInvite()
        } catch (e) {
          console.error('[initAuth] SIGNED_IN error:', e)
        } finally {
          loading.value = false
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
        ownerUserId.value = null
        isPartner.value = false
        partnerEmail.value = ''
        _channel?.unsubscribe()
        guests.value = []; budget.value = []; vendors.value = []
        seserahan.value = []; mahar.value = []; admin.value = []
        checklist.value = []; timeline.value = []
        couple.value = { pria: '', wanita: '', tanggal: '', jamMulai: '', jamSelesai: '' }
        onboarded.value = false; beginOnboarding.value = false
      }
    })
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    _channel?.unsubscribe()
    await supabase.auth.signOut()
  }

  // init() dijaga untuk backward compat (initAuth() yang sekarang dipakai)
  function init() {}

  // ── Dev helper (hanya di development) ──────────────────────────────
  if (import.meta.env.DEV) {
    window.__wp_reset_onboarding = () => {
      onboarded.value        = false
      beginOnboarding.value  = true
      showWelcomeGuide.value = false
      isNewUser.value        = true
      console.log('[WP Dev] Onboarding reset. Refresh tidak perlu.')
    }
    window.__wp_show_guide = () => {
      showWelcomeGuide.value = true
      console.log('[WP Dev] WelcomeGuide ditampilkan.')
    }
  }

  return {
    // auth
    user, profile, isPaid, loading,
    initAuth, signInWithGoogle, signOut,
    // partner
    ownerUserId, isPartner, partnerEmail, ownerEmail,
    sendPartnerInvite, cancelPartnerInvite, acceptPartnerInvite, removePartner, leavePartnership, revalidateMembership,
    // onboarding
    couple, onboarded, beginOnboarding, startOnboarding, completeOnboarding,
    showWelcomeGuide, dismissWelcomeGuide, tourSidebarOpen, tourSteps, startTour,
    // state
    guests, budget, vendors, seserahan, mahar, admin, checklist, timeline,
    activeTab, tabOrder, bFilter, vFilter, selectedMap,
    toastMsg, toastVisible,
    confirmShow, confirmTitle, confirmMessage, confirmOk, confirmCancel, confirmDanger,
    // computed
    confirmedGuests, selectedCount, selectedIds,
    // confirm dialog
    askConfirm, resolveConfirm,
    // selection
    isSelected, toggleSelected, clearSelected,
    // core
    init, toast,
    saveG, saveB, saveV, saveS, saveM, saveA, saveCK, saveTL, saveTabOrder,
    // budget
    bStatus, bSisa, nextBudgetId, budgetOrigin,
    addBudgetItem, delBudget, removeBudgetEmptyItem,
    // sync
    syncSeserahanToBudget, syncMaharToBudget, handleVendorDecision,
    // guest
    saveGuest, delGuest, duplicateGuest, exportGuestsCSV, exportBudgetCSV,
    // timeline
    delTimeline, removeEmptyTimeline,
    // vendor
    delVendor,
    // seserahan
    delSeserahan, removeEmptySeserahan,
    // mahar
    delMahar, removeEmptyMahar,
    // admin
    delAdminGroup,
    // bulk
    applyBulk, bulkDelete,
    // io
    exportAll, importAll, exportTab, importTab,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWeddingStore, import.meta.hot))
}
