import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import { supabase } from '../lib/supabase'
import {
  BUDGET_SEED, ADMIN_SEED, CHECKLIST_SEED,
  VENDOR_CATEGORIES, WP_TABS,
} from '../data/constants'
import { downloadJSON, downloadCSV, dateStamp, toCSV, fmt } from '../utils/index'

export const useWeddingStore = defineStore('wedding', () => {
  // ── Auth state ──────────────────────────────────────────────────
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const isPaid  = computed(() => !!profile.value?.paid_at)

  // Nama akun yang lagi login (owner ATAU partner, siapapun yang aktif saat
  // ini) — dipakai buat auto-atribusi "siapa yang input" di Budget (dibayar
  // oleh) & Wedding Fund (dicatat oleh), berkat fitur edit bersama yang
  // udah tau identitas tiap sesi lewat Supabase auth.
  const currentUserName = computed(() => {
    const meta = user.value?.user_metadata || {}
    return meta.full_name || meta.name || user.value?.email?.split('@')[0] || ''
  })

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
  const paymentEnabled = computed(() => PAYMENT_ENABLED)
  // User yang masih punya akses tapi mau bayar duluan (dari kartu Status
  // Aplikasi di Profil). App.vue nampilin PaymentPage selama ini true;
  // PaymentPage sendiri kasih tombol kembali karena ini bukan penguncian.
  const forcePaywall = ref(false)
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
  // tanggalLamaran/tanggalAkad/tanggalResepsi nebeng di sini (bukan tabel
  // sendiri) karena sifatnya sama persis dengan `tanggal` Hari-H: satu
  // tanggal per pasangan. Diedit di tab Home, dibaca tab Timeline.
  const couple = ref({ pria: '', wanita: '', tanggal: '', jamMulai: '', jamSelesai: '', tanggalLamaran: '', tanggalAkad: '', tanggalResepsi: '' })
  const targetBudget = ref(0)   // target anggaran nikah — patokan tab Keuangan, diisi saat onboarding atau inline-edit
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
  const payments  = ref([])   // buku pembayaran per item budget (budget_payments)
  const fund      = ref([])   // transaksi Wedding Fund — uang masuk/keluar tabungan nikah (wedding_fund_transactions)
  const vendors   = ref([])
  const gifts     = ref([])   // Mahar & Seserahan gabungan (wedding_gifts, field "type")
  const admin     = ref([])
  const checklist = ref([])
  const timeline  = ref([])

  // Tab terakhir yang dibuka diingat di localStorage — refresh (sengaja
  // atau tidak) balikin user ke halaman yang sama, bukan dilempar ke Home.
  const VALID_TAB_IDS = new Set(WP_TABS.map(t => t.tab))
  let _savedTab = null
  try { _savedTab = localStorage.getItem('wp_activeTab') } catch (_) {}
  const activeTab  = ref(VALID_TAB_IDS.has(_savedTab) ? _savedTab : 'home')
  watch(activeTab, t => { try { localStorage.setItem('wp_activeTab', t) } catch (_) {} })

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
  // diputuskan lain) — cuma "tidak" dan "hampers" yang dikeluarkan dari
  // hitungan fisik (kursi/katering/kapasitas venue).
  const confirmedGuests = computed(() => guests.value.filter(g => {
    const k = g.kehadiran || 'belum'
    return k !== 'tidak' && k !== 'hampers'
  }))
  // Jumlah ORANG (bukan baris undangan) yang dikirimi hampers — dipakai
  // buat vendor yang jasanya "kirim hampers", dikalikan otomatis di tipe
  // harga Per Pax. Single source of truth Tab Tamu buat opsi "Kirim
  // Hampers" di dropdown "Dikali" Vendor.
  const hampersCount = computed(() => guests.value.filter(g => g.kehadiran === 'hampers').reduce((s, g) => s + (g.jumlah || 0), 0))
  // Jumlah ORANG dengan status Kehadiran "Hadir" (bukan "belum"+"hadir"
  // kayak confirmedGuests/totalGuestPax — ini murni yang statusnya udah
  // eksplisit "Hadir"). Single source of truth buat opsi "Tamu
  // dikonfirmasi" di dropdown "Dikali" Vendor.
  const hadirOrangCount = computed(() => guests.value.filter(g => g.kehadiran === 'hadir').reduce((s, g) => s + (g.jumlah || 0), 0))
  // Jumlah UNDANGAN (baris tamu, bukan orang) yang statusnya SUDAH di-RSVP
  // — kehadiran-nya bukan lagi "belum" (jadi "hadir"/"tidak"/"hampers"
  // semua terhitung "sudah merespons"). Single source of truth buat opsi
  // "Undangan dikonfirmasi" di dropdown "Dikali" Vendor.
  const rsvpUndanganCount = computed(() => guests.value.filter(g => (g.kehadiran || 'belum') !== 'belum').length)
  const selectedCount   = computed(() => Object.keys(selectedMap).length)
  const selectedIds     = computed(() => Object.keys(selectedMap).map(k => isNaN(k) ? k : Number(k)))

  // ── Vendor Per Pax — resolusi live dari Tab Tamu (Single Source of
  // Truth). Vendor TIDAK menyimpan/menghitung ulang total tamu sendiri:
  // `vendorPaxMultiplier` cuma baca computed guest-count di atas (atau
  // paxManualVal buat opsi "Jumlah Custom", yang memang sengaja lepas
  // dari Tab Tamu). `vendorEffectiveHarga` itu yang dipakai tiap kali
  // butuh "harga vendor ini sekarang berapa" — buat tipe "pax" hasilnya
  // SELALU dihitung ulang live (hargaPax × multiplier terbaru), BUKAN
  // baca field v.harga yang bisa basi; tipe harga lain (all-in/paket/dst)
  // tetap pakai v.harga apa adanya karena itu memang bukan turunan tamu. ──
  function vendorPaxMultiplier(v) {
    if (v.paxPengali === 'orang') return hadirOrangCount.value
    if (v.paxPengali === 'undangan') return rsvpUndanganCount.value
    if (v.paxPengali === 'hampers') return hampersCount.value
    return v.paxManualVal || 1
  }
  // Biaya tambahan (mis. transport, surcharge weekend) itu biaya NYATA yang
  // harus ikut kehitung — dulu cuma ditampilkan di detail vendor tapi nggak
  // pernah dijumlahkan, jadi total Vendor & baris Budget-nya kekecilan.
  // Bukan turunan jumlah tamu, jadi ditambahkan setelah perkalian pax.
  function vendorBiayaTambahan(v) {
    return (v.biayaTambahan || []).reduce((s, b) => s + (parseInt(b?.nominal) || 0), 0)
  }
  function vendorEffectiveHarga(v) {
    const dasar = v.tipeHarga !== 'pax'
      ? (v.harga || 0)
      : (v.hargaPax || 0) * vendorPaxMultiplier(v)
    return dasar + vendorBiayaTambahan(v)
  }

  // ── Kapasitas venue ──────────────────────────────────────────────
  // Total tamu terkonfirmasi (satuan orang) vs kapasitas venue yang
  // DIPAKAI. Kapasitas nempel di record vendor (rumah datanya di situ) —
  // sini cuma baca. Kalau ada >1 venue dipakai (mis. akad + resepsi),
  // ambil yang paling besar (asумsi itu acara utama/resepsi).
  // Pakai kapasitasMaks (field baru kategori Venue: Kapasitas Min-Maks),
  // bukan kapasitas lama (single value) yang udah nggak dipakai form-nya.
  const totalGuestPax = computed(() => confirmedGuests.value.reduce((s, g) => s + (g.jumlah || 0), 0))
  const venueCapacity = computed(() => {
    const caps = vendors.value
      .filter(v => v.category === 'venue' && v.jadi && v.kapasitasMaks > 0)
      .map(v => v.kapasitasMaks)
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

  // Tulisan yang masih nunggu debounce (belum kekirim ke server). Dipakai
  // refetchAll() buat NGEBURU tulisan itu duluan sebelum muat ulang —
  // tanpa ini, data server yang baru bakal nimpa editan yang belum sempat
  // tersimpan. Key-nya sama dengan key _timers.
  const _pendingFlush = {}

  function _schedule(key, fn, delay = 600) {
    clearTimeout(_timers[key])
    _pendingFlush[key] = fn
    _timers[key] = setTimeout(() => {
      delete _pendingFlush[key]
      fn()
    }, delay)
  }

  // Batalkan tulisan terjadwal DAN antreannya. Dipakai kalau pemanggilnya
  // mau nulis langsung (awaited) — kalau cuma clearTimeout, antrean flush
  // masih nyimpen callback basi yang bisa kekirim ulang nanti.
  function _cancelScheduled(key) {
    clearTimeout(_timers[key])
    delete _pendingFlush[key]
  }

  // Jalankan semua tulisan yang masih ngantre SEKARANG, jangan tunggu
  // debounce-nya habis. Dipanggil sebelum refetchAll().
  async function flushPendingSaves() {
    const keys = Object.keys(_pendingFlush)
    if (!keys.length) return
    await Promise.all(keys.map(k => {
      clearTimeout(_timers[k])
      const fn = _pendingFlush[k]
      delete _pendingFlush[k]
      return fn()
    }))
  }

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
    _schedule(col, () => _upsert({ [col]: val }))
  }

  // ── Tabel ternormalisasi (Wave 1: guests, timeline) ─────────────────
  // Snapshot terakhir yang sudah sinkron ke server, per kolom, key = row id.
  // Dipakai _diffAndSync buat tahu baris mana yang baru/berubah/terhapus,
  // tanpa perlu mengubah cara komponen memanggil saveG()/saveTL() (tetap
  // "mutasi array lalu panggil saveX() tanpa argumen" seperti sebelumnya).
  const _shadow = {
    guests: new Map(), timeline: new Map(),
    budget: new Map(), payments: new Map(), fund: new Map(), vendors: new Map(), gifts: new Map(),
    adminGroups: new Map(), adminItems: new Map(),
    checklistGroups: new Map(), checklistItems: new Map(),
  }

  // Terjemahin error Supabase jadi kalimat yang menjelaskan APA yang salah.
  // Dulu semua kegagalan cuma jadi "Gagal ..., coba lagi" — padahal
  // penyebabnya sering bukan hal yang bisa diperbaiki dengan mengulang
  // (mis. kolom belum ada di DB, offline, sesi kedaluwarsa). Pesan yang
  // spesifik bikin masalahnya kelihatan tanpa harus buka console.
  function _errMsg(error, aksi = 'menyimpan data') {
    if (!error) return `Gagal ${aksi}, coba lagi`
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return `Gagal ${aksi} — kamu sedang offline. Perubahan belum tersimpan.`
    }
    const code = error.code || ''
    const msg  = error.message || ''
    // PGRST204: kolom yang dikirim nggak ada di tabel (skema belum di-migrasi)
    if (code === 'PGRST204' || /column .* does not exist|schema cache/i.test(msg)) {
      const kolom = msg.match(/'([^']+)' column/)?.[1]
      return `Gagal ${aksi} — kolom${kolom ? ` "${kolom}"` : ''} belum ada di database. Ini bug aplikasi, bukan salah kamu.`
    }
    if (code === '23505') return `Gagal ${aksi} — data serupa sudah ada.`
    if (code === '23503') return `Gagal ${aksi} — data terkait sudah dihapus. Muat ulang halaman.`
    if (code === '42501' || code === 'PGRST301' || /jwt|permission/i.test(msg)) {
      return `Gagal ${aksi} — sesi kamu kedaluwarsa. Muat ulang halaman lalu coba lagi.`
    }
    if (/fetch|network/i.test(msg)) return `Gagal ${aksi} — koneksi bermasalah. Cek internet kamu.`
    return `Gagal ${aksi}: ${msg || 'penyebab tidak diketahui'}`
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

    // PENTING: cuma baris tanpa id (`id == null`) yang boleh dianggap baru.
    // id selalu di-generate server (identity column) — kalau row.id UDAH
    // ADA, baris itu pasti udah eksis di DB, titik, apapun kondisi shadow-
    // nya. Dulu di sini "id ada tapi belum ada di shadow" ikut dianggap
    // toInsert — itu tepat bug-nya: shadow bisa "lupa" (mis. ke-reset pas
    // HMR dev server reload reactive state tapi nggak reload closure lokal
    // ini), dan begitu shadow kosong, SEMUA baris lama keinsert ulang jadi
    // dobel sekaligus (kejadian nyata: 13 budget_items dobel 2026-07-29).
    // Row ber-id yang belum ada di shadow sekarang dikirim sebagai UPDATE
    // (idempotent, aman) — bukan INSERT.
    for (const row of rows) {
      if (row.id == null) { toInsert.push(row); continue }
      seen.add(row.id)
      if (!shadow.has(row.id) || JSON.stringify(shadow.get(row.id)) !== JSON.stringify(_stripKeys(row))) toUpdate.push(row)
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

    // Kegagalan sync dulu cuma masuk console — user merasa datanya
    // tersimpan padahal nggak. Sekarang error pertama dikumpulkan lalu
    // ditoast SEKALI per batch (bukan per baris, biar nggak spam).
    let firstError = null

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
          firstError ||= error
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
        else {
          console.error(`[_diffAndSync] update ${table} gagal:`, error)
          firstError ||= error
        }
      }),
      ...toDeleteIds.map(async id => {
        _lastRowWriteAt[col]?.set(id, Date.now())
        const { error } = await supabase.from(table).delete().eq('id', id).eq('owner_user_id', uid)
        if (!error) shadow.delete(id)
        else {
          console.error(`[_diffAndSync] delete ${table} gagal:`, error)
          firstError ||= error
        }
      }),
    ])

    if (firstError) toast(_errMsg(firstError, 'menyimpan perubahan'))
  }

  function scheduleDiffSync(col, table, rowsRef) {
    if (!user.value) return
    // Sinyal dini buat developer: kalau ini kepanggil pas `loading` true,
    // shadow entity ini kemungkinan lagi di-reseed bersamaan (lihat
    // loadData/_load*) — race-nya bisa bikin data lama ke-insert ulang jadi
    // dobel. Cuma warning, nggak ngeblok, biar nggak nyembunyiin bug lain.
    if (loading.value) console.warn(`[sync] scheduleDiffSync('${col}') dipanggil pas loading=true — cek race dengan reload data`)
    _schedule(col, () => _diffAndSync(col, table, rowsRef.value))
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
    _schedule(timerKey, () => _diffAndSyncNested(groupsCol, groupsTable, itemsCol, itemsTable, groupsRef.value))
  }

  // ── Save functions ─────────────────────────────────────────────────
  const saveG  = () => scheduleDiffSync('guests',   'guests',        guests)
  const saveB  = () => scheduleDiffSync('budget',   'budget_items',  budget)
  const saveP  = () => scheduleDiffSync('payments', 'budget_payments', payments)
  const saveF  = () => scheduleDiffSync('fund',     'wedding_fund_transactions', fund)
  const saveV  = () => scheduleDiffSync('vendors',  'vendors',       vendors)
  const saveA  = () => scheduleDiffSyncNested('admin',     'adminGroups',     'admin_groups',     'adminItems',     'admin_items',     admin)
  const saveCK = () => scheduleDiffSyncNested('checklist', 'checklistGroups', 'checklist_groups', 'checklistItems', 'checklist_items', checklist)
  const saveTL = () => scheduleDiffSync('timeline', 'timeline_tasks', timeline)

  function saveGifts() {
    syncGiftsToBudget()
    scheduleDiffSync('gifts',  'wedding_gifts', gifts)
    scheduleDiffSync('budget', 'budget_items',  budget)
  }

  function _settingsPayload() {
    return {
      tabOrder: tabOrder.value,
      bFilter: bFilter.value,
      vFilter: vFilter.value,
      couple: couple.value,
      targetBudget: targetBudget.value,
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
    if (typeof settings.targetBudget === 'number') targetBudget.value = settings.targetBudget
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
      ...couple.value,
      pria: (data.pria || '').trim(),
      wanita: (data.wanita || '').trim(),
      tanggal: data.tanggal || '',
      jamMulai: data.jamMulai || '',
      jamSelesai: data.jamSelesai || '',
    }
    targetBudget.value = data.targetBudget || 0
    // Kumpulkan semua perubahan ke satu payload biar tersimpan dalam
    // sekali tulis (bukan debounce yang bisa hilang kalau user refresh cepat).
    const payload = {}
    // Pembersihan template yang tidak dipilih HANYA untuk user baru,
    // biar data user lama tidak terhapus kalau melewati onboarding.
    // budget/timeline sudah pindah ke tabel sendiri — dibersihkan lewat
    // _diffAndSync langsung (di bawah), bukan lagi lewat payload wedding_data.
    let clearedBudget = false
    let clearedAdmin = false, clearedChecklist = false
    if (isNewUser.value) {
      const t = data.templates || {}
      if (!t.budget)    { budget.value = [];    clearedBudget = true }
      if (!t.admin)     { admin.value = [];     clearedAdmin = true }
      if (!t.checklist) { checklist.value = []; clearedChecklist = true }
    }
    onboarded.value = true
    beginOnboarding.value = false
    activeTab.value = 'home'
    // Simpan LANGSUNG (awaited), bukan lewat debounce, supaya flag onboarded
    // + profil pasangan pasti sudah masuk DB sebelum user sempat refresh.
    if (isNewUser.value) showWelcomeGuide.value = true
    _cancelScheduled('settings')
    payload.settings = _settingsPayload()
    await Promise.all([
      _upsert(payload),
      clearedBudget    ? _diffAndSync('budget', 'budget_items', budget.value)           : Promise.resolve(),
      clearedAdmin     ? _diffAndSyncNested('adminGroups', 'admin_groups', 'adminItems', 'admin_items', admin.value) : Promise.resolve(),
      clearedChecklist ? _diffAndSyncNested('checklistGroups', 'checklist_groups', 'checklistItems', 'checklist_items', checklist.value) : Promise.resolve(),
      (isNewUser.value && (data.danaAwal || 0) > 0) ? _seedInitialFundTx(data.danaAwal) : Promise.resolve(),
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

  // Selisih = Estimasi - Aktual. Positif = hemat dari rencana, negatif =
  // lebih dari rencana. Cuma berarti kalau estimasi DAN aktual dua-duanya
  // udah diisi (>0) — kalau aktual masih 0, "selisih" itu bukan hemat,
  // itu cuma estimasi yang belum direalisasi. Caller wajib cek keduanya
  // sebelum nampilin badge ini (lihat bDisplayPrice).
  const bSelisih = b => (b.estimasi || 0) - (b.aktual || 0)

  // Angka harga yang ditampilin di UI: Aktual kalau udah diisi (harga
  // nyata menang), fallback ke Estimasi kalau Aktual masih 0 (biar
  // perencanaan sebelum ada harga pasti tetap kelihatan, bukan "Belum
  // Diisi" doang). null kalau dua-duanya kosong.
  function bDisplayPrice(b) {
    if ((b.aktual || 0) > 0) return { value: b.aktual, kind: 'aktual', label: 'harga aktual' }
    if ((b.estimasi || 0) > 0) return { value: b.estimasi, kind: 'estimasi', label: 'estimasi' }
    return null
  }

  // Total selisih yang BENERAN sebanding — cuma dijumlah dari item yang
  // punya estimasi (bukan bandingin total-aktual vs total-estimasi mentah,
  // karena item tanpa estimasi bakal ikut nyumbang ke total aktual tapi
  // nggak ke total estimasi, jadi kelihatan "over budget" padahal cuma
  // belum pernah di-planning). Dipakai bareng di BudgetTab & HomeTab biar
  // nggak nyimpang lagi kalau salah satu diedit sendiri-sendiri.
  const budgetEstimasiSetCount = computed(() => budget.value.filter(b => (b.estimasi || 0) > 0).length)
  const budgetSelisihTotal = computed(() =>
    budget.value.reduce((s, b) => s + (b.estimasi ? bSelisih(b) : 0), 0)
  )

  // ── Buku pembayaran (budget_payments) ──────────────────────────────
  // Entri pembayaran per item budget. paid=false -> rencana termin (belum
  // dibayar), paid=true -> riwayat nyata. b.dibayar itu cache turunan:
  // jumlah amount entri yang paid. Komponen lama tetap baca b.dibayar,
  // jadi status/sisa/laporan nggak perlu diubah.
  const itemPayments = itemId =>
    payments.value.filter(p => p.budgetItemId === itemId)
      .sort((a, b) => (a.dueDate || a.paidDate || '').localeCompare(b.dueDate || b.paidDate || ''))

  const paidTotal = itemId =>
    payments.value.reduce((s, p) => s + (p.budgetItemId === itemId && p.paid ? (p.amount || 0) : 0), 0)

  // Tanggal jatuh tempo termin belum-lunas paling awal buat satu item.
  // null kalau nggak ada termin belum-bayar yang punya tanggal.
  function nextDue(itemId) {
    const dues = payments.value
      .filter(p => p.budgetItemId === itemId && !p.paid && p.dueDate)
      .map(p => p.dueDate)
      .sort()
    return dues[0] || null
  }

  // Sinkron ulang cache turunan b.dibayar & b.jatuhTempo dari entri
  // pembayaran, lalu jadwalkan saveB kalau ada yang berubah. b.jatuhTempo
  // dijaga = termin belum-lunas terdekat supaya semua konsumen lama
  // (reminder, agenda, home, timeline, kartu vendor) tetap jalan tanpa
  // diubah. Dipanggil tiap entri pembayaran berubah.
  function recalcDibayar(itemId) {
    const b = budget.value.find(x => x.id === itemId)
    if (!b) return
    const total = paidTotal(itemId)
    const due   = nextDue(itemId)
    let changed = false
    if (b.dibayar !== total) { b.dibayar = total; changed = true }
    if ((b.jatuhTempo || null) !== due) { b.jatuhTempo = due; changed = true }
    if (changed) saveB()
  }

  // Update cache b.dibayar & b.jatuhTempo semua item dari entri pembayaran.
  // Return true kalau ada yang berubah. Tidak menyentuh server (silent).
  function _recomputeDibayarLocal() {
    let changed = false
    budget.value.forEach(b => {
      const total = paidTotal(b.id)
      const due   = nextDue(b.id)
      if (b.dibayar !== total) { b.dibayar = total; changed = true }
      if ((b.jatuhTempo || null) !== due) { b.jatuhTempo = due; changed = true }
    })
    return changed
  }

  // Versi yang mem-persist koreksi ke server (dipakai saat load).
  function _reconcileAllDibayar() {
    if (_recomputeDibayarLocal()) saveB()
  }

  // Tambah entri pembayaran. Default: rencana termin belum dibayar.
  // recalcDibayar dipanggil tanpa syarat — perubahan tanggal termin belum-
  // bayar pun mempengaruhi cache jatuhTempo, jadi harus selalu disinkron.
  function addPayment(itemId, { amount = 0, dueDate = null, paid = false, paidDate = null, paidBy = '', note = '', remarks = '' } = {}) {
    const uid = ownerUserId.value || user.value?.id
    const row = { owner_user_id: uid, budgetItemId: itemId, amount, dueDate, paid, paidDate, paidBy, note, remarks }
    payments.value.push(row)
    saveP()
    recalcDibayar(itemId)
    return row
  }

  function updatePayment(payId, patch) {
    const p = payments.value.find(x => x.id === payId)
    if (!p) return
    Object.assign(p, patch)
    saveP()
    recalcDibayar(p.budgetItemId)
  }

  function delPayment(payId) {
    const p = payments.value.find(x => x.id === payId)
    if (!p) return
    const itemId = p.budgetItemId
    payments.value = payments.value.filter(x => x.id !== payId)
    saveP()
    recalcDibayar(itemId)
    _forgetFundTxForPayment(payId)
  }

  // Quick-pay dari shortcut (agenda/tombol "Tandai Bayar" tanpa pilih termin):
  // lunasi termin belum-bayar terdekat, atau kalau belum ada termin sama
  // sekali, buat satu entri lunas sebesar sisa.
  function payNextDue(itemId) {
    const today = new Date().toISOString().slice(0, 10)
    const open = payments.value
      .filter(p => p.budgetItemId === itemId && !p.paid)
      .sort((x, y) => (x.dueDate || '9999-12-31').localeCompare(y.dueDate || '9999-12-31'))
    if (open.length) { togglePaymentPaid(open[0].id, true); return }
    const b = budget.value.find(x => x.id === itemId)
    const sisa = b ? bSisa(b) : 0
    if (sisa > 0) addPayment(itemId, { amount: sisa, paid: true, paidDate: today, note: 'Pelunasan' })
  }

  // Toggle lunas/belum satu entri. Saat ditandai lunas & belum ada tanggal
  // bayar, isi hari ini biar muncul benar di laporan arus kas.
  function togglePaymentPaid(payId, isPaid) {
    const p = payments.value.find(x => x.id === payId)
    if (!p) return
    p.paid = isPaid
    if (isPaid && !p.paidDate) p.paidDate = new Date().toISOString().slice(0, 10)
    saveP()
    recalcDibayar(p.budgetItemId)
    // Batal-lunasin termin yang tadinya dicatat lewat Wedding Fund — saldo
    // harus balik, bukan nyangkut nganggep uangnya udah keluar padahal
    // pembayarannya sendiri baru saja dibatalkan.
    if (!isPaid) _forgetFundTxForPayment(payId)
  }

  // ── Wedding Fund (wedding_fund_transactions) ────────────────────────
  // Buku kas tabungan nikah — TERPISAH dari Budget (yang cuma daftar
  // pengeluaran). Saldo = total masuk - total keluar, dihitung live dari
  // baris transaksi, bukan disimpan sebagai angka kolom sendiri.
  const fundMasuk = computed(() => fund.value.reduce((s, t) => s + (t.jenis === 'masuk' ? (t.nominal || 0) : 0), 0))
  const fundKeluar = computed(() => fund.value.reduce((s, t) => s + (t.jenis === 'keluar' ? (t.nominal || 0) : 0), 0))
  const fundSaldo = computed(() => fundMasuk.value - fundKeluar.value)

  // Transaksi yang ke-link ke satu termin Budget tertentu (kalau ada) —
  // dipakai buat badge "sudah dicatat di Wedding Fund" & cegah re-prompt.
  const fundTxForPayment = payId => fund.value.find(t => t.budgetPaymentId === payId) || null

  async function addFundTx(data) {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('wedding_fund_transactions')
      .insert({
        owner_user_id: uid,
        tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
        jenis: data.jenis || 'masuk',
        kategori: data.kategori || '',
        nominal: data.nominal || 0,
        catatan: data.catatan || '',
        dicatatOleh: data.dicatatOleh ?? currentUserName.value,
        budgetItemId: data.budgetItemId ?? null,
        budgetPaymentId: data.budgetPaymentId ?? null,
      })
      .select().single()
    if (error || !row) { toast('Gagal menambah transaksi, coba lagi'); return null }
    fund.value.push(row)
    _shadow.fund.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
  }

  function updateFundTx(id, patch) {
    const t = fund.value.find(x => x.id === id)
    if (!t) return
    Object.assign(t, patch)
    saveF()
  }

  async function delFundTx(id) {
    const t = fund.value.find(x => x.id === id)
    if (!t) return
    const ok = await askConfirm({
      title: 'Hapus transaksi?',
      message: `Transaksi "${t.catatan || t.kategori || (t.jenis === 'masuk' ? 'Uang Masuk' : 'Uang Keluar')}" akan dihapus.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    fund.value = fund.value.filter(x => x.id !== id)
    saveF()
    toast('Transaksi dihapus')
  }

  // Dipanggil waktu termin Budget yang tadinya "diambil dari Wedding Fund"
  // dibatalkan (uncheck lunas) atau dihapus — transaksi terkait ikut hilang
  // supaya saldo Wedding Fund tidak nyangkut salah.
  function _forgetFundTxForPayment(payId) {
    const idx = fund.value.findIndex(t => t.budgetPaymentId === payId)
    if (idx === -1) return
    fund.value.splice(idx, 1)
    saveF()
  }

  // Baris "Saldo awal" saat onboarding, kalau user isi Dana Nikah Saat Ini.
  async function _seedInitialFundTx(nominal) {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('wedding_fund_transactions')
      .insert({ owner_user_id: uid, tanggal: new Date().toISOString().slice(0, 10), jenis: 'masuk', kategori: 'Tabungan', nominal, catatan: 'Saldo awal', dicatatOleh: currentUserName.value })
      .select().single()
    if (error || !row) return
    fund.value.push(row)
    _shadow.fund.set(row.id, JSON.parse(JSON.stringify(row)))
  }

  // "originType" gantiin skema lama yang overload kolom id jadi sentinel
  // string — id sekarang selalu numerik asli dari server, jadi asal baris
  // ditandai eksplisit di kolom ini.
  function budgetOrigin(b) {
    if (b.vendorId) return { label: 'Vendor', cls: 'bo-vendor', managed: true, tip: 'Otomatis dari vendor yang Dipakai', tipDel: "Ditambahkan dari tab Vendor — untuk menghapus, matikan 'Dipakai' di tab Vendor" }
    if (b.weddingGiftId) {
      const g = gifts.value.find(x => x.id === b.weddingGiftId)
      const label = g?.type === 'seserahan' ? 'Seserahan' : 'Mahar'
      return { label, cls: 'bo-gift', managed: true, tip: `Otomatis dari tab ${label} & Seserahan`, tipDel: `Ditambahkan dari tab Mahar & Seserahan — matikan 'Masukkan ke Budget' di sana untuk menghapus` }
    }
    if (b.template || b.originType === 'template') return { label: 'Template', cls: 'bo-tpl', managed: false, tip: 'Contoh bawaan — boleh diedit atau dihapus' }
    return null
  }

  // ── Sync Mahar & Seserahan → budget (save dihandle caller) ──────────
  // Per-item, mirror handleVendorDecision: tiap gift yang includeInBudget
  // dapat/update 1 baris budget_items sendiri (weddingGiftId), bukan lagi
  // 1 baris agregat buat semua item kayak skema lama.
  function syncGiftsToBudget() {
    gifts.value.forEach(g => {
      const idx = budget.value.findIndex(b => b.weddingGiftId === g.id)
      if (g.includeInBudget) {
        const label = g.type === 'seserahan' ? 'Seserahan' : 'Mahar'
        const itemName = `${label} - ${g.item || 'Tanpa nama'}`
        if (idx > -1) {
          budget.value[idx].item     = itemName
          budget.value[idx].estimasi = g.hargaEstimasi
          budget.value[idx].aktual   = g.hargaAktual
        } else {
          budget.value.push({ weddingGiftId: g.id, originType: 'wedding_gift', item: itemName, estimasi: g.hargaEstimasi, aktual: g.hargaAktual, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: '' })
        }
      } else if (idx > -1) {
        const removedId = budget.value[idx].id
        budget.value.splice(idx, 1)
        if (removedId != null) _forgetPaymentsLocal(removedId)
      }
    })
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

  // ── Included Vendor: kategori/vendor yang udah "included" lewat paket
  // vendor lain (mis. Venue yang include Catering+WO+Dekorasi) ─────────
  // Cuma vendor yang beneran "jadi" (dipakai) yang bisa nge-cover kategori
  // lain — kandidat yang masih dipertimbangkan/belum diputuskan nggak
  // dihitung, biar konsisten sama Budget (nggak ada yang "keitung" duluan
  // sebelum user beneran milih paketnya).
  function categoryIncludedBy(catId) {
    return vendors.value.find(v => v.jadi && (v.includedVendors || []).some(inc => inc.category === catId)) || null
  }
  function vendorIncludedByOther(vendorId) {
    for (const v of vendors.value) {
      if (!v.jadi) continue
      if ((v.includedVendors || []).some(inc => inc.vendorId === vendorId)) return v
    }
    return null
  }

  // ── Vendor ↔ Budget ────────────────────────────────────────────────
  function handleVendorDecision(vendor, isJadi) {
    const existingIdx = budget.value.findIndex(b => b.vendorId === vendor.id)
    if (isJadi) {
      const cat = VENDOR_CATEGORIES.find(c => c.id === vendor.category)
      const catLabel = cat ? cat.label : vendor.category
      // namaPaket cuma keisi buat vendor Dekorasi (1 record = 1 vendor +
      // 1 paket) — disertakan biar baris Budget nggak ambigu kalau vendor
      // yang sama diinput ulang buat paket lain.
      const itemName = vendor.namaPaket ? `${catLabel} - ${vendor.nama} (${vendor.namaPaket})` : `${catLabel} - ${vendor.nama}`
      // Tipe harga "pax" dihitung live dari Tab Tamu (Single Source of
      // Truth) lewat vendorEffectiveHarga — bukan baca vendor.harga apa
      // adanya, yang bisa basi kalau jumlah tamu berubah sejak vendor ini
      // terakhir disimpan.
      const hargaTerkini = vendorEffectiveHarga(vendor)
      if (existingIdx > -1) {
        // Estimasi sengaja TIDAK ditimpa di sini — itu patokan rencana
        // yang berdiri sendiri. Cuma aktual yang ngikutin harga vendor
        // terbaru, biar badge selisih (estimasi vs aktual) tetap berarti.
        // Nama item terus disinkronkan, tapi catatan tidak: catatan vendor
        // hidup di Vendor, sedangkan catatan Budget milik item anggaran.
        budget.value[existingIdx].item     = itemName
        budget.value[existingIdx].aktual   = hargaTerkini
      } else {
        budget.value.push({ vendorId: vendor.id, originType: 'vendor', item: itemName, estimasi: hargaTerkini, aktual: hargaTerkini, uangMuka: 0, dibayar: 0, jatuhTempo: null, remarks: '' })
      }
    } else {
      if (existingIdx > -1) {
        const removedId = budget.value[existingIdx].id
        budget.value.splice(existingIdx, 1)
        if (removedId != null) _forgetPaymentsLocal(removedId)
      }
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

  // Buang entri pembayaran lokal item yang dihapus. Server sudah cascade
  // (FK on delete cascade), ini cuma biar state lokal & shadow ikut bersih.
  function _forgetPaymentsLocal(itemId) {
    if (!payments.value.some(p => p.budgetItemId === itemId)) return
    payments.value = payments.value.filter(p => p.budgetItemId !== itemId)
    saveP()
  }

  async function delBudget(id) {
    const b = budget.value.find(x => x.id === id)
    if (!b) return false
    if (b.weddingGiftId) {
      const g = gifts.value.find(x => x.id === b.weddingGiftId)
      const label = g?.type === 'seserahan' ? 'Seserahan' : 'Mahar'
      const ok = await askConfirm({
        title: 'Hapus item Budget ini?',
        message: `"${b.item}" berasal dari tab Mahar & Seserahan (${label}). Menghapus dari Budget akan mematikan "Masukkan ke Budget" pada item itu.`,
        confirmLabel: 'Hapus',
      })
      if (!ok) return false
      if (g) { g.includeInBudget = false; saveGifts() }
      budget.value = budget.value.filter(x => x.id !== id)
      _forgetPaymentsLocal(id)
      saveB(); toast('Item dihapus & link Budget dimatikan')
      return true
    }
    if (b.vendorId) {
      const ok = await askConfirm({
        title: 'Hapus item vendor?',
        message: `"${b.item}" berasal dari vendor yang Dipakai. Menghapus dari Budget akan menonaktifkan "Dipakai" pada vendor itu.`,
        confirmLabel: 'Hapus',
      })
      if (!ok) return false
      const v = vendors.value.find(x => x.id === b.vendorId)
      // status di-reset ke 'batal' (bukan cuma jadi=false) — statusOf()
      // baca v.status duluan kalau ada isinya, jadi kalau cuma jadi yang
      // ditimpa, toggle status di tab Vendor bakal nyangkut di "Dipakai".
      if (v) { v.jadi = false; v.status = 'batal'; saveV() }
      budget.value = budget.value.filter(x => x.id !== id)
      _forgetPaymentsLocal(id)
      saveB(); toast('Item dihapus & vendor dinonaktifkan')
      return true
    }
    const ok = await askConfirm({
      title: 'Hapus item?',
      message: `"${b.item || 'tanpa nama'}" akan dihapus dari anggaran.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return false
    budget.value = budget.value.filter(x => x.id !== id)
    _forgetPaymentsLocal(id)
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

  async function duplicateGuest(id) {
    const g = guests.value.find(x => x.id === id)
    if (!g) return
    // PK di tabel guests di-generate server (sama seperti saveGuest untuk
    // tamu baru) — insert dulu & tunggu id aslinya balik, JANGAN minting id
    // lokal (Math.max+1 lama sempat dipakai di sini, tapi itu bikin baris
    // sempat punya id palsu sebelum ditimpa id asli — key Vue berubah
    // mendadak begitu id asli datang, bikin barisnya "berkedip"/remount).
    const { id: _oldId, created_at, updated_at, owner_user_id, ...rest } = g
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('guests')
      .insert({ owner_user_id: uid, ...rest, nama: g.nama + ' (salin)' }).select().single()
    if (error || !row) { toast('Gagal menduplikasi tamu, coba lagi'); return }
    const idx = guests.value.findIndex(x => x.id === id)
    guests.value.splice(idx + 1, 0, row)
    _shadow.guests.set(row.id, JSON.parse(JSON.stringify(row)))
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
    if (error || !row) {
      console.error('[addVendor] insert vendors gagal:', error)
      toast(_errMsg(error, 'menambah vendor'))
      return null
    }
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

  async function addGift(type) {
    const uid = ownerUserId.value || user.value.id
    const { data: row, error } = await supabase.from('wedding_gifts')
      .insert({ owner_user_id: uid, type })
      .select().single()
    if (error || !row) { toast('Gagal menambah item, coba lagi'); return null }
    gifts.value.push(row)
    _shadow.gifts.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
  }

  function removeEmptyGift(id) {
    const g = gifts.value.find(x => x.id === id)
    if (!g) return
    if (!(g.item || '').trim() && !g.hargaEstimasi && !g.hargaAktual) {
      gifts.value = gifts.value.filter(x => x.id !== id)
      saveGifts()
    }
  }

  async function delGift(id) {
    const g = gifts.value.find(x => x.id === id)
    if (!g) return
    const label = g.type === 'seserahan' ? 'seserahan' : 'mahar'
    const message = g.includeInBudget
      ? `"${g.item || 'tanpa nama'}" akan dihapus dari ${label}. Link ke Budget-nya juga ikut terhapus.`
      : `"${g.item || 'tanpa nama'}" akan dihapus dari ${label}.`
    const ok = await askConfirm({ title: 'Hapus item?', message, confirmLabel: 'Hapus' })
    if (!ok) return
    gifts.value = gifts.value.filter(x => x.id !== id)
    delete selectedMap[String(id)]
    saveGifts(); toast('Item dihapus')
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
      .insert({ owner_user_id: uid, kategori: name, position }).select().single()
    if (error || !row) { toast('Gagal menambah kategori, coba lagi'); return null }
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
      .insert({ owner_user_id: uid, group_id: groupId, tugas: '', status: false, prioritas: null, catatan: '' }).select().single()
    if (error || !row) { toast('Gagal menambah tugas, coba lagi'); return null }
    g.items.push(row)
    _shadow.checklistItems.set(row.id, JSON.parse(JSON.stringify(row)))
    return row
  }

  function exportGuestsCSV() {
    const META = { cpp:{label:'Keluarga Pengantin Pria'}, cpw:{label:'Keluarga Pengantin Wanita'}, teman_pria:{label:'Teman Pengantin Pria'}, teman_wanita:{label:'Teman Pengantin Wanita'}, tetangga_pria:{label:'Tetangga Pengantin Pria'}, tetangga_wanita:{label:'Tetangga Pengantin Wanita'}, lainnya:{label:'Lainnya'} }
    const KEH = { belum:'Belum Konfirmasi', hadir:'Hadir', tidak:'Tidak Hadir', hampers:'Kirim Hampers' }
    const head = ['No','Nama Lengkap','Jumlah Orang','Relasi','Undangan Untuk','Kehadiran']
    const rows = guests.value.map((g, i) => [i+1, g.nama, g.jumlah, (META[g.relasi]||{label:'Lainnya'}).label, g.undangan||'keduanya', KEH[g.kehadiran || 'belum']])
    downloadCSV('daftar-tamu-undangan.csv', toCSV(head, rows))
    toast('CSV tamu diunduh')
  }

  function exportBudgetCSV() {
    const head = ['No','Item','Status','Estimasi Budget','Aktual Budget','Selisih','Sudah Dibayarkan','Sisa Pembayaran','Jatuh Tempo Terdekat','Remarks']
    const rows = budget.value.map((b, i) => {
      const st = bStatus(b)
      return [i+1, b.item, st.label, b.estimasi, b.aktual, b.estimasi-b.aktual, b.dibayar, bSisa(b), nextDue(b.id), b.remarks]
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
        if (stat) {
          // Cuma proses vendor yang statusnya BENERAN berubah. Tanpa guard
          // ini, bulk-edit ke status yang sama (mis. re-apply "Dipakai" ke
          // vendor yang udah dipakai) manggil handleVendorDecision berkali-
          // kali — kalau state lokal sempat nggak sinkron pas itu terjadi,
          // baris Budget-nya bisa kegandain (kejadian nyata, sudah dibenerin
          // datanya di database).
          const newStatus = stat === 'jadi' ? 'dipakai' : 'batal'
          const newJadi = newStatus === 'dipakai'
          if (v.status !== newStatus || v.jadi !== newJadi) {
            v.status = newStatus
            v.jadi = newJadi
            handleVendorDecision(v, newJadi)
          }
        }
        c++
      })
      if (c) saveV()
    } else if (tab === 'budget') {
      const { stat, due } = fields
      if (!stat && !due) { toast('Pilih minimal satu perubahan'); return }
      const today = new Date().toISOString().slice(0, 10)
      budget.value.forEach(b => {
        if (!isSelected(b.id)) return
        if (stat === 'lunas') {
          // Lunasi lewat 1 entri pembayaran sebesar sisa (bukan set dibayar
          // langsung) — biar konsisten dengan buku pembayaran.
          const sisa = bSisa(b)
          if (sisa > 0) addPayment(b.id, { amount: sisa, paid: true, paidDate: today, note: 'Pelunasan' })
        } else if (stat === 'belum') {
          payments.value.forEach(p => { if (p.budgetItemId === b.id && p.paid) p.paid = false })
          recalcDibayar(b.id)
        }
        if (due) {
          // Set jatuh tempo ke termin belum-lunas paling awal; kalau belum
          // ada termin, buat satu sebesar sisa dengan tanggal itu.
          const open = payments.value.filter(p => p.budgetItemId === b.id && !p.paid)
          if (open.length) {
            open.sort((x, y) => (x.dueDate || '').localeCompare(y.dueDate || ''))
            open[0].dueDate = due
          } else if (bSisa(b) > 0) {
            addPayment(b.id, { amount: bSisa(b), dueDate: due, note: 'Pembayaran' })
          }
        }
        c++
      })
      if (c) { saveP(); saveB() }
    } else if (tab === 'gifts') {
      const { stat } = fields
      if (!stat) { toast('Pilih minimal satu perubahan'); return }
      gifts.value.forEach(x => { if (isSelected(x.id)) { x.status = stat; c++ } })
      if (c) saveGifts()
    }
    if (c) { clearSelected(); toast(`Berhasil mengubah ${c} item`); return true }
    return false
  }

  async function bulkDelete(tab) {
    const n = selectedIds.value.length
    if (!n) return
    const tabLabel = { tamu: 'tamu', vendor: 'vendor', budget: 'anggaran', gifts: 'mahar & seserahan' }[tab] || tab
    const ok = await askConfirm({
      title: `Hapus ${n} item?`,
      message: `${n} item dari tab ${tabLabel} akan dihapus permanen.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    if (tab === 'tamu') { guests.value = guests.value.filter(x => !isSelected(x.id)); saveG() }
    else if (tab === 'vendor') {
      // Vendor yang "Dipakai" bawa baris Budget-nya — samain kayak hapus
      // vendor satuan (delVendor), biar nggak nyisa baris Budget yatim
      // yang nyambung ke vendor yang udah kehapus.
      vendors.value.filter(v => isSelected(v.id) && v.jadi).forEach(v => handleVendorDecision(v, false))
      vendors.value = vendors.value.filter(x => !isSelected(x.id))
      saveV()
    }
    else if (tab === 'budget') {
      const selected = budget.value.filter(x => isSelected(x.id))
      const blocked = selected.filter(x => budgetOrigin(x)?.managed)
      const deletable = selected.filter(x => !budgetOrigin(x)?.managed)
      if (!deletable.length) {
        clearSelected()
        toast('Item Budget terpilih dikelola otomatis — tidak bisa dihapus dari sini')
        return
      }
      const deletedIds = deletable.map(x => x.id)
      budget.value = budget.value.filter(x => !isSelected(x.id) || budgetOrigin(x)?.managed)
      deletedIds.forEach(id => { if (id != null) _forgetPaymentsLocal(id) })
      saveB()
      if (blocked.length) toast(`${blocked.length} item otomatis tidak dihapus`)
    }
    else if (tab === 'gifts') { gifts.value = gifts.value.filter(x => !isSelected(x.id)); saveGifts() }
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
        payments: payments.value,
        fund: fund.value,
        vendors: vendors.value,
        gifts: gifts.value,
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
      const counts = [['guests','tamu'],['budget','budget'],['fund','transaksi keuangan'],['vendors','vendor'],['gifts','mahar/seserahan'],['admin','administrasi'],['checklist','checklist'],['timeline','timeline']].map(([k,l]) => Array.isArray(d[k]) ? `${d[k].length} ${l}` : null).filter(Boolean)
      const when = payload.exportedAt ? new Date(payload.exportedAt).toLocaleDateString('id-ID') : 'tidak diketahui'
      const hasSettings = payload.settings && Object.keys(payload.settings).length > 0
      const settingsNote = hasSettings ? ' Settings aplikasi juga akan dipulihkan (profil pasangan, onboarding, filter, reminder, dan urutan tab).' : ''
      const ok = await askConfirm({
        title: 'Impor & ganti semua data?',
        message: `File dibuat ${when}. Isi: ${counts.join(', ')}.${settingsNote} SEMUA data kamu saat ini akan DIGANTI dan tidak bisa dikembalikan.`,
        confirmLabel: 'Impor & Ganti',
      })
      if (!ok) return

      if (Array.isArray(d.guests))    guests.value    = d.guests
      if (Array.isArray(d.fund))      fund.value      = d.fund
      if (Array.isArray(d.vendors)) vendors.value = d.vendors
      if (Array.isArray(d.gifts))     gifts.value     = d.gifts
      if (Array.isArray(d.admin))     admin.value     = d.admin
      if (Array.isArray(d.checklist)) checklist.value = d.checklist
      if (Array.isArray(d.timeline))  timeline.value  = d.timeline
      if (Array.isArray(d.budget)) {
        // Backup lama (sebelum originType ada, atau dari sebelum merge
        // Mahar/Seserahan) — derive originType dasar biar budgetOrigin()
        // tetap ngenalin baris vendor/template. Baris "Total Mahar"/"Total
        // Seserahan" era-agregat & link weddingGiftId TIDAK direkonstruksi
        // (flat export gak nyimpen relasinya) — jatuh ke 'manual', item
        // masih ada, user tinggal masukin ulang linknya via tab Mahar &
        // Seserahan kalau perlu.
        budget.value = d.budget.map(b => ({
          ...b,
          originType: (b.originType === 'seserahan_auto' || b.originType === 'mahar_auto') ? 'manual' : (b.originType || (
            b.vendorId ? 'vendor'
            : b.template ? 'template'
            : 'manual'
          )),
        }))
        // Item budget dapat id baru saat di-insert ulang, jadi entri
        // pembayaran lama (referensi budgetItemId lama) pasti yatim —
        // dikosongkan, sama seperti link vendorId yang juga tak dipertahankan
        // pada restore. File backup tetap menyimpan payments buat recovery
        // manual kalau perlu.
        payments.value = []
        // Transaksi Wedding Fund TETAP dipertahankan (uang yang beneran
        // keluar/masuk bukan data turunan Budget) — cuma link ke budget
        // item/termin lama yang dilepas karena sudah pasti yatim.
        fund.value = fund.value.map(t => ({ ...t, budgetItemId: null, budgetPaymentId: null }))
      }
      _applySettingsPayload(payload.settings)

      // Semua 8 entity sudah pindah ke tabel sendiri — sinkron lewat diff
      // engine, `_upsert` di sini cuma bawa settings.
      await Promise.all([
        _upsert({ settings: _settingsPayload() }),
        _diffAndSync('guests', 'guests', guests.value),
        _diffAndSync('timeline', 'timeline_tasks', timeline.value),
        _diffAndSync('budget', 'budget_items', budget.value),
        _diffAndSync('payments', 'budget_payments', payments.value),
        _diffAndSync('fund', 'wedding_fund_transactions', fund.value),
        _diffAndSync('vendors', 'vendors', vendors.value),
        _diffAndSync('gifts', 'wedding_gifts', gifts.value),
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
    gifts:     { label: 'mahar & seserahan', get: () => gifts.value, apply: v => { gifts.value = v; saveGifts() } },
    admin:     { label: 'administrasi', get: () => admin.value,     apply: v => { admin.value = v; saveA() } },
    checklist: { label: 'checklist',    get: () => checklist.value, apply: v => { checklist.value = v; saveCK() } },
    budget:    { label: 'budget',       get: () => budget.value,    apply: v => { budget.value = v; payments.value = []; saveB(); saveP() } },
    keuangan:  { label: 'transaksi keuangan', get: () => fund.value, apply: v => { fund.value = v; saveF() } },
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
    reader.onload = async e => {
      let payload
      try { payload = JSON.parse(e.target.result) } catch { toast('File tidak bisa dibaca'); return }
      if (!payload || payload.app !== 'wedding-planner' || !Array.isArray(payload.data)) { toast('Bukan file data Wedding Planner'); return }
      if (payload.tab && payload.tab !== tab) { toast(`File ini untuk tab "${payload.tab}", bukan "${cfg.label}"`); return }
      const ok = await askConfirm({
        title: `Ganti data ${cfg.label}?`,
        message: `Semua data ${cfg.label} saat ini akan diganti dengan ${payload.data.length} item dari file ini.`,
        confirmLabel: 'Ganti',
      })
      if (!ok) return
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

  // Wave 2: budget/vendors/gifts juga sudah pindah ke tabel
  // sendiri — dimuat terpisah, fungsi baru (bukan digabung ke
  // _loadGuestsAndTimeline) biar resikonya kecil, sama seperti keputusan
  // Wave 1 dulu.
  async function _loadBudgetVendorsGifts(ownerId) {
    const [{ data: b }, { data: p }, { data: f }, { data: v }, { data: g }] = await Promise.all([
      supabase.from('budget_items').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('budget_payments').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('wedding_fund_transactions').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('vendors').select('*').eq('owner_user_id', ownerId).order('id'),
      supabase.from('wedding_gifts').select('*').eq('owner_user_id', ownerId).order('id'),
    ])
    budget.value    = b || []
    payments.value  = p || []
    fund.value      = f || []
    vendors.value   = v || []
    gifts.value     = g || []
    _seedShadow('budget', budget.value)
    _seedShadow('payments', payments.value)
    _seedShadow('fund', fund.value)
    _seedShadow('vendors', vendors.value)
    _seedShadow('gifts', gifts.value)

    // dibayar itu cache turunan dari jumlah entri pembayaran lunas. Rekap
    // ulang saat load kalau ada yang meleset dari sinkronisasi lintas-device
    // (mis. entri diedit di HP, budget_items belum keburu ke-update). Sekali
    // di sini murah & bikin status/sisa selalu konsisten dengan buku bayar.
    _reconcileAllDibayar()

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
        _loadBudgetVendorsGifts(pData.user_id),
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
        _loadBudgetVendorsGifts(userId),
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
    // guests & vendors & gifts: array kosong, tidak ada seed
    guests.value  = []; vendors.value = []; gifts.value = []
    payments.value = []
    fund.value = []
    _seedShadow('guests', []); _seedShadow('vendors', []); _seedShadow('gifts', [])
    _seedShadow('payments', [])
    _seedShadow('fund', [])

    // timeline_tasks SENGAJA tidak di-seed lagi: tab Timeline sekarang
    // read-only dan tidak punya data sendiri — semua tugas bertanggal
    // rumahnya di Checklist. Tabelnya tetap dimuat/ditampilkan buat user
    // lama yang barisnya sudah terlanjur ada (lihat useTimelineFeed.js).
    timeline.value = []
    _seedShadow('timeline', [])

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
      owner_user_id: userId, legacy_id: g.id, kategori: g.kategori, position: i,
    }))
    const { data: insertedChecklistGroups } = await supabase.from('checklist_groups').insert(checklistGroupRows).select()
    const checklistItemRows = []
    ;(insertedChecklistGroups || []).forEach(cg => {
      const seedGroup = CHECKLIST_SEED.find(g => g.id === cg.legacy_id)
      ;(seedGroup?.items || []).forEach(it => {
        checklistItemRows.push({ owner_user_id: userId, group_id: cg.id, tugas: it.tugas, status: !!it.status, prioritas: null, catatan: '' })
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
  // true kalau channel sempat putus — dipakai buat memutuskan perlu
  // catch-up atau nggak begitu status balik ke SUBSCRIBED.
  let _realtimeWasDown = false

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
    budget: new Map(), payments: new Map(), fund: new Map(), vendors: new Map(), gifts: new Map(),
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

  // Perubahan entri pembayaran dari device lain. Setelah apply, rekap cache
  // b.dibayar lokal TANPA saveB — nilai otoritatif dibayar tetap datang
  // lewat realtime budget_items, jadi trigger saveB di sini cuma bikin
  // echo-loop. Payload DELETE cuma bawa id (replica identity default), jadi
  // rekap semua item, bukan gantungin ke old.budgetItemId.
  function _applyPaymentChange(p) {
    _applyRowChange('payments', payments, p)
    _recomputeDibayarLocal()
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
      }, async ({ new: d }) => {
        if (isPartner.value && d.partner_user_id === null) {
          isPartner.value    = false
          ownerUserId.value  = user.value.id
          partnerEmail.value = ''
          ownerEmail.value   = ''
          toast('Kamu dikeluarkan dari dashboard bersama')
          // loading dikunci selama reload — event realtime ini bisa nyala
          // kapan aja pas user lagi aktif pakai app. Tanpa ini, UI tetap
          // kebuka & aksi save() yang nyempil di tengah reload bisa nge-diff
          // ke shadow yang belum lengkap → data lama ke-insert ulang jadi
          // dobel (lihat juga revalidateMembership & leavePartnership).
          loading.value = true
          try {
            await loadData(user.value.id)
          } finally {
            loading.value = false
          }
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
        event: '*', schema: 'public', table: 'budget_payments',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyPaymentChange(p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wedding_fund_transactions',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('fund', fund, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'vendors',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('vendors', vendors, p))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wedding_gifts',
        filter: `owner_user_id=eq.${listenId}`,
      }, p => _applyRowChange('gifts', gifts, p))
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
      // Status channel dipantau buat tahu kapan koneksi PUTUS lalu NYAMBUNG
      // lagi. Event yang lewat selama putus nggak pernah diulang Supabase,
      // jadi begitu tersambung ulang data ditarik ulang sekali (catch-up).
      // SUBSCRIBED pertama (pas baru login) di-skip — datanya baru saja
      // dimuat loadData(), nggak perlu ditarik dua kali.
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          _realtimeWasDown = true
          return
        }
        if (status === 'SUBSCRIBED' && _realtimeWasDown) {
          _realtimeWasDown = false
          refetchAll()
        }
      })
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
        _loadBudgetVendorsGifts(ownerUid),
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
    // loading dikunci selama reload — ini aksi user (klik tombol), app udah
    // full interaktif. Tanpa ini, save() yang nyempil di tengah reload bisa
    // nge-diff ke shadow yang belum lengkap → data lama ke-insert ulang
    // jadi dobel (bug yang sama kayak revalidateMembership & realtime kick).
    loading.value = true
    try {
      await loadData(user.value.id)
      subscribeRealtime(user.value.id)   // pindah channel ke dashboard sendiri
    } finally {
      loading.value = false
    }
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
        // loading dikunci selama reload — jalur ini reload SEMUA entity
        // (vendors/budget/dst) dan re-seed shadow diff-sync dari nol; kalau
        // UI tetap kebuka & user sempat trigger save() di tengah jendela
        // ini, diff bisa lihat shadow yang belum lengkap dan nge-insert
        // ulang data yang sebenarnya udah ada (baris dobel).
        loading.value = true
        try {
          await loadData(user.value.id)
          subscribeRealtime(user.value.id)
        } finally {
          loading.value = false
        }
      }
    } else {
      // Owner: refresh status pasangan terkini
      const { data } = await supabase.from('wedding_data')
        .select('partner_email').eq('user_id', user.value.id).maybeSingle()
      if (data) partnerEmail.value = data.partner_email || ''
    }
  }

  // ── Muat ulang data dari server (catch-up) ─────────────────────────
  //  Realtime Supabase itu WebSocket: cuma ngantar perubahan SELAMA
  //  koneksinya hidup, dan TIDAK pernah mengulang event yang terlewat.
  //  Di HP koneksi gampang putus (layar mati, app di-background, pindah
  //  WiFi↔seluler, idle timeout) — perubahan dari device pasangan yang
  //  terjadi pas socket lagi putus hilang selamanya buat device ini.
  //  Makanya perlu ditarik ulang di momen yang menandakan "mungkin ada
  //  yang terlewat": app kembali ke depan, realtime nyambung ulang, atau
  //  user menekan Sinkronkan manual.
  //
  //  URUTAN PENTING:
  //  1. flushPendingSaves() — kirim dulu editan yang masih ngantre
  //     debounce, kalau nggak bakal ketimpa data server.
  //  2. loading=true — kunci UI + cegah save() nyempit di tengah reload
  //     (shadow lagi di-reseed dari nol; race-nya pernah bikin data dobel).
  let _refetching = false
  let _lastRefetchAt = 0

  async function refetchAll({ force = false, quiet = true } = {}) {
    if (!user.value || _refetching || loading.value) return false
    // Jangan narik ulang tiap kali app dilirik sebentar — focus/visibility
    // bisa nyala beruntun. Tombol manual pakai force:true biar selalu jalan.
    if (!force && Date.now() - _lastRefetchAt < 15000) return false

    _refetching = true
    try {
      await flushPendingSaves()
      const ownerUid = ownerUserId.value || user.value.id
      loading.value = true
      try {
        const { data } = await supabase.from('wedding_data')
          .select('*').eq('user_id', ownerUid).maybeSingle()
        if (data) _applyData(data)
        await Promise.all([
          _loadGuestsAndTimeline(ownerUid),
          _loadBudgetVendorsGifts(ownerUid),
          _loadAdminAndChecklist(ownerUid),
        ])
      } finally {
        loading.value = false
      }
      _lastRefetchAt = Date.now()
      if (!quiet) toast('Data tersinkron')
      return true
    } catch (e) {
      console.error('[refetchAll] gagal:', e)
      if (!quiet) toast(_errMsg(e, 'menyinkronkan data'))
      return false
    } finally {
      _refetching = false
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
    // Selain cek kemitraan, data juga ditarik ulang: selama app di belakang
    // koneksi realtime biasanya ditidurkan OS, jadi perubahan dari device
    // pasangan bisa terlewat (lihat refetchAll). Ada throttle 15 detik di
    // dalamnya biar nggak narik ulang tiap kali app dilirik sebentar.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      revalidateMembership()
      refetchAll()
    })
    window.addEventListener('focus', () => {
      revalidateMembership()
      refetchAll()
    })
    // Koneksi balik setelah offline — kandidat kuat ada yang terlewat.
    window.addEventListener('online', () => refetchAll({ force: true }))
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
        guests.value = []; budget.value = []; payments.value = []; fund.value = []; vendors.value = []
        gifts.value = []; admin.value = []
        checklist.value = []; timeline.value = []
        couple.value = { pria: '', wanita: '', tanggal: '', jamMulai: '', jamSelesai: '', tanggalLamaran: '', tanggalAkad: '', tanggalResepsi: '' }
        targetBudget.value = 0
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
    user, profile, isPaid, loading, currentUserName,
    hasAccess, trialExpired, trialDaysLeft, paymentEnabled, forcePaywall,
    createPayment, pollUntilPaid,
    refetchAll,
    initAuth, signInWithGoogle, signOut,
    // partner
    ownerUserId, isPartner, partnerEmail, ownerEmail,
    sendPartnerInvite, cancelPartnerInvite, acceptPartnerInvite, removePartner, leavePartnership, revalidateMembership,
    // onboarding
    couple, targetBudget, onboarded, beginOnboarding, startOnboarding, completeOnboarding,
    showWelcomeGuide, dismissWelcomeGuide, tourSidebarOpen, tourSteps, startTour,
    // quick add / reminders
    quickAddTarget, quickAddNonce, requestQuickAdd,
    reminders, saveReminderSettings, markReminderNotified,
    // state
    guests, budget, payments, fund, vendors, gifts, admin, checklist, timeline,
    activeTab, tabOrder, bFilter, vFilter, selectedMap,
    toastMsg, toastVisible,
    confirmShow, confirmTitle, confirmMessage, confirmOk, confirmCancel, confirmDanger,
    // computed
    confirmedGuests, selectedCount, selectedIds,
    totalGuestPax, venueCapacity, capacityOver, hampersCount,
    hadirOrangCount, rsvpUndanganCount, vendorPaxMultiplier, vendorEffectiveHarga, vendorBiayaTambahan,
    // confirm dialog
    askConfirm, resolveConfirm,
    // selection
    isSelected, toggleSelected, clearSelected,
    // core
    init, toast,
    saveG, saveB, saveP, saveF, saveV, saveA, saveCK, saveTL, saveTabOrder, saveSettings,
    // budget
    bStatus, bSisa, bSelisih, bDisplayPrice, budgetSelisihTotal, budgetEstimasiSetCount, budgetOrigin,
    addBudgetItem, delBudget, removeBudgetEmptyItem,
    // pembayaran (buku bayar)
    itemPayments, paidTotal, nextDue, addPayment, updatePayment, delPayment, togglePaymentPaid, payNextDue, recalcDibayar,
    // wedding fund
    fundMasuk, fundKeluar, fundSaldo, fundTxForPayment, addFundTx, updateFundTx, delFundTx,
    // sync
    syncGiftsToBudget, handleVendorDecision,
    // guest
    saveGuest, delGuest, duplicateGuest, exportGuestsCSV, exportBudgetCSV,
    // timeline
    addTimelineTask, delTimeline, removeEmptyTimeline,
    // vendor
    addVendor, delVendor, setVendorStatus, vendorPayInfo,
    categoryIncludedBy, vendorIncludedByOther,
    // mahar & seserahan (gifts)
    addGift, delGift, removeEmptyGift, saveGifts,
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
