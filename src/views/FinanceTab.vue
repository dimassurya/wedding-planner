<template>
  <section class="panel active" id="panel-keuangan">
    <!-- Hero — satu-satunya card besar, seluruh info Wedding Fund ada di sini -->
    <div class="fh-hero">
      <TourBtn :steps="FINANCE_STEPS" class="fh-tour" />

      <div class="fh-hero-eyebrow">💰 Wedding Fund</div>

      <div class="fh-hero-balance">
        <div class="fh-hero-balance-lbl">Saldo Tabungan</div>
        <div class="fh-hero-balance-val">{{ fmt(animSaldo) }}</div>
      </div>

      <div class="fh-hero-progress">
        <div class="fh-hero-bar"><div class="fh-hero-bar-fill" :style="{ width: progressPctClamped + '%' }"></div></div>
        <div class="fh-hero-pct-row">
          <span class="fh-hero-pct">{{ animPct }}%</span>
          <span class="fh-hero-pct-lbl">dari target terkumpul</span>
        </div>
      </div>

      <div class="fh-hero-stats">
        <div class="fh-hero-stat fh-hero-stat-target" @click="startEditTarget" title="Ubah Target Dana Pernikahan">
          <div class="fh-hero-stat-lbl">
            🎯 Target Dana Pernikahan
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="fh-hero-stat-val">{{ fmt(store.targetBudget) }}</div>
        </div>
        <div class="fh-hero-stat">
          <div class="fh-hero-stat-lbl">Masih Perlu Ditabung</div>
          <div class="fh-hero-stat-val">{{ fmt(sisaKumpul) }}</div>
        </div>
      </div>

      <div class="fh-hero-status" :class="'st-' + fundStatus.key">
        <span>{{ fundStatus.icon }}</span>{{ fundStatus.text }}
      </div>

      <button class="fh-fund-btn" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Tambah Dana
      </button>
    </div>

    <!-- Inline edit Target Dana Pernikahan -->
    <div v-if="editingTarget" class="fh-edit-overlay" @click.self="editingTarget = false">
      <div class="fh-edit-card">
        <label>Target Dana Pernikahan</label>
        <div class="cur-wrap"><span class="cur-rp">Rp</span>
          <input class="cur" type="text" inputmode="numeric" ref="targetInputEl" :value="grp(targetDraft)" @input="onTargetInput" @keyup.enter="saveTarget">
        </div>
        <div class="fh-edit-actions">
          <button class="btn btn-ghost" @click="editingTarget = false">Batal</button>
          <button class="btn" @click="saveTarget">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Metric kecil — info pendukung dari Budget, sengaja kecil & sekunder -->
    <div class="card fh-metrics">
      <div class="fh-metric">
        <div class="fh-metric-val">{{ fmt(store.targetBudget) }}</div>
        <div class="fh-metric-lbl">Target Dana Pernikahan</div>
      </div>
      <div class="fh-metric">
        <div class="fh-metric-val">{{ fmt(totalAktual) }}</div>
        <div class="fh-metric-lbl">Total Biaya Saat Ini</div>
      </div>
      <div class="fh-metric">
        <div class="fh-metric-val">{{ fmt(totalBelumDibayar) }}</div>
        <div class="fh-metric-lbl">Tagihan Tersisa</div>
      </div>
      <div class="fh-metric">
        <div class="fh-metric-val" :class="{ 'fh-rose': sisaBudget < 0 }">{{ fmt(Math.abs(sisaBudget)) }}</div>
        <div class="fh-metric-lbl">{{ sisaBudget < 0 ? 'Melebihi Anggaran' : 'Sisa Anggaran' }}</div>
      </div>
    </div>

    <!-- Insight -->
    <div class="fh-callout" :class="'fh-tone-' + insight.tone">
      <span class="fh-callout-ico">{{ insight.icon }}</span>
      <div class="fh-callout-body">
        <div v-for="(l, i) in insight.lines" :key="i" class="fh-callout-line">{{ l }}</div>
      </div>
    </div>

    <!-- Riwayat transaksi -->
    <div class="fh-history">
      <div class="fh-section-title">Riwayat Transaksi</div>
      <div class="fh-filters">
        <button v-for="c in JENIS_CHIPS" :key="c.f" class="fchip" :class="{ on: jenisFilter === c.f }" @click="jenisFilter = c.f">{{ c.label }}</button>
        <select class="filter" v-model="kategoriFilter">
          <option value="">Semua Kategori</option>
          <option v-for="k in availableKategori" :key="k" :value="k">{{ k }}</option>
        </select>
        <select class="filter" v-model="bulanFilter">
          <option value="">Semua Bulan</option>
          <option v-for="m in availableBulan" :key="m.key" :value="m.key">{{ m.label }}</option>
        </select>
      </div>

      <!-- Mobile: kartu -->
      <div v-if="isMobile" class="card fh-list-card">
        <MobileFinanceList :rows="visRows" @open="openEdit" />
      </div>

      <!-- PC: list ala mobile banking -->
      <div v-else class="card fh-list-card">
        <div class="fh-list">
          <div v-if="!visRows.length" class="empty">
            <div class="big">Belum ada transaksi</div>
            <div>{{ store.fund.length ? 'Tidak ada transaksi pada filter ini.' : 'Klik Tambah Dana untuk mulai.' }}</div>
          </div>
          <button v-for="t in visRows" :key="t.id" class="fh-item" @click="openEdit(t.id)">
            <span class="fh-item-ico" :class="t.jenis">{{ t.jenis === 'masuk' ? '⬇' : '⬆' }}</span>
            <div class="fh-item-body">
              <div class="fh-item-title">{{ itemTitle(t) }}</div>
              <div class="fh-item-sub">
                <span v-if="itemBadge(t)" class="fh-item-badge" :class="t.jenis">{{ itemBadge(t) }}</span>
                <span>{{ relDate(t.tanggal) }}</span>
                <span v-if="t.budgetPaymentId" class="fh-linked" title="Transaksi ini dibuat otomatis dari pembayaran di tab Budget">🔗 Dari Budget</span>
              </div>
            </div>
            <div class="fh-item-amt" :class="t.jenis">{{ t.jenis === 'masuk' ? '+' : '−' }} {{ fmt(t.nominal) }}</div>
          </button>
        </div>
      </div>
    </div>

    <FinanceTransactionModal :show="modalShow" :tx-id="modalTxId" @close="modalShow = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { fmt, fmtDate, grp, num, daysLeft } from '../utils/index'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileFinanceList from '../mobile layout/MobileFinanceList.vue'
import FinanceTransactionModal from '../components/modals/FinanceTransactionModal.vue'
import TourBtn from '../components/TourBtn.vue'

const store    = useWeddingStore()
const isMobile = useIsMobile()

const FINANCE_STEPS = computed(() => [
  {
    selector: '#panel-keuangan .fh-hero',
    icon: '💰',
    title: 'Wedding Fund',
    desc: 'Saldo tabungan nikahmu saat ini, progress menuju Target Dana Pernikahan, dan status otomatis (Aman / Perlu Menabung / Melebihi Anggaran). Ketuk "🎯 Target Dana Pernikahan" buat mengubahnya, atau "Tambah Dana" buat catat dana masuk/keluar manual.',
  },
  {
    selector: '#panel-keuangan .fh-metrics',
    icon: '📊',
    title: 'Info Biaya Pendukung',
    desc: 'Angka dari tab Budget — Target, Total Biaya, Tagihan Tersisa, dan Sisa/Kelebihan Anggaran — sekilas pandang tanpa perlu pindah tab.',
  },
  {
    selector: '#panel-keuangan .fh-filters',
    icon: '📜',
    title: 'Riwayat Transaksi',
    desc: 'Semua transaksi Wedding Fund, bisa difilter per jenis, kategori, atau bulan. Transaksi berlabel 🔗 Dari Budget dibuat otomatis waktu kamu bayar termin di tab Budget menggunakan Wedding Fund — nggak bisa diedit dari sini, ubah lewat Budget.',
  },
])

// ── Info biaya pendukung (dari tab Budget, bukan fokus utama) ───────────
const totalAktual       = computed(() => store.budget.reduce((s, b) => s + (b.aktual || 0), 0))
const totalBelumDibayar = computed(() => store.budget.reduce((s, b) => s + store.bSisa(b), 0))
const sisaBudget        = computed(() => (store.targetBudget || 0) - totalAktual.value)

// ── Wedding Fund: saldo & progress terhadap Target Dana Pernikahan ──────
const progressPct        = computed(() => store.targetBudget > 0 ? Math.round(store.fundSaldo / store.targetBudget * 100) : 0)
const progressPctClamped = computed(() => Math.min(Math.max(progressPct.value, 0), 100))
const sisaKumpul         = computed(() => Math.max((store.targetBudget || 0) - store.fundSaldo, 0))

// Status dinamis di Hero — 3 kondisi nyata dicek berurutan dari yang
// paling genting: (1) biaya udah kelewat target sama sekali, (2) tabungan
// belum cukup nutup tagihan yang jatuh tempo sekarang, (3) tabungan aman
// buat tagihan saat ini tapi masih perlu nabung buat capai target penuh.
const fundStatus = computed(() => {
  const target = store.targetBudget || 0
  const saldo  = store.fundSaldo
  if (target <= 0) {
    return { key: 'kosong', icon: '⚪', text: 'Isi Target Dana Pernikahan dulu (ketuk 🎯 Target Dana Pernikahan) biar status tabungan bisa dihitung.' }
  }
  if (totalAktual.value > target) {
    return { key: 'over', icon: '🔴', text: 'Biaya pernikahan saat ini sudah melebihi target anggaran.' }
  }
  if (saldo >= totalBelumDibayar.value) {
    return { key: 'aman', icon: '🟢', text: 'Tabunganmu sudah cukup untuk membayar seluruh tagihan saat ini.' }
  }
  return { key: 'waspada', icon: '🟡', text: `Masih perlu menabung ${fmt(sisaKumpul.value)} agar target dana pernikahan tercapai.` }
})

// ── Insight — saran nabung per bulan biar "Masih Perlu Ditabung" lunas sebelum Hari H ──
const insight = computed(() => {
  const kurang = sisaKumpul.value
  if (kurang <= 0) {
    return {
      icon: '🟢', tone: 'good',
      lines: [(store.targetBudget || 0) > 0 ? 'Wedding Fund sudah mencapai Target Dana Pernikahan. Kerja bagus!' : 'Isi Target Dana Pernikahan dulu biar insight bisa dihitung.'],
    }
  }
  const tgl = store.couple?.tanggal
  if (tgl) {
    const days = daysLeft(tgl)
    if (days > 0) {
      const months = Math.max(1, Math.ceil(days / 30))
      return { icon: '💡', tone: 'info', lines: [`Dengan menabung sekitar ${fmt(Math.ceil(kurang / months))} setiap bulan, target dana pernikahan dapat tercapai sebelum Hari H.`] }
    }
  }
  return { icon: '💡', tone: 'info', lines: [`Masih membutuhkan ${fmt(kurang)} lagi untuk mencapai Target Dana Pernikahan.`] }
})

// ── Count-up halus buat saldo & persen di Hero — cuma animasi pas
// NILAINYA berubah (mis. abis tambah transaksi), bukan tiap tab dibuka. ──
function useCountUp(getter) {
  const display = ref(0)
  let raf = null, started = false
  watch(getter, val => {
    const target = val || 0
    if (!started) { display.value = target; started = true; return }
    cancelAnimationFrame(raf)
    const start = display.value
    const t0 = performance.now()
    const DUR = 500
    const tick = now => {
      const p = Math.min((now - t0) / DUR, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      display.value = Math.round(start + (target - start) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }, { immediate: true })
  return display
}

const animSaldo = useCountUp(() => store.fundSaldo)
const animPct   = useCountUp(() => progressPct.value)

// ── Inline edit Target Dana Pernikahan ──
const editingTarget = ref(false)
const targetDraft   = ref(0)
const targetInputEl = ref(null)

function startEditTarget() {
  targetDraft.value = store.targetBudget || 0
  editingTarget.value = true
  nextTick(() => targetInputEl.value?.focus())
}

function onTargetInput(e) {
  const len = e.target.value.length, start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  targetDraft.value = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
}

function saveTarget() {
  store.targetBudget = targetDraft.value
  store.saveSettings()
  editingTarget.value = false
}

// ── Modal add/edit transaksi ──
const modalShow = ref(false)
const modalTxId = ref(null)
function openAdd()  { modalTxId.value = null; modalShow.value = true }
function openEdit(id) { modalTxId.value = id; modalShow.value = true }

// ── Riwayat: judul spesifik (catatan) jadi fokus, kategori jadi badge kecil ──
function itemTitle(t) {
  return (t.catatan && t.catatan.trim()) || t.kategori || (t.jenis === 'masuk' ? 'Dana Masuk' : 'Dana Keluar')
}
function itemBadge(t) {
  return (t.kategori && t.kategori !== itemTitle(t)) ? t.kategori : ''
}

function relDate(dateStr) {
  if (!dateStr) return '—'
  const d = daysLeft(dateStr)
  if (d === 0) return 'Hari ini'
  if (d === -1) return 'Kemarin'
  return fmtDate(dateStr)
}

const jenisFilter    = ref('all')
const kategoriFilter = ref('')
const bulanFilter    = ref('')

const JENIS_CHIPS = [
  { f: 'all',    label: 'Semua' },
  { f: 'masuk',  label: 'Masuk' },
  { f: 'keluar', label: 'Keluar' },
]

const availableKategori = computed(() => [...new Set(store.fund.map(t => t.kategori).filter(Boolean))].sort())

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const availableBulan = computed(() => {
  const map = new Map()
  store.fund.forEach(t => {
    if (!t.tanggal) return
    const key = t.tanggal.slice(0, 7)
    if (!map.has(key)) {
      const [y, m] = key.split('-')
      map.set(key, `${MONTHS_ID[parseInt(m) - 1]} ${y}`)
    }
  })
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, label]) => ({ key, label }))
})

const visRows = computed(() =>
  store.fund
    .filter(t => jenisFilter.value === 'all' || t.jenis === jenisFilter.value)
    .filter(t => !kategoriFilter.value || t.kategori === kategoriFilter.value)
    .filter(t => !bulanFilter.value || (t.tanggal || '').startsWith(bulanFilter.value))
    .slice()
    .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '') || (b.id || 0) - (a.id || 0))
)
</script>

<style scoped>
.fh-rose { color: var(--rose) !important; }

/* ── Hero — satu-satunya card besar di halaman ── */
.fh-hero {
  position: relative;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 30px 28px 26px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05), 0 16px 40px rgba(36,8,8,.07);
}
.fh-tour { position: absolute; top: 20px; right: 20px; }

.fh-hero-eyebrow { font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 18px; }

.fh-hero-balance { margin-bottom: 22px; }
.fh-hero-balance-lbl { font-size: 12.5px; color: var(--muted); margin-bottom: 4px; }
.fh-hero-balance-val { font-family: 'Cormorant Garamond', serif; font-size: clamp(38px, 6vw, 52px); font-weight: 600; color: var(--plum); line-height: 1; font-variant-numeric: tabular-nums; }

.fh-hero-progress { margin-bottom: 20px; }
.fh-hero-bar { height: 9px; background: var(--ivory); border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
.fh-hero-bar-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--wine)); border-radius: 100px; transition: width .6s cubic-bezier(.22,1,.36,1); }
.fh-hero-pct-row { display: flex; align-items: baseline; gap: 7px; }
.fh-hero-pct { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 700; color: var(--ink); }
.fh-hero-pct-lbl { font-size: 12.5px; color: var(--muted); }

.fh-hero-stats { display: flex; gap: 26px; flex-wrap: wrap; padding-top: 18px; border-top: 1px solid var(--line); margin-bottom: 16px; }
.fh-hero-stat { flex: 1; min-width: 130px; }
.fh-hero-stat-lbl { display: flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.fh-hero-stat-val { font-family: 'Jost', sans-serif; font-size: 16px; font-weight: 700; color: var(--ink); margin-top: 4px; font-variant-numeric: tabular-nums; }
.fh-hero-stat-target { cursor: pointer; border-radius: 10px; margin: -6px; padding: 6px; transition: background .15s; }
.fh-hero-stat-target:hover { background: var(--ivory); }

.fh-hero-status {
  display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 500; line-height: 1.5;
  padding: 11px 14px; border-radius: 12px; margin-bottom: 18px;
}
.st-aman    { background: #EAF3DE; color: #2b5010; }
.st-waspada { background: var(--gold-soft); color: #7a5c28; }
.st-over    { background: var(--rose-soft); color: #7a1a1a; }
.st-kosong  { background: var(--ivory); color: var(--muted); }

.fh-fund-btn {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 13px; border-radius: 100px; border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--plum), var(--wine)); color: #fff;
  font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 600;
  box-shadow: 0 8px 20px rgba(110,21,26,.24);
  transition: filter .15s, transform .15s;
}
.fh-fund-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* Inline edit Target Dana Pernikahan overlay */
.fh-edit-overlay {
  position: fixed; inset: 0; background: rgba(42,27,38,.45); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 150;
}
.fh-edit-card {
  background: var(--paper); border-radius: 18px; padding: 22px; width: 100%; max-width: 340px;
  box-shadow: 0 20px 60px rgba(36,8,8,.3);
}
.fh-edit-card label { display: block; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin-bottom: 9px; }
.fh-edit-actions { display: flex; gap: 10px; margin-top: 16px; }

/* ── Metric kecil — info Budget pendukung, sengaja kecil ── */
.fh-metrics { display: flex; flex-wrap: wrap; gap: 18px 26px; margin-bottom: 20px; padding: 18px 20px; opacity: .92; }
.fh-metric { flex: 1; min-width: 110px; }
.fh-metric-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; opacity: .8; }
.fh-metric-val { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 600; color: var(--ink); margin-top: 4px; font-variant-numeric: tabular-nums; }

/* ── Insight callout ── */
.fh-callout { display: flex; gap: 12px; padding: 14px 16px; border-radius: 16px; margin-bottom: 22px; }
.fh-tone-info { background: var(--gold-soft); }
.fh-tone-good { background: #EAF3DE; }
.fh-callout-ico { font-size: 17px; flex-shrink: 0; line-height: 1.5; }
.fh-callout-body { flex: 1; min-width: 0; }
.fh-callout-line { font-size: 13.5px; line-height: 1.6; }
.fh-callout-line + .fh-callout-line { margin-top: 4px; }
.fh-tone-info .fh-callout-line { color: #6b4f1f; }
.fh-tone-good .fh-callout-line { color: #2b5010; }

/* ── Riwayat ── */
.fh-section-title { font-family: 'Jost', sans-serif; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--plum); margin-bottom: 12px; }

.fh-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }

.fh-list-card { padding: 6px 20px; overflow: hidden; }

.fh-list { display: flex; flex-direction: column; }
.fh-item {
  display: flex; align-items: center; gap: 14px; width: 100%;
  margin: 0 -20px; padding: 13px 20px; background: transparent; border: none; border-bottom: 1px solid var(--line);
  text-align: left; cursor: pointer; font-family: inherit; transition: background .15s, transform .1s;
}
.fh-item:last-child { border-bottom: none; }
.fh-item:hover { background: var(--ivory); transform: translateY(-1px); }

.fh-item-ico {
  flex: none; width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
}
.fh-item-ico.masuk  { background: #EAF3DE; color: #2b5010; }
.fh-item-ico.keluar { background: var(--rose-soft); color: #7a1a1a; }

.fh-item-body { flex: 1; min-width: 0; }
.fh-item-title { font-family: 'Jost', sans-serif; font-size: 14.5px; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fh-item-sub { display: flex; align-items: center; gap: 7px; margin-top: 5px; font-size: 12px; color: var(--muted); }
.fh-item-badge { display: inline-block; flex: none; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 100px; }
.fh-item-badge.masuk  { background: #EAF3DE; color: #2b5010; }
.fh-item-badge.keluar { background: var(--rose-soft); color: #7a1a1a; }
.fh-linked {
  flex: none; display: inline-block; font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 100px; background: var(--gold-soft); color: #7a5c28; white-space: nowrap;
}

.fh-item-amt { flex: none; font-size: 15.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
.fh-item-amt.masuk  { color: #2b5010; }
.fh-item-amt.keluar { color: var(--wine); }

@media (max-width: 680px) {
  .fh-hero { padding: 24px 20px 20px; border-radius: 22px; }
  .fh-metrics { padding: 16px; }
  .fh-metric { flex: 0 0 calc(50% - 13px); }
  .fh-list-card { padding: 4px 14px; }
  .fh-item { margin: 0 -14px; padding: 13px 14px; }
}
</style>
