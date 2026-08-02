import { computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { daysLeft, fmt, fmtDate } from '../utils/index'
import { TIMELINE_CATEGORIES, MAIN_EVENTS } from '../data/constants'

// ─────────────────────────────────────────────────────────────────────
//  Sumber data tunggal halaman Timeline.
//
//  Timeline TIDAK punya data sendiri: composable ini cuma MEMBACA state
//  yang rumahnya di modul lain (Checklist, Budget, Vendor, Dokumen, Mahar
//  & Seserahan, Keuangan, dan tanggal acara di profil pasangan) lalu
//  meratakannya jadi satu daftar kronologis. Karena semuanya computed di
//  atas store yang reaktif, tanggal yang diubah dari modul asalnya
//  langsung kelihatan di Timeline tanpa sinkronisasi manual.
//
//  Nambah sumber baru = tambah satu blok push() di bawah + satu entri di
//  TIMELINE_CATEGORIES. Jangan pernah nyimpen tanggal di halaman Timeline
//  itu sendiri.
// ─────────────────────────────────────────────────────────────────────

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Status waktu satu item — satu-satunya tempat aturan ini ditulis, biar
// kartu Timeline, ringkasan "Perlu Perhatian", dan insight Hero nggak
// pernah beda istilah.
export function timeStatus(item) {
  if (item.done) return { label: 'Selesai', tone: 'done' }
  const d = daysLeft(item.date)
  if (d < 0) {
    return item.milestone
      ? { label: 'Sudah Lewat', tone: 'past' }
      : { label: `Terlambat ${Math.abs(d)} Hari`, tone: 'late' }
  }
  if (d === 0) return { label: 'Hari Ini', tone: 'today' }
  if (d === 1) return { label: 'Besok', tone: 'soon' }
  if (d <= 7) return { label: `${d} Hari Lagi`, tone: 'soon' }
  return { label: `${d} Hari Lagi`, tone: 'future' }
}

// Akhir bulan yang masih tersisa sebelum Hari-H — dipakai buat menaruh
// target tabungan bulanan di garis waktu.
function monthEndsBefore(targetISO, today, max = 12) {
  const out = []
  const end = new Date(targetISO + 'T00:00:00')
  const cur = new Date(today.getFullYear(), today.getMonth() + 1, 0) // akhir bulan ini
  while (out.length < max && cur < end) {
    if (cur >= today) out.push(iso(cur))
    cur.setMonth(cur.getMonth() + 2, 0) // lompat ke akhir bulan berikutnya
  }
  return out
}

export function useTimelineFeed() {
  const store = useWeddingStore()

  const today = computed(() => todayISO())

  const weddingDate = computed(() => store.couple?.tanggal || '')

  const items = computed(() => {
    const list = []
    const push = it => list.push({
      amount: null, detail: '', done: false, milestone: false, goto: null,
      badge: TIMELINE_CATEGORIES[it.cat]?.label || '',
      ...it,
    })

    // ── Checklist: deadline tugas ────────────────────────────────────
    store.checklist.forEach(g => (g.items || []).forEach(it => {
      if (!it.deadline) return
      push({
        key: `ck-${it.id}`, date: it.deadline, cat: 'checklist',
        title: (it.tugas || '').trim() || 'Tugas tanpa nama',
        detail: g.kategori || '',
        done: !!it.status,
        goto: 'checklist',
      })
    }))

    // Tugas peninggalan tab Timeline lama (timeline_tasks). Nggak di-seed
    // lagi buat user baru, tapi data yang sudah ada tetap ditampilkan biar
    // nggak ada tugas yang mendadak hilang dari garis waktu.
    store.timeline.forEach(t => {
      if (!t.deadline) return
      push({
        key: `tl-${t.id}`, date: t.deadline, cat: 'checklist', badge: 'Tugas',
        title: (t.tugas || '').trim() || 'Tugas tanpa nama',
        detail: 'Tugas lama',
        done: t.status === 'selesai',
      })
    })

    // ── Budget: termin & jatuh tempo pembayaran ──────────────────────
    // Sumbernya buku pembayaran (budget_payments) — jadi SEMUA termin ikut
    // muncul, bukan cuma yang terdekat seperti cache b.jatuhTempo.
    const itemsWithTermin = new Set()
    store.payments.forEach(p => {
      const b = store.budget.find(x => x.id === p.budgetItemId)
      if (!b) return
      itemsWithTermin.add(b.id)
      const date = p.paid ? (p.paidDate || p.dueDate) : p.dueDate
      if (!date) return
      const note = (p.note || '').trim()
      const nama = (b.item || '').trim() || 'Item budget'
      push({
        key: `pay-${p.id}`, date, cat: 'bayar',
        title: note ? `${note} — ${nama}` : `Pembayaran — ${nama}`,
        detail: p.paid ? 'Sudah dibayar' : 'Termin pembayaran',
        amount: p.amount || 0,
        done: !!p.paid,
        goto: 'budget',
      })
    })

    // Item budget lama yang punya jatuh tempo tapi belum punya baris termin
    // sama sekali — tetap ditarik biar nggak ada tanggal yang hilang.
    store.budget.forEach(b => {
      if (!b.jatuhTempo || itemsWithTermin.has(b.id)) return
      const lunas = store.bStatus(b).key === 'lunas'
      push({
        key: `bud-${b.id}`, date: b.jatuhTempo, cat: 'bayar',
        title: `Pembayaran — ${(b.item || '').trim() || 'Item budget'}`,
        detail: 'Jatuh tempo',
        amount: store.bSisa(b),
        done: lunas,
        goto: 'budget',
      })
    })

    // ── Vendor: meeting, food testing, survey, fitting, dll. ─────────
    store.vendors.forEach(v => (v.jadwal || []).forEach((j, i) => {
      if (!j || !j.tanggal) return
      const judul = (j.judul || '').trim() || j.jenis || 'Jadwal vendor'
      push({
        key: `vj-${v.id}-${i}`, date: j.tanggal, cat: 'vendor',
        title: judul,
        detail: [v.nama, (j.catatan || '').trim()].filter(Boolean).join(' · '),
        done: j.status === 'selesai',
        goto: 'vendor',
      })
    }))

    // ── Dokumen Nikah: jadwal KUA, pengambilan dokumen, legalisasi ───
    store.admin.forEach(g => (g.items || []).forEach(it => {
      if (!it.tanggal) return
      push({
        key: `ad-${it.id}`, date: it.tanggal, cat: 'dokumen',
        title: (it.syarat || '').trim() || 'Dokumen',
        detail: g.grup || '',
        done: !!it.status,
        goto: 'admin',
      })
    }))

    // ── Mahar & Seserahan: tanggal pembelian & penyerahan ────────────
    const DIBELI = new Set(['sudah_dibeli', 'sudah_dikemas', 'sudah_diserahkan'])
    store.gifts.forEach(g => {
      const label = g.type === 'seserahan' ? 'Seserahan' : 'Mahar'
      const nama  = (g.item || '').trim() || 'Tanpa nama'
      if (g.tanggalPembelian) {
        push({
          key: `gb-${g.id}`, date: g.tanggalPembelian, cat: 'gift',
          title: `Beli ${nama}`, detail: label,
          done: DIBELI.has(g.status),
          goto: 'gifts',
        })
      }
      if (g.tanggalPenyerahan) {
        push({
          key: `gs-${g.id}`, date: g.tanggalPenyerahan, cat: 'gift',
          title: `Serahkan ${nama}`, detail: label,
          done: g.status === 'sudah_diserahkan',
          goto: 'gifts',
        })
      }
    })

    // ── Keuangan: target tabungan bulanan ────────────────────────────
    // Bukan data baru — dihitung dari Target Dana Pernikahan & saldo
    // Wedding Fund yang sudah ada di tab Keuangan.
    const target = store.targetBudget || 0
    const kurang = target - store.fundSaldo
    if (target > 0 && kurang > 0 && weddingDate.value) {
      const t0 = new Date(); t0.setHours(0, 0, 0, 0)
      const bulan = monthEndsBefore(weddingDate.value, t0)
      const dates = bulan.length ? bulan : [weddingDate.value]
      const per = Math.ceil(kurang / dates.length)
      dates.forEach(d => {
        const m = MONTHS[parseInt(d.split('-')[1]) - 1]
        push({
          key: `fund-${d}`, date: d, cat: 'keuangan',
          title: `Target tabungan ${m}`,
          detail: `Kurang ${fmt(kurang)} dari Target Dana Pernikahan`,
          amount: per,
          milestone: true,
          goto: 'keuangan',
        })
      })
    }

    // ── Acara utama: lamaran, akad, resepsi, Hari-H ──────────────────
    MAIN_EVENTS.forEach(ev => {
      const date = store.couple?.[ev.key]
      if (!date) return
      push({
        key: `ev-${ev.key}`, date, cat: 'acara',
        title: ev.label, detail: 'Acara utama',
        milestone: true, goto: 'home',
      })
    })

    if (weddingDate.value) {
      push({
        key: 'hari-h', date: weddingDate.value, cat: 'acara',
        title: 'Hari Pernikahan', detail: coupleNames(store) || 'Hari bahagia kalian',
        milestone: true, hariH: true, goto: 'home',
      })
    }

    return list
      .map(e => ({ ...e, status: timeStatus(e), dateLabel: fmtDate(e.date) }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  })

  // ── Ringkasan buat Hero & kartu "Perlu Perhatian" ──────────────────
  const daysToWedding = computed(() => (weddingDate.value ? daysLeft(weddingDate.value) : null))

  const lateItems = computed(() =>
    items.value.filter(e => !e.done && !e.milestone && daysLeft(e.date) < 0)
  )

  const weekItems = computed(() =>
    items.value.filter(e => {
      if (e.done) return false
      const d = daysLeft(e.date)
      return d >= 0 && d <= 7
    })
  )

  const paymentItems = computed(() => items.value.filter(e => e.cat === 'bayar' && !e.done))
  const nextPayment  = computed(() => paymentItems.value[0] || null)
  const paymentsSoon = computed(() =>
    paymentItems.value.filter(e => {
      const d = daysLeft(e.date)
      return d >= 0 && d <= 7
    })
  )

  const doneThisWeek = computed(() =>
    items.value.filter(e => {
      const d = daysLeft(e.date)
      return e.done && d >= -7 && d <= 7
    }).length
  )

  // Progress "perjalanan menuju Hari H": dari aktivitas paling awal yang
  // tercatat (atau hari ini kalau semuanya masih di depan) sampai Hari-H.
  const journey = computed(() => {
    if (!weddingDate.value) return null
    const first = items.value.find(e => e.cat !== 'acara')?.date
    const start = first && first < today.value ? first : today.value
    const s = new Date(start + 'T00:00:00').getTime()
    const e = new Date(weddingDate.value + 'T00:00:00').getTime()
    const n = new Date(today.value + 'T00:00:00').getTime()
    const span = e - s
    const pct = span > 0 ? Math.min(100, Math.max(0, Math.round((n - s) / span * 100))) : 100
    return { start, end: weddingDate.value, pct }
  })

  // Insight dinamis Hero — maksimal 3 baris, yang paling genting duluan.
  const insights = computed(() => {
    const out = []
    const d = daysToWedding.value

    if (d === null) {
      out.push({ icon: '📅', tone: 'info', text: 'Tanggal pernikahan belum diisi — lengkapi di tab Home biar hitungan mundurnya jalan.' })
    } else if (d > 0) {
      out.push({ icon: '❤️', tone: 'info', text: `Masih ada ${d} hari menuju Hari Pernikahan.` })
    } else if (d === 0) {
      out.push({ icon: '🎉', tone: 'good', text: 'Hari ini hari pernikahan kalian. Selamat!' })
    } else {
      out.push({ icon: '🎉', tone: 'good', text: `Hari pernikahan sudah berlalu ${Math.abs(d)} hari lalu.` })
    }

    if (lateItems.value.length) {
      out.push({ icon: '🔴', tone: 'bad', text: `${lateItems.value.length} aktivitas lewat tanggal dan belum selesai.` })
    }

    if (weekItems.value.length) {
      out.push({ icon: '🟡', tone: 'warn', text: `Minggu ini ada ${weekItems.value.length} aktivitas yang perlu diperhatikan.` })
    } else if (doneThisWeek.value > 0 && !lateItems.value.length) {
      out.push({ icon: '🎉', tone: 'good', text: 'Semua aktivitas minggu ini sudah selesai. 🎉' })
    }

    if (paymentsSoon.value.length) {
      out.push({ icon: '💰', tone: 'warn', text: `Ada ${paymentsSoon.value.length} pembayaran yang akan jatuh tempo dalam 7 hari ke depan.` })
    }

    return out.slice(0, 3)
  })

  return {
    store, today, items, weddingDate, daysToWedding, journey,
    lateItems, weekItems, paymentsSoon, nextPayment, insights,
  }
}

function coupleNames(store) {
  const { pria, wanita } = store.couple || {}
  return [pria, wanita].filter(Boolean).join(' & ')
}
