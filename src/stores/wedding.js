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

  // Saklar penguncian trial/pembayaran. Mati (default) = semua orang punya
  // akses penuh terlepas dari trial_ends_at/paid_at — dipakai buat launch
  // dulu sebelum payment gateway (iPaymu/Midtrans/dll) beres didaftarkan.
  // Set VITE_PAYMENT_ENABLED=true di .env.local begitu gateway-nya siap;
  // seluruh alur trial/QRIS di bawah ini TIDAK PERLU diubah, tinggal nyala.
  //
  // PENTING waktu nanti diaktifkan: user yang onboarding SELAGI ini mati
  // sudah pasti punya trial_ends_at yang keburu lewat (start_trial() tetap
  // jalan normal, cuma penguncian aksesnya yang di-skip di sini) — begitu
  // saklar dinyalain mereka semua langsung kekunci ke PaymentPage tanpa
  // peringatan. Putuskan dulu mau di-grandfather (reset trial_ends_at user
  // lama lewat SQL) atau memang sengaja dikunci — jangan nyalain saklar ini
  // di production tanpa mikirin itu dulu.
  const PAYMENT_ENABLED = import.meta.env.VITE_PAYMENT_ENABLED === 'true'

  // trial_ends_at null = trial belum dimulai (belum onboarding) — jangan
  // anggap "expired" dalam kasus itu, App.vue sudah gate lewat !onboarded
  // duluan sebelum hasAccess relevan.
  const trialExpired = computed(() => {
    const t = profile.value?.trial_ends_at
    return !!t && new Date(t).getTime() < Date.now()
  })
  const hasAccess = computed(() => !PAYMENT_ENABLED || isPaid.value || !trialExpired.value)
  const trialDaysLeft = computed(() => {
    const t = profile.value?.trial_ends_at
    if (!t) return null
    const ms = new Date(t).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / 86400000))
  })

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

  // ── Quick add / reminders ────────────────────────────────────────
  const quickAddTarget = ref('')
  const quickAddNonce  = ref(0)
  const reminders = ref({
    enabled: false,
    daysBeforeBudget: 3,
    daysBeforeTimeline: 7,
    lastNotified: {},
  })

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
  // "belum" ikut dihitung (diundang, masih diasumsikan hadir sampai
  // diputuskan lain) — cuma "tidak" dan "virtual" yang dikeluarkan dari
  // hitungan fisik (kursi/katering/kapasitas venue).
  const confirmedGuests = computed(() => guests.value.filter(g => {
    const k = g.kehadiran || 'belum'
    return k !== 'tidak' && k !== 'virtual'
  }))
  const selectedCount   = computed(() => Object.keys(selectedMap).length)
  const selectedIds     = computed(() => Object.keys(selectedMap).map(k => isNaN(k) ? k : Number(k)))

  // ── Kapasitas venue ──────────────────────────────────────────────
  // Total tamu terkonfirmasi (satuan orang) vs kapasitas venue yang
  // DIPAKAI. Kapasitas nempel di record vendor (rumah datanya di situ) —
  // sini cuma baca. Kalau ada >1 venue dipakai (mis. akad + resepsi),
  // ambil yang paling besar (asумsi itu acara utama/resepsi).
  const totalGuestPax = computed(() => confirmedGuests.value.reduce((s, g) => s + (g.jumlah || 0), 0))
  const venueCapacity = computed(() => {
    const caps = vendors.value
      .filter(v => v.category === 'venue' && v.jadi && v.kapasitas > 0)
      .map(v => v.kapasitas)
    return caps.length ? Math.max(...caps) : 0
  })
  // >0 = kelebihan sekian orang, <=0 = masih muat (sisa kursi = -nilai),
  // null = belum ada venue dipakai / kapasitas belum diisi (jangan warning).
  const capacityOver = computed(() =>
    venueCapacity.value > 0 ? totalGuestPax.value - venueCapacity.value : null
  )

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

  // Kapan terakhir tiap kolom ditulis dari sini. Dipakai realtime handler
  // supaya echo dari tulisan sendiri (yang bisa berisi snapshot basi kalau
  // user masih lanjut mengetik/toggle) tidak menimpa balik state lokal.
  // Ini masih dipakai untuk kolom wedding_data yang belum dinormalisasi
  // (budget, vendors, seserahan, mahar, admin, checklist, settings).
  const _lastWriteAt = {}
  const REALTIME_ECHO_GRACE_MS = 3000

  async function _upsert(data) {
    if (!user.value) return
    const uid = ownerUserId.value || user.value.id
    Object.keys(data).forEach(col => { _lastWriteAt[col] = Date.now() })
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

  // ── Tabel ternormalisasi (Wave 1: guests, timeline) ─────────────────
  // Snapshot terakhir yang sudah sinkron ke server, per kolom, key = row id.
  // Dipakai _diffAndSync buat tahu baris mana yang baru/berubah/terhapus,
  // tanpa perlu mengubah cara komponen memanggil saveG()/saveTL() (tetap
  // "mutasi array lalu panggil saveX() tanpa argumen" seperti sebelumnya).
  const _shadow = {
    guests: new Map(), timeline: new Map(),
    budget: new Map(), vendors: new Map(), seserahan: new Map(), mahar: new Map(),
    adminGroups: new Map(), adminItems: new Map(),
    checklistGroups: new Map(), checklistItems: new Map(),
  }

  function _seedShadow(col, rows, stripKeys = []) {
    _shadow[col].clear()
    const strip = r => {
      if (!stripKeys.length) return r
      const rest = { ...r }
      stripKeys.forEach(k => delete rest[k])
      return rest
    }
    rows.forEach(r => { if (r.id != null) _shadow[col].set(r.id, JSON.parse(JSON.stringify(strip(r)))) })
  }

  // opts.stripKeys: field yang dikecualikan dari perbandingan DAN payload ke
  // server (dipakai grup admin/checklist buat exclude field "items" nested-nya
  // sendiri — tanpa ini tiap edit item bakal keliatan kayak "grup berubah" dan
  // salah kirim UPDATE ke tabel grup yang isinya nggak nyambung). Default []
  // -> perilaku persis sama seperti sebelumnya buat 6 entity flat yang sudah ada.
  async function _diffAndSync(col, table, rows, opts = {}) {
    if (!user.value) return
    const stripKeys = opts.stripKeys || []
    const shadow = _shadow[col]
    const uid = ownerUserId.value || user.value.id
    const seen = new Set()
    const toInsert = [], toUpdate = []

    const _stripKeys = row => {
      if (!stripKeys.length) return row
      const rest = { ...row }
      stripKeys.forEach(k => delete rest[k])
      return rest
    }

    for (const row of rows) {
      if (row.id == null || !shadow.has(row.id)) { toInsert.push(row); continue }
      seen.add(row.id)
      if (JSON.stringify(shadow.get(row.id)) !== JSON.stringify(_stripKeys(row))) toUpdate.push(row)
    }
    const toDeleteIds = [...shadow.keys()].filter(id => !seen.has(id) && !rows.some(r => r.id === id))

    // Field yang server-managed — jangan pernah dikirim dari nilai lokal
    // (mis. duplicateGuest nyalin seluruh objek lama, ikut bawa created_at/
    // updated_at/owner_user_id basi). id ditolak Postgres kalau di-SET
    // eksplisit (generated always as identity); sisanya harus otoritatif
    // dari server/konteks saat ini, bukan dari objek yang lagi di-diff.
    const _stripSystem = row => {
      const { id, owner_user_id, created_at, updated_at, ...rest } = _stripKeys(row)
      return rest
    }

    await Promise.all([
      ...toInsert.map(async row => {
        const { data, error } = await supabase.from(table)
          .insert({ owner_user_id: uid, ..._stripSystem(row) }).select().single()
        if (!error && data) {
          // Tandai SEBELUM apapun lagi — echo baris ini nggak mungkin nyampe
          // sebelum insert-nya sendiri selesai (baris/id-nya belum ada).
          _lastRowWriteAt[col]?.set(data.id, Date.now())
          Object.assign(row, data)
          shadow.set(data.id, JSON.parse(JSON.stringify(_stripKeys(row))))
        } else if (error) {
          console.error(`[_diffAndSync] insert ${table} gagal:`, error)
        }
      }),
      ...toUpdate.map(async row => {
        // Tandai SEBELUM network call — biar echo yang balik (yg pasti
        // updated_at-nya lebih baru dari cache) nggak nimpa ketikan/klik
        // yang terjadi SELAMA request ini masih di jalan.
        _lastRowWriteAt[col]?.set(row.id, Date.now())
        const { error } = await supabase.from(table)
          .update(_stripSystem(row)).eq('id', row.id).eq('owner_user_id', uid)
        if (!error) shadow.set(row.id, JSON.parse(JSON.stringify(_stripKeys(row))))
        else console.error(`[_diffAndSync] update ${table} gagal:`, error)
      }),
      ...toDeleteIds.map(async id => {
        _lastRowWriteAt[col]?.set(id, Date.now())
        const { error } = await supabase.from(table).delete().eq('id', id).eq('owner_user_id', uid)
        if (!error) shadow.delete(id)
        else console.error(`[_diffAndSync] delete ${table} gagal:`, error)
      }),
    ])
  }

  function scheduleDiffSync(col, table, rowsRef) {
    if (!user.value) return
    clearTimeout(_timers[col])
    _timers[col] = setTimeout(() => _diffAndSync(col, table, rowsRef.value), 600)
  }

  // ── Grup bersarang (Wave 3: admin, checklist) ───────────────────────
  // Grup WAJIB selesai duluan (di-await, bukan Promise.all) — item baru
  // butuh id ASLI grup (group_id) yang cuma ada setelah insert grupnya
  // selesai. it.group_id = g.id memutasi object item yang BENERAN (bukan
  // salinan .map()) karena _diffAndSync's insert path menulis id asli
  // balik ke object lewat Object.assign, dan itu harus kena ke object yang
  // sama yang dipakai di sini buat nge-set group_id-nya item.
  async function _diffAndSyncNested(groupsCol, groupsTable, itemsCol, itemsTable, groups) {
    await _diffAndSync(groupsCol, groupsTable, groups, { stripKeys: ['items'] })
    const flatItems = []
    groups.forEach(g => (g.items || []).forEach(it => { it.group_id = g.id; flatItems.push(it) }))
    await _diffAndSync(itemsCol, itemsTable, flatItems)
  }

  function scheduleDiffSyncNested(timerKey, groupsCol, groupsTable, itemsCol, itemsTable, groupsRef) {
    if (!user.value) return
    clearTimeout(_timers[timerKey])
    _timers[timerKey] = setTimeout(
      () => _diffAndSyncNested(groupsCol, groupsTable, itemsCol, itemsTable, groupsRef.value),
      600
    )
  }

  // ── Save functions ─────────────────────────────────────────────────
  const saveG  = () => scheduleDiffSync('guests',   'guests',        guests)
  const saveB  = () => scheduleDiffSync('budget',   'budget_items',  budget)
  const saveV  = () => scheduleDiffSync('vendors',  'vendors',       vendors)
  const saveA  = () => scheduleDiffSyncNested('admin',     'adminGroups',     'admin_groups',     'adminItems',     'admin_items',     admin)
  const saveCK = () => scheduleDiffSyncNested('checklist', 'checklistGroups', 'checklist_groups', 'checklistItems', 'checklist_items', checklist)
  const saveTL = () => scheduleDiffSync('timeline', 'timeline_tasks', timeline)

  function saveS() {
    syncSeserahanToBudget()
    scheduleDiffSync('seserahan', 'seserahan_items', seserahan)
    scheduleDiffSync('budget',    'budget_items',     budget)
  }

  function saveM() {
    syncMaharToBudget()
    scheduleDiffSync('mahar',  'mahar_items',   mahar)
    scheduleDiffSync('budget', 'budget_items',  budget)
  }

  function _settingsPayload() {
    return {
      tabOrder: tabOrder.value,
      bFilter: bFilter.value,
      vFilter: vFilter.value,
      couple: couple.value,
      onboarded: onboarded.value,
      showWelcomeGuide: showWelcomeGuide.value,
      ownerEmail: user.value?.email || ownerEmail.value || '',
      reminders: reminders.value,
    }
  }

  function _applySettingsPayload(settings = {}) {
    if (!settings || typeof settings !== 'object') return
    if (Array.isArray(settings.tabOrder)) tabOrder.value = settings.tabOrder
    if (settings.bFilter) bFilter.value = settings.bFilter
    if (settings.vFilter) vFilter.value = settings.vFilter
    if (settings.couple && typeof settings.couple === 'object') {
      couple.value = { ...couple.value, ...settings.couple }
    }
    if (typeof settings.onboarded === 'boolean') onboarded.value = settings.onboarded
    if (typeof settings.showWelcomeGuide === 'boolean') showWelcomeGuide.value = settings.showWelcomeGuide
    if (settings.ownerEmail) ownerEmail.value = settings.ownerEmail
    if (settings.reminders && typeof settings.reminders === 'object') {
      reminders.value = {
        enabled: false,
        daysBeforeBudget: 3,
        daysBeforeTimeline: 7,
        lastNotified: {},
        ...settings.reminders,
        lastNotified: settings.reminders.lastNotified || {},
      }
    }
  }
  function saveSettings() { scheduleSave('settings', _settingsPayload()) }

  function saveTabOrder(order) {
    tabOrder.value = order
    saveSettings()
  }

  function requestQuickAdd(tab) {
    quickAddTarget.value = tab
    quickAddNonce.value++
  }

  function saveReminderSettings(patch = {}) {
    reminders.value = {
      enabled: false,
      daysBeforeBudget: 3,
      daysBeforeTimeline: 7,
      lastNotified: {},
      ...reminders.value,
      ...patch,
      lastNotified: {
        ...(reminders.value?.lastNotified || {}),
        ...(patch.lastNotified || {}),
      },
    }
    saveSettings()
  }

  function markReminderNotified(key) {
    reminders.value = {
      ...reminders.value,
      lastNotified: {
        ...(reminders.value?.lastNotified || {}),
        [key]: true,
      },
    }
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
    // budget/timeline/seserahan sudah pindah ke tabel sendiri — dibersihkan
    // lewat _diffAndSync langsung (di bawah), bukan lagi lewat payload
    // wedding_data.
    let clearedTimeline = false, clearedBudget = false, clearedSeserahan = false
    let clearedAdmin = false, clearedChecklist = false
    if (isNewUser.value) {
      const t = data.templates || {}
      if (!t.budget)    { budget.value = [];    clearedBudget = true }
      if (!t.timeline)  { timeline.value = [];  clearedTimeline = true }
      if (!t.admin)     { admin.value = [];     clearedAdmin = true }
      if (!t.checklist) { checklist.value = []; clearedChecklist = true }
      if (!t.seserahan) { seserahan.value = []; clearedSeserahan = true }
    }
    onboarded.value = true
    beginOnboarding.value = false
    activeTab.value = 'home'
    // Simpan LANGSUNG (awaited), bukan lewat debounce, supaya flag onboarded
    // + profil pasangan pasti sudah masuk DB sebelum user sempat refresh.
    if (isNewUser.value) showWelcomeGuide.value = true
    clearTimeout(_timers.settings)
    payload.settings = _settingsPayload()
    await Promise.all([
      _upsert(payload),
      clearedTimeline  ? _diffAndSync('timeline', 'timeline_tasks', timeline.value)     : Promise.resolve(),
      clearedBudget    ? _diffAndSync('budget', 'budget_items', budget.value)           : Promise.resolve(),
      clearedSeserahan ? _diffAndSync('seserahan', 'seserahan_items', seserahan.value)  : Promise.resolve(),
      clearedAdmin     ? _diffAndSyncNested('adminGroups', 'admin_groups', 'adminItems', 'admin_items', admin.value) : Promise.resolve(),
      clearedChecklist ? _diffAndSyncNested('checklistGroups', 'checklist_groups', 'checklistItems', 'checklist_items', checklist.value) : Promise.resolve(),
      _startTrialIfNeeded(),
    ])
    isNewUser.value = false
  }

  // Mulai trial 2 hari — RPC dijaga server-side (cuma jalan sekali, lihat
  // 020_payment_trial.sql), jadi aman dipanggil tiap completeOnboarding
  // tanpa resiko reset trial user lama yang sudah pernah mulai.
  async function _startTrialIfNeeded() {
    if (profile.value?.trial_ends_at) return // sudah pernah mulai, RPC no-op
    const { error } = await supabase.rpc('start_trial')
    if (error) { console.error('[_startTrialIfNeeded] gagal:', error); return }
    if (profile.value) {
      profile.value = { ...profile.value, trial_ends_at: new Date(Date.now() + 2 * 86400000).toISOString() }
    }
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
    if (b.aktual <= 0) return { key: 'kosong', label: 'Belum Diisi',  color: '#9C7575', bg: '#EDE5E2', text: '#6b4848' }
    if (b.dibayar >= b.aktual) return { key: 'lunas', label: 'Lunas',   color: '#E5C99A', bg: '#CD9F65', text: '#3a2a10' }
    if (b.dibayar > 0)  return { key: 'dp',    label: 'Sebagian',  color: '#CD9F65', bg: '#F0E6CB', text: '#7a5c28' }
    return                     { key: 'belum', label: 'Belum Bayar', color: '#B32E33', bg: '#F8E8E8', text: '#7a1a1a' }
  }

  const bSisa = b => Math.max((b.aktual || 0) - (b.dibayar || 0), 0)

  function nextBudgetId() {
    const nums = budget.value.map(b => b.id).filter(x => typeof x === 'number')
    return nums.length ? Math.max(...nums) + 1 : 1
  }

  // "originType" gantiin skema lama yang overload kolom id jadi sentinel
  // string ('seserahan_auto'/'mahar_auto') — id sekarang selalu numerik
  // asli dari server, jadi asal baris ditandai eksplisit di kolom ini.
  function budgetOrigin(b) {
    if (b.vendorId) return { label: 'Vendor', cls: 'bo-vendor', managed: true, tip: 'Otomatis dari vendor yang Dipakai', tipDel: "Ditambahkan dari tab Vendor — untuk menghapus, matikan 'Dipakai' di tab Vendor" }
    if (b.originType === 'seserahan_auto') return { label: 'Seserahan', cls: 'bo-ser', managed: true, tip: 'Otomatis dari tab Seserahan', tipDel: 'Ditambahkan dari tab Seserahan — kelola item & nilainya dari tab Seserahan' }
    if (b.originType === 'mahar_auto') return { label: 'Mahar', cls: 'bo-mahar', managed: true, tip: 'Otomatis dari tab Mahar', tipDel: 'Ditambahkan dari tab Mahar — kelola item & nilainya dari tab Mahar' }
    if (b.template || b.originType === 'template') return { label: 'Template', cls: 'bo-tpl', managed: false, tip: 'Contoh bawaan — boleh diedit atau dihapus' }
    return null
  }

  // ── Sync seserahan / mahar → budget (save dihandle caller) ──────────
  function syncSeserahanToBudget() {
    const active  = seserahan.value.filter(x => x.status)
    const tBudget = active.reduce((s, x) => s + (parseInt(x.budget) || 0), 0)
    const tHarga  = active.reduce((s, x) => s + (parseInt(x.harga)  || 0), 0)
    const bIdx = budget.value.findIndex(b => b.originType === 'seserahan_auto')
    if (active.length === 0 || (tBudget === 0 && tHarga === 0)) {
      if (bIdx > -1) budget.value.splice(bIdx, 1)
    } else if (bIdx > -1) {
      budget.value[bIdx].estimasi = tBudget
      budget.value[bIdx].aktual   = tHarga
      budget.value[bIdx].item     = 'Total Seserahan'
    } else {
      // Tanpa `id` — dianggap baris baru oleh diff engine, server generate id asli
      budget.value.push({ originType: 'seserahan_auto', item: 'Total Seserahan', estimasi: tBudget, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: 'Sinkronisasi otomatis dari tab Seserahan' })
    }
  }

  function syncMaharToBudget() {
    const active = mahar.value.filter(x => x.status)
    const tHarga = active.reduce((s, x) => s + (parseInt(x.harga) || 0), 0)
    const bIdx = budget.value.findIndex(b => b.originType === 'mahar_auto')
    if (active.length === 0 || tHarga === 0) {
      if (bIdx > -1) budget.value.splice(bIdx, 1)
    } else if (bIdx > -1) {
      budget.value[bIdx].estimasi = tHarga
      budget.value[bIdx].aktual   = tHarga
      budget.value[bIdx].item     = 'Total Mahar'
    } else {
      budget.value.push({ originType: 'mahar_auto', item: 'Total Mahar', estimasi: tHarga, aktual: tHarga, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: 'Sinkronisasi otomatis dari tab Mahar' })
    }
  }

  // ── Status hubungan vendor ─────────────────────────────────────────
  // status: incar → dihubungi → dipakai → batal. "dipakai" = jadi=true
  // (harga masuk Budget). jadi tetap ada sbg flag turunan biar semua kode
  // lama yang baca v.jadi nggak perlu disentuh.
  function setVendorStatus(vendor, status) {
    vendor.status = status
    const jadi = status === 'dipakai'
    if (vendor.jadi !== jadi) {
      vendor.jadi = jadi
      handleVendorDecision(vendor, jadi)  // sudah panggil saveB() di dalam
    }
    saveV()
  }

  // Info pembayaran vendor — dibaca dari baris Budget yang nyambung
  // (vendorId). Uang dikelola di Budget; sini cuma baca buat ditampilkan
  // di kartu vendor. null kalau vendor belum dipakai / belum ada barisnya.
  function vendorPayInfo(vendor) {
    const b = budget.value.find(x => x.vendorId === vendor.id)
    if (!b) return null
    const total   = b.aktual || 0
    const dibayar = b.dibayar || 0
    return {
      total, dibayar,
      sisa: Math.max(total - dibayar, 0),
      jatuhTempo: b.jatuhTempo || null,
      lunas: total > 0 && dibayar >= total,
      pct: total > 0 ? Math.round(dibayar / total * 100) : 0,
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
        budget.value.push({ vendorId: vendor.id, originType: 'vendor', item: `${catLabel} - ${vendor.nama}`, estimasi: vendor.harga, aktual: vendor.harga, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: vendor.deskripsi })
      }
    } else {
      if (existingIdx > -1) budget.value.splice(existingIdx, 1)
    }
    saveB()
  }

  // ── Budget CRUD ────────────────────────────────────────────────────
  async function addBudgetItem() {
    // PK budget_items di-generate server — insert dulu & tunggu id
    // aslinya balik, bukan minting id lokal seperti dulu (nextBudgetId()).
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('budget_items')
      .insert({ owner_user_id: uid, item: '', estimasi: 0, aktual: 0, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: '', originType: 'manual' })
      .select().single()
    if (error || !row) { toast('Gagal menambah item, coba lagi'); return null }
    budget.value.push(row)
    _shadow.budget.set(row.id, JSON.parse(JSON.stringify(row)))
    bFilter.value = 'all'
    return row.id
  }

  function delBudget(id) {
    const b = budget.value.find(x => x.id === id)
    if (!b) return false
    if (b.originType === 'seserahan_auto' || b.originType === 'mahar_auto') {
      const src = b.originType === 'mahar_auto' ? 'Mahar' : 'Seserahan'
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
  async function saveGuest(data, editId) {
    if (editId) {
      const g = guests.value.find(x => x.id === editId)
      if (g) Object.assign(g, data)
      saveG()
      return true
    }
    // Tamu baru: PK di tabel `guests` di-generate server (identity column),
    // jadi harus insert dulu & tunggu id aslinya balik — tidak bisa minting
    // id lokal seperti dulu (max+1).
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('guests')
      .insert({ owner_user_id: uid, ...data }).select().single()
    if (error || !row) { toast('Gagal menambah tamu, coba lagi'); return false }
    guests.value.push(row)
    _shadow.guests.set(row.id, JSON.parse(JSON.stringify(row)))
    return true
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

  async function addTimelineTask() {
    // Sama seperti guests: PK di tabel timeline_tasks di-generate server,
    // jadi insert dulu & tunggu id aslinya balik, bukan minting max+1 lokal.
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('timeline_tasks')
      .insert({
        owner_user_id: uid, tugas: '', deadline: null, status: 'belum',
        pic: '', tanggalSelesai: null, catatan: '',
      })
      .select().single()
    if (error || !row) { toast('Gagal menambah tugas, coba lagi'); return null }
    timeline.value.push(row)
    _shadow.timeline.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
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

  async function addVendor(vData) {
    const uid = ownerUserId.value || user.value.id
    // jadi turunan dari status — vendor bisa langsung dibuat "dipakai".
    const jadi = vData.status === 'dipakai'
    const { data: row, error } = await supabase.from('vendors')
      .insert({ owner_user_id: uid, ...vData, jadi }).select().single()
    if (error || !row) { toast('Gagal menambah vendor, coba lagi'); return null }
    vendors.value.push(row)
    _shadow.vendors.set(row.id, JSON.parse(JSON.stringify(row)))
    if (jadi) handleVendorDecision(row, true)  // langsung masukin ke Budget
    return row
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

  async function addSeserahanItem() {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('seserahan_items')
      .insert({ owner_user_id: uid, item: '', status: false, budget: 0, harga: 0, link: '' })
      .select().single()
    if (error || !row) { toast('Gagal menambah item, coba lagi'); return null }
    seserahan.value.push(row)
    _shadow.seserahan.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
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

  async function addMaharItem() {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('mahar_items')
      .insert({ owner_user_id: uid, item: '', status: false, harga: 0 })
      .select().single()
    if (error || !row) { toast('Gagal menambah item, coba lagi'); return null }
    mahar.value.push(row)
    _shadow.mahar.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
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

  async function addAdminGroup() {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('admin_groups')
      .insert({ owner_user_id: uid, grup: '' }).select().single()
    if (error || !row) { toast('Gagal menambah bagian, coba lagi'); return null }
    row.items = []
    admin.value.push(row)
    const { items, ...groupSnap } = row
    _shadow.adminGroups.set(row.id, JSON.parse(JSON.stringify(groupSnap)))
    return row
  }

  async function addAdminItem(groupId) {
    const g = admin.value.find(x => x.id === groupId)
    if (!g) return null
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('admin_items')
      .insert({ owner_user_id: uid, group_id: groupId, syarat: '', status: false }).select().single()
    if (error || !row) { toast('Gagal menambah syarat, coba lagi'); return null }
    g.items.push(row)
    _shadow.adminItems.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
  }

  async function addChecklistGroup(name) {
    const uid = ownerUserId.value || user.value.id
    const position = checklist.value.length
    const { data: row, error } = await supabase.from('checklist_groups')
      .insert({ owner_user_id: uid, fase: name, position }).select().single()
    if (error || !row) { toast('Gagal menambah fase, coba lagi'); return null }
    row.items = []
    checklist.value.push(row)
    const { items, ...groupSnap } = row
    _shadow.checklistGroups.set(row.id, JSON.parse(JSON.stringify(groupSnap)))
    return row
  }

  async function addChecklistItem(groupId) {
    const g = checklist.value.find(x => x.id === groupId)
    if (!g) return null
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('checklist_items')
      .insert({ owner_user_id: uid, group_id: groupId, tugas: '', status: false }).select().single()
    if (error || !row) { toast('Gagal menambah tugas, coba lagi'); return null }
    g.items.push(row)
    _shadow.checklistItems.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
  }

  function exportGuestsCSV() {
    const META = { cpp:{label:'Keluarga Pengantin Pria'}, cpw:{label:'Keluarga Pengantin Wanita'}, teman_pria:{label:'Teman Pengantin Pria'}, teman_wanita:{label:'Teman Pengantin Wanita'}, tetangga_pria:{label:'Tetangga Pengantin Pria'}, tetangga_wanita:{label:'Tetangga Pengantin Wanita'}, lainnya:{label:'Lainnya'} }
    const KEH = { belum:'Belum Konfirmasi', hadir:'Hadir', tidak:'Tidak Hadir', virtual:'Virtual' }
    const head = ['No','Nama Lengkap','Jumlah Orang','Relasi','Undangan Untuk','Kehadiran']
    const rows = guests.value.map((g, i) => [i+1, g.nama, g.jumlah, (META[g.relasi]||{label:'Lainnya'}).label, g.undangan||'keduanya', KEH[g.kehadiran || 'belum']])
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
      const { relasi, undangan, kehadiran } = fields
      if (!relasi && !undangan && !kehadiran) { toast('Pilih minimal satu perubahan'); return }
      guests.value.forEach(g => {
        if (!isSelected(g.id)) return
        if (relasi) g.relasi = relasi
        if (undangan) g.undangan = undangan
        if (kehadiran) g.kehadiran = kehadiran
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
    else if (tab === 'budget') {
      const selected = budget.value.filter(x => isSelected(x.id))
      const blocked = selected.filter(x => budgetOrigin(x)?.managed)
      const deletable = selected.filter(x => !budgetOrigin(x)?.managed)
      if (!deletable.length) {
        clearSelected()
        toast('Item Budget terpilih dikelola otomatis — tidak bisa dihapus dari sini')
        return
      }
      budget.value = budget.value.filter(x => !isSelected(x.id) || budgetOrigin(x)?.managed)
      saveB()
      if (blocked.length) toast(`${blocked.length} item otomatis tidak dihapus`)
    }
    else if (tab === 'seserahan') { seserahan.value = seserahan.value.filter(x => !isSelected(x.id)); saveS() }
    else if (tab === 'mahar') { mahar.value = mahar.value.filter(x => !isSelected(x.id)); saveM() }
    clearSelected()
    toast(`${n} item dihapus`)
  }

  // ── Export / Import all ────────────────────────────────────────────
  function exportAll() {
    downloadJSON({
      app: 'wedding-planner',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        guests: guests.value,
        budget: budget.value,
        vendors: vendors.value,
        seserahan: seserahan.value,
        mahar: mahar.value,
        admin: admin.value,
        checklist: checklist.value,
        timeline: timeline.value,
      },
      settings: _settingsPayload(),
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
      const hasSettings = payload.settings && Object.keys(payload.settings).length > 0
      const settingsNote = hasSettings ? '\nSettings aplikasi juga akan dipulihkan (profil pasangan, onboarding, filter, reminder, dan urutan tab).' : ''
      if (!confirm(`Impor data dari file (dibuat ${when})?\n\nIsi: ${counts.join(', ')}.${settingsNote}\n\nSEMUA data kamu saat ini akan DIGANTI.`)) return

      if (Array.isArray(d.guests))    guests.value    = d.guests
      if (Array.isArray(d.vendors))   vendors.value   = d.vendors
      if (Array.isArray(d.seserahan)) seserahan.value = d.seserahan
      if (Array.isArray(d.mahar))     mahar.value     = d.mahar
      if (Array.isArray(d.admin))     admin.value     = d.admin
      if (Array.isArray(d.checklist)) checklist.value = d.checklist
      if (Array.isArray(d.timeline))  timeline.value  = d.timeline
      if (Array.isArray(d.budget)) {
        // Backup lama (sebelum originType ada) masih pakai sentinel
        // id/item string — derive originType-nya biar budgetOrigin() tetap
        // ngenalin baris mirror seserahan/mahar/vendor dengan benar.
        budget.value = d.budget.map(b => ({
          ...b,
          originType: b.originType || (
            b.vendorId ? 'vendor'
            : (b.id === 'seserahan_auto' || b.item === 'Total Seserahan') ? 'seserahan_auto'
            : (b.id === 'mahar_auto' || b.item === 'Total Mahar') ? 'mahar_auto'
            : b.template ? 'template'
            : 'manual'
          ),
        }))
      }
      _applySettingsPayload(payload.settings)

      // Semua 8 entity sudah pindah ke tabel sendiri — sinkron lewat diff
      // engine, `_upsert` di sini cuma bawa settings.
      await Promise.all([
        _upsert({ settings: _settingsPayload() }),
        _diffAndSync('guests', 'guests', guests.value),
        _diffAndSync('timeline', 'timeline_tasks', timeline.value),
        _diffAndSync('budget', 'budget_items', budget.value),
        _diffAndSync('vendors', 'vendors', vendors.value),
        _diffAndSync('seserahan', 'seserahan_items', seserahan.value),
        _diffAndSync('mahar', 'mahar_items', mahar.value),
        _diffAndSyncNested('adminGroups', 'admin_groups', 'adminItems', 'admin_items', admin.value),
        _diffAndSyncNested('checklistGroups', 'checklist_groups', 'checklistItems', 'checklist_items', checklist.value),
      ])
      clearSelected()
      activeTab.value = 'home'
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
  // guests & timeline sudah pindah ke tabel sendiri — dimuat terpisah lewat
  // _loadGuestsAndTimeline(), bukan lagi dari kolom JSONB wedding_data.
  async function _loadGuestsAndTimeline(ownerId) {
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from('guests').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('timeline_tasks').select('*').eq('owner_user_id', ownerId).order('id'),
    ])
    guests.value   = g || []
    timeline.value = t || []
    _seedShadow('guests', guests.value)
    _seedShadow('timeline', timeline.value)
  }

  // Wave 2: budget/vendors/seserahan/mahar juga sudah pindah ke tabel
  // sendiri — dimuat terpisah, fungsi baru (bukan digabung ke
  // _loadGuestsAndTimeline) biar resikonya kecil, sama seperti keputusan
  // Wave 1 dulu.
  async function _loadBudgetVendorsSeserahanMahar(ownerId) {
    const [{ data: b }, { data: v }, { data: s }, { data: m }] = await Promise.all([
      supabase.from('budget_items').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('vendors').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('seserahan_items').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('mahar_items').select('*').eq('owner_user_id', ownerId).order('id'),
    ])
    budget.value    = b || []
    vendors.value   = v || []
    seserahan.value = s || []
    mahar.value     = m || []
    _seedShadow('budget', budget.value)
    _seedShadow('vendors', vendors.value)
    _seedShadow('seserahan', seserahan.value)
    _seedShadow('mahar', mahar.value)

    // Migrasi-lama: tandai baris budget seed (BUDGET_SEED) yang belum
    // punya originType/template sebagai 'template'. HARUS jalan SETELAH
    // shadow di-seed di atas — supaya diff engine lihat baris yang ditag
    // sebagai "berubah dari shadow" dan beneran ngirim update ke server
    // (kalau dijalankan sebelum seeding, shadow akan sama persis dengan
    // hasil tag dan diff-nya nggak pernah ke-persist).
    const seedNames = new Set(BUDGET_SEED.map(x => x.item))
    let changed = false
    budget.value.forEach(x => {
      if (!x.originType || x.originType === 'manual') {
        if (!x.template && !x.vendorId && seedNames.has(x.item)) { x.template = true; changed = true }
      }
    })
    if (changed) scheduleDiffSync('budget', 'budget_items', budget)
  }

  // Wave 3: admin/checklist juga sudah pindah ke tabel sendiri — nested
  // (grup berisi array item), direkonstruksi di sini dari 4 tabel flat.
  async function _loadAdminAndChecklist(ownerId) {
    const [{ data: ag }, { data: ai }, { data: cg }, { data: ci }] = await Promise.all([
      supabase.from('admin_groups').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('admin_items').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('checklist_groups').select('*').eq('owner_user_id', ownerId).order('position'),
      supabase.from('checklist_items').select('*').eq('owner_user_id', ownerId).order('id'),
    ])
    admin.value     = (ag || []).map(g => ({ ...g, items: (ai || []).filter(it => it.group_id === g.id) }))
    checklist.value = (cg || []).map(g => ({ ...g, items: (ci || []).filter(it => it.group_id === g.id) }))
    _seedShadow('adminGroups', admin.value, ['items'])
    _seedShadow('adminItems', ai || [])
    _seedShadow('checklistGroups', checklist.value, ['items'])
    _seedShadow('checklistItems', ci || [])
  }

  function _applyData(data) {
    const s = data.settings || {}
    _applySettingsPayload(s)
    onboarded.value = onboarded.value || isPaid.value
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
      await Promise.all([
        _loadGuestsAndTimeline(pData.user_id),
        _loadBudgetVendorsSeserahanMahar(pData.user_id),
        _loadAdminAndChecklist(pData.user_id),
      ])
      return
    }

    // Coba load sebagai owner
    const { data } = await supabase.from('wedding_data').select('*').eq('user_id', userId).maybeSingle()

    if (data) {
      ownerUserId.value  = userId
      isPartner.value    = false
      partnerEmail.value = data.partner_email || ''
      _applyData(data)
      await Promise.all([
        _loadGuestsAndTimeline(userId),
        _loadBudgetVendorsSeserahanMahar(userId),
        _loadAdminAndChecklist(userId),
      ])
      if (!data.settings?.ownerEmail && user.value?.email) saveSettings()
      return
    }

    // Pengguna baru — isi data awal
    ownerUserId.value  = userId
    isPartner.value    = false
    partnerEmail.value = ''
    isNewUser.value    = true
    await supabase.from('wedding_data').insert({ user_id: userId, settings: {} })
    // guests & vendors & mahar: array kosong, tidak ada seed
    guests.value  = []; vendors.value = []; mahar.value = []
    _seedShadow('guests', []); _seedShadow('vendors', []); _seedShadow('mahar', [])

    // timeline: seed di-insert ke timeline_tasks, id lokal dibuang biar
    // server generate PK asli
    const timelineSeedRows = TIMELINE_SEED.map(({ id, ...rest }) => ({
      owner_user_id: userId,
      ...rest,
      deadline: rest.deadline || null,
      tanggalSelesai: rest.tanggalSelesai || null,
    }))
    const { data: insertedTimeline } = await supabase.from('timeline_tasks').insert(timelineSeedRows).select()
    timeline.value = insertedTimeline || []
    _seedShadow('timeline', timeline.value)

    // budget: seed dari BUDGET_SEED, id lokal dibuang, jatuhTempo '' → null
    const budgetSeedRows = BUDGET_SEED.map(({ id, ...rest }) => ({
      owner_user_id: userId,
      ...rest,
      jatuhTempo: rest.jatuhTempo || null,
      originType: 'template',
    }))
    const { data: insertedBudget } = await supabase.from('budget_items').insert(budgetSeedRows).select()
    budget.value = insertedBudget || []
    _seedShadow('budget', budget.value)

    // seserahan: SESERAHAN_SEED kosong hari ini, tapi tetap tulis jalurnya
    // biar siap kalau seed-nya diisi nanti — hindari insert() 0 baris.
    if (SESERAHAN_SEED.length) {
      const seserahanSeedRows = SESERAHAN_SEED.map(item => ({
        owner_user_id: userId, item: item.item, status: false, budget: 0, harga: 0, link: '',
      }))
      const { data: insertedSeserahan } = await supabase.from('seserahan_items').insert(seserahanSeedRows).select()
      seserahan.value = insertedSeserahan || []
    } else {
      seserahan.value = []
    }
    _seedShadow('seserahan', seserahan.value)

    // admin: grup dulu (dapat id asli), baru item — di-resolve via legacy_id
    // (BUKAN asumsi urutan array balik dari RETURNING sama dengan urutan
    // insert, Postgres nggak menjamin itu).
    const adminGroupRows = ADMIN_SEED.map(g => ({ owner_user_id: userId, legacy_id: g.id, grup: g.grup }))
    const { data: insertedAdminGroups } = await supabase.from('admin_groups').insert(adminGroupRows).select()
    const adminItemRows = []
    ;(insertedAdminGroups || []).forEach(ag => {
      const seedGroup = ADMIN_SEED.find(g => g.id === ag.legacy_id)
      ;(seedGroup?.items || []).forEach(it => {
        adminItemRows.push({ owner_user_id: userId, group_id: ag.id, syarat: it.syarat, status: !!it.status })
      })
    })
    const { data: insertedAdminItems } = adminItemRows.length
      ? await supabase.from('admin_items').insert(adminItemRows).select()
      : { data: [] }
    admin.value = (insertedAdminGroups || []).map(ag => ({
      ...ag, items: (insertedAdminItems || []).filter(it => it.group_id === ag.id),
    }))
    _seedShadow('adminGroups', admin.value, ['items'])
    _seedShadow('adminItems', insertedAdminItems || [])

    // checklist: pola sama, plus position dari urutan asli CHECKLIST_SEED.
    const checklistGroupRows = CHECKLIST_SEED.map((g, i) => ({
      owner_user_id: userId, legacy_id: g.id, fase: g.fase, position: i,
    }))
    const { data: insertedChecklistGroups } = await supabase.from('checklist_groups').insert(checklistGroupRows).select()
    const checklistItemRows = []
    ;(insertedChecklistGroups || []).forEach(cg => {
      const seedGroup = CHECKLIST_SEED.find(g => g.id === cg.legacy_id)
      ;(seedGroup?.items || []).forEach(it => {
        checklistItemRows.push({ owner_user_id: userId, group_id: cg.id, tugas: it.tugas, status: !!it.status })
      })
    })
    const { data: insertedChecklistItems } = checklistItemRows.length
      ? await supabase.from('checklist_items').insert(checklistItemRows).select()
      : { data: [] }
    checklist.value = (insertedChecklistGroups || [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(cg => ({ ...cg, items: (insertedChecklistItems || []).filter(it => it.group_id === cg.id) }))
    _seedShadow('checklistGroups', checklist.value, ['items'])
    _seedShadow('checklistItems', insertedChecklistItems || [])
  }

  // ── Supabase: realtime sync ────────────────────────────────────────
  let _channel = null

  // Wave 1: guests & timeline_tasks sync per-BARIS, bukan per-kolom.
  // Dibanding _lastWriteAt (per-kolom, blok SEMUA baris kolom itu 3 detik),
  // ini bandingin updated_at per baris — edit tamu A tidak lagi memblokir
  // update masuk buat tamu B/C, dan baris yang genuinely diedit bersamaan
  // dari 2 device tetap resolve secara deterministik (yang updated_at-nya
  // lebih baru menang), bukan silent whole-array clobber seperti dulu.
  // Kapan terakhir KITA nulis baris tertentu (per col, per row id).
  // updated_at echo SELALU lebih baru dari cache lokal (karena echo itu
  // ya snapshot hasil tulisan kita sendiri), jadi bandingin updated_at
  // doang nggak cukup buat nyaring echo dari tulisan sendiri — kalau
  // masih ngetik/klik lagi sebelum echo nyampe, echo itu bisa nimpa
  // balik ke kondisi lama. Ini versi per-baris dari _lastWriteAt (yang
  // masih dipakai kolom wedding_data lain yang belum dinormalisasi).
  const _lastRowWriteAt = {
    guests: new Map(), timeline: new Map(),
    budget: new Map(), vendors: new Map(), seserahan: new Map(), mahar: new Map(),
    adminGroups: new Map(), adminItems: new Map(),
    checklistGroups: new Map(), checklistItems: new Map(),
  }

  function _applyRowChange(col, arrRef, payload) {
    const { eventType, new: n, old: o } = payload
    const rid = eventType === 'DELETE' ? o.id : n.id
    if (Date.now() - (_lastRowWriteAt[col].get(rid) || 0) < REALTIME_ECHO_GRACE_MS) return
    if (eventType === 'DELETE') {
      arrRef.value = arrRef.value.filter(r => r.id !== o.id)
      _shadow[col].delete(o.id)
      return
    }
    const local = arrRef.value.find(r => r.id === n.id)
    if (local?.updated_at && n.updated_at && n.updated_at <= local.updated_at) return
    if (local) Object.assign(local, n)
    else arrRef.value.push(n)
    _shadow[col].set(n.id, JSON.parse(JSON.stringify(n)))
  }

  // Buffer event item yang nyampe SEBELUM grup induknya ada di array lokal.
  // Harusnya jarang terjadi (grup selalu di-insert & di-await duluan sebelum
  // item bisa dibuat), tapi murah buat dijamin daripada dianggep pasti aman.
  const _pendingItems = { adminItems: new Map(), checklistItems: new Map() }

  function _applyGroupChange(col, itemsCol, arrRef, payload) {
    const { eventType, new: n, old: o } = payload
    const rid = eventType === 'DELETE' ? o.id : n.id
    if (Date.now() - (_lastRowWriteAt[col].get(rid) || 0) < REALTIME_ECHO_GRACE_MS) return
    if (eventType === 'DELETE') {
      arrRef.value = arrRef.value.filter(g => g.id !== o.id)
      _shadow[col].delete(o.id)
      return
    }
    const local = arrRef.value.find(g => g.id === n.id)
    if (local?.updated_at && n.updated_at && n.updated_at <= local.updated_at) return
    if (local) {
      Object.assign(local, n)
    } else {
      // Baris admin_groups/checklist_groups dari realtime nggak pernah bawa
      // field "items" (itu murni konstruksi client) — wajib di-attach manual.
      n.items = []
      arrRef.value.push(n)
      // Flush item yang mungkin sudah nyampe lebih dulu nungguin grup ini.
      // Buffer ini cuma pernah diisi event INSERT/UPDATE (DELETE nggak
      // butuh nunggu grup — lihat _applyItemChange), jadi aman baca
      // itemPayload.new.group_id langsung tanpa cek eventType.
      const pending = _pendingItems[itemsCol]
      for (const [itemId, itemPayload] of [...pending.entries()]) {
        if (itemPayload.new.group_id === n.id) { pending.delete(itemId); _applyItemChange(itemsCol, arrRef, itemPayload) }
      }
    }
    const merged = local || n
    if (typeof merged.position === 'number') arrRef.value.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const { items, ...groupSnap } = merged
    _shadow[col].set(n.id, JSON.parse(JSON.stringify(groupSnap)))
  }

  function _applyItemChange(col, groupsArrRef, payload) {
    const { eventType, new: n, old: o } = payload
    const rid = eventType === 'DELETE' ? o.id : n.id
    if (Date.now() - (_lastRowWriteAt[col].get(rid) || 0) < REALTIME_ECHO_GRACE_MS) return
    if (eventType === 'DELETE') {
      // Payload DELETE dari Supabase Realtime kadang nggak menyertakan
      // group_id walau replica identity full sudah diset (cuma id yang
      // konsisten selalu ada) — makanya di sini nyari lewat isi semua grup
      // (cocokin id item), bukan gantungin ke o.group_id.
      for (const g of groupsArrRef.value) {
        const idx = g.items.findIndex(it => it.id === o.id)
        if (idx !== -1) { g.items.splice(idx, 1); break }
      }
      _shadow[col].delete(o.id)
      return
    }
    const group = groupsArrRef.value.find(g => g.id === n.group_id)
    if (!group) { _pendingItems[col].set(rid, payload); return }
    const local = group.items.find(it => it.id === n.id)
    if (local?.updated_at && n.updated_at && n.updated_at <= local.updated_at) return
    if (local) Object.assign(local, n)
    else group.items.push(n)
    _shadow[col].set(n.id, JSON.parse(JSON.stringify(n)))
  }

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
        // Semua 8 entity (guests/timeline/budget/vendors/seserahan/mahar/
        // admin/checklist) sudah pindah ke tabel sendiri (lihat binding di
        // bawah) — kolom wedding_data yang sama namanya sudah tidak dibaca
        // lagi di sini. Handler ini sekarang cuma urus kickout partner.
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'guests',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('guests', guests, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'timeline_tasks',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('timeline', timeline, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'budget_items',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('budget', budget, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'vendors',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('vendors', vendors, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'seserahan_items',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('seserahan', seserahan, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mahar_items',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('mahar', mahar, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'admin_groups',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyGroupChange('adminGroups', 'adminItems', admin, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'admin_items',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyItemChange('adminItems', admin, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'checklist_groups',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyGroupChange('checklistGroups', 'checklistItems', checklist, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'checklist_items',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyItemChange('checklistItems', checklist, p))
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
      await Promise.all([
        _loadGuestsAndTimeline(ownerUid),
        _loadBudgetVendorsSeserahanMahar(ownerUid),
        _loadAdminAndChecklist(ownerUid),
      ])
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

  // ── Pembayaran (iPaymu QRIS) ─────────────────────────────────────────
  // Bikin transaksi baru lewat edge function create-payment (yang pegang
  // API key iPaymu di server, tidak pernah kena expose ke client). Return
  // null kalau gagal (caller nampilin toast).
  async function createPayment() {
    const { data, error } = await supabase.functions.invoke('create-payment')
    if (error) {
      console.error('[createPayment] gagal:', error)
      toast('Gagal membuat transaksi pembayaran, coba lagi')
      return null
    }
    return data // { trxId, referenceId, amount, qrString, qrImage }
  }

  // Poll profiles.paid_at tiap beberapa detik selagi user nunggu di layar
  // QR — dipilih dibanding realtime channel baru karena ini transisi satu
  // kali yang jarang terjadi (bukan sync berkelanjutan), polling sederhana
  // sudah cukup andal & jauh lebih sedikit kode drpd nambah subscription.
  // Return true kalau berhasil kedeteksi lunas sebelum timeout.
  async function pollUntilPaid({ intervalMs = 3000, timeoutMs = 5 * 60000 } = {}) {
    const startedAt = Date.now()
    while (Date.now() - startedAt < timeoutMs) {
      await new Promise(r => setTimeout(r, intervalMs))
      if (!user.value) return false
      await loadProfile(user.value.id)
      if (isPaid.value) return true
    }
    return false
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
        // Bersihin shadow/echo-tracking biar nggak nyangkut kalau akun lain
        // login di tab yang sama setelahnya (shadow basi bisa bikin diff
        // engine salah klasifikasi insert/update di sesi berikutnya)
        Object.values(_shadow).forEach(m => m.clear())
        Object.values(_lastRowWriteAt).forEach(m => m.clear())
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
    hasAccess, trialExpired, trialDaysLeft, createPayment, pollUntilPaid,
    initAuth, signInWithGoogle, signOut,
    // partner
    ownerUserId, isPartner, partnerEmail, ownerEmail,
    sendPartnerInvite, cancelPartnerInvite, acceptPartnerInvite, removePartner, leavePartnership, revalidateMembership,
    // onboarding
    couple, onboarded, beginOnboarding, startOnboarding, completeOnboarding,
    showWelcomeGuide, dismissWelcomeGuide, tourSidebarOpen, tourSteps, startTour,
    // quick add / reminders
    quickAddTarget, quickAddNonce, requestQuickAdd,
    reminders, saveReminderSettings, markReminderNotified,
    // state
    guests, budget, vendors, seserahan, mahar, admin, checklist, timeline,
    activeTab, tabOrder, bFilter, vFilter, selectedMap,
    toastMsg, toastVisible,
    confirmShow, confirmTitle, confirmMessage, confirmOk, confirmCancel, confirmDanger,
    // computed
    confirmedGuests, selectedCount, selectedIds,
    totalGuestPax, venueCapacity, capacityOver,
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
    addTimelineTask, delTimeline, removeEmptyTimeline,
    // vendor
    addVendor, delVendor, setVendorStatus, vendorPayInfo,
    // seserahan
    addSeserahanItem, delSeserahan, removeEmptySeserahan,
    // mahar
    addMaharItem, delMahar, removeEmptyMahar,
    // admin
    delAdminGroup, addAdminGroup, addAdminItem,
    // checklist
    addChecklistGroup, addChecklistItem,
    // bulk
    applyBulk, bulkDelete,
    // io
    exportAll, importAll, exportTab, importTab,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWeddingStore, import.meta.hot))
}
