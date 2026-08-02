<template>
  <div class="overlay show" @click.self="$emit('close')">
    <div class="modal pf-modal">
      <button class="pf-x" aria-label="Tutup" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <h3>Profil &amp; Informasi</h3>
      <div class="sub">Data dasar pernikahan kalian. Semua perubahan tersimpan otomatis.</div>

      <!-- ══ Akun ══ -->
      <div class="pf-account">
        <img v-if="avatar" :src="avatar" class="pf-avatar" :alt="accountName">
        <span v-else class="pf-avatar pf-avatar-initial">{{ accountName?.[0]?.toUpperCase() || '?' }}</span>
        <div class="pf-account-main">
          <div class="pf-account-name">{{ accountName }}</div>
          <div class="pf-account-mail">{{ store.user?.email }}</div>
        </div>
        <span class="pf-role" :class="store.isPartner ? 'is-partner' : 'is-owner'">
          {{ store.isPartner ? 'Pasangan' : 'Pemilik' }}
        </span>
      </div>

      <!-- ══ Profil pasangan ══ -->
      <div class="pf-sec">Profil Pasangan</div>
      <div class="row2">
        <div class="field">
          <label>Pengantin Pria</label>
          <input type="text" :value="store.couple?.pria" placeholder="Nama lengkap" @input="e => setCouple('pria', e.target.value)">
        </div>
        <div class="field">
          <label>Pengantin Wanita</label>
          <input type="text" :value="store.couple?.wanita" placeholder="Nama lengkap" @input="e => setCouple('wanita', e.target.value)">
        </div>
      </div>

      <!-- ══ Jadwal acara ══ -->
      <div class="pf-sec">Jadwal Acara</div>
      <div class="pf-events">
        <label v-for="ev in EVENT_FIELDS" :key="ev.key" class="pf-ev" :class="{ 'is-hh': ev.key === 'tanggal' }">
          <span class="pf-ev-lbl">{{ ev.icon }} {{ ev.label }}</span>
          <input class="pf-ev-date" type="date" :value="store.couple?.[ev.key] || ''" @change="e => setCouple(ev.key, e.target.value)">
          <span class="pf-ev-sub">{{ eventRel(ev.key) }}</span>
        </label>
      </div>

      <div class="row2">
        <div class="field">
          <label>Jam Mulai</label>
          <input type="time" :value="store.couple?.jamMulai" @change="e => setCouple('jamMulai', e.target.value)">
        </div>
        <div class="field">
          <label>Jam Selesai</label>
          <input type="time" :value="store.couple?.jamSelesai" @change="e => setCouple('jamSelesai', e.target.value)">
        </div>
      </div>
      <div class="pf-hint">Tanggal yang diisi otomatis muncul di tab Timeline.</div>

      <!-- ══ Status aplikasi ══ -->
      <div class="pf-sec">Status Aplikasi</div>
      <div class="pf-pay" :class="'tone-' + pay.tone">
        <div class="pf-pay-top">
          <span class="pf-pay-ico">{{ pay.icon }}</span>
          <span class="pf-pay-badge">{{ pay.badge }}</span>
        </div>
        <div class="pf-pay-desc">{{ pay.desc }}</div>
        <div v-if="pay.meta" class="pf-pay-meta">{{ pay.meta }}</div>
        <button v-if="pay.canPay" class="pf-pay-btn" @click="goPay">Bayar Sekarang</button>
      </div>

      <!-- ══ Dashboard bersama ══ -->
      <div class="pf-sec">Dashboard Bersama</div>
      <button class="pf-row" @click="showPartner = true">
        <span class="pf-row-ico">💑</span>
        <span class="pf-row-main">
          <span class="pf-row-title">{{ store.isPartner ? 'Kamu bergabung sebagai pasangan' : store.partnerEmail ? 'Pasangan aktif' : 'Belum ada pasangan' }}</span>
          <span class="pf-row-sub">{{ store.isPartner ? `Diundang oleh ${store.ownerEmail || 'pemilik dashboard'}` : store.partnerEmail || 'Undang pasanganmu buat isi data bareng' }}</span>
        </span>
        <svg class="pf-row-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div class="modal-actions pf-actions">
        <button class="btn btn-ghost pf-signout" @click="store.signOut()">Keluar Akun</button>
        <button class="btn" @click="$emit('close')">Selesai</button>
      </div>

      <AddPartnerCard v-if="showPartner" @close="showPartner = false" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { fmtDate, daysLeft } from '../../utils/index'
import { MAIN_EVENTS } from '../../data/constants'
import AddPartnerCard from '../AddPartnerCard.vue'

const emit  = defineEmits(['close'])
const store = useWeddingStore()

const showPartner = ref(false)

const avatar      = computed(() => store.user?.user_metadata?.avatar_url)
const accountName = computed(() =>
  store.user?.user_metadata?.full_name || store.user?.email?.split('@')[0] || ''
)

// Tanggal acara nebeng di profil pasangan (`couple`) — ini rumah datanya,
// tab Timeline cuma baca. Hari-H ikut di sini biar bisa diubah setelah
// onboarding (sebelumnya cuma bisa diisi sekali pas onboarding).
const EVENT_FIELDS = [
  ...MAIN_EVENTS,
  { key: 'tanggal', label: 'Hari Pernikahan', icon: '❤️' },
]

function setCouple(key, val) {
  store.couple = { ...store.couple, [key]: val || '' }
  store.saveSettings()
}

function eventRel(key) {
  const date = store.couple?.[key]
  if (!date) return 'Belum diisi'
  const d = daysLeft(date)
  if (d === 0) return 'Hari ini'
  return d > 0 ? `${d} hari lagi` : `${Math.abs(d)} hari lalu`
}

// Status pembayaran. Kalau penguncian pembayaran masih dimatikan
// (VITE_PAYMENT_ENABLED != true), jangan tampilkan sisa trial atau tombol
// bayar — semua orang memang punya akses penuh, nakut-nakutin user dengan
// hitungan mundur yang nggak berlaku cuma bikin bingung.
const pay = computed(() => {
  const paidAt = store.profile?.paid_at
  if (store.isPaid) {
    return {
      tone: 'good', icon: '✅', badge: 'Lunas',
      desc: 'Akses penuh selamanya. Terima kasih sudah mendukung!',
      meta: paidAt ? `Dibayar ${fmtDate(String(paidAt).slice(0, 10))}` : '',
      canPay: false,
    }
  }
  if (!store.paymentEnabled) {
    return {
      tone: 'good', icon: '🎁', badge: 'Akses Penuh',
      desc: 'Semua fitur terbuka dan belum ada pembayaran yang diperlukan.',
      meta: '', canPay: false,
    }
  }
  if (store.trialExpired) {
    return {
      tone: 'bad', icon: '🔒', badge: 'Masa Coba Berakhir',
      desc: 'Lanjutkan dengan sekali bayar untuk membuka kembali semua data & fitur.',
      meta: '', canPay: true,
    }
  }
  const sisa = store.trialDaysLeft
  return {
    tone: 'warn', icon: '⏳', badge: 'Masa Coba',
    desc: sisa === null
      ? 'Masa coba gratis sedang berjalan.'
      : `Sisa ${sisa} hari masa coba gratis. Bayar kapan saja biar aksesnya nggak terputus.`,
    meta: store.profile?.trial_ends_at
      ? `Berakhir ${fmtDate(String(store.profile.trial_ends_at).slice(0, 10))}`
      : '',
    canPay: true,
  }
})

function goPay() {
  store.forcePaywall = true
  emit('close')
}
</script>

<style scoped>
.pf-modal { position: relative; max-width: 520px; }
.pf-x {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--muted);
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.pf-x:hover { background: var(--ivory); color: var(--plum); border-color: var(--gold); }

/* ── Akun ── */
.pf-account {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--ivory);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 4px;
}
.pf-avatar {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--line);
}
.pf-avatar-initial {
  display: grid;
  place-items: center;
  background: var(--plum);
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}
.pf-account-main { flex: 1; min-width: 0; }
.pf-account-name {
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf-account-mail {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf-role {
  flex: none;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .03em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 100px;
}
.pf-role.is-owner   { color: #7a5c28; background: var(--gold-soft); }
.pf-role.is-partner { color: var(--teal); background: var(--teal-soft); }

/* ── Judul section ── */
.pf-sec {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 22px 0 12px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--line);
}

/* ── Jadwal acara ── */
.pf-events {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.pf-ev {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  background: var(--ivory);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.pf-ev:hover { border-color: var(--gold); background: var(--paper); }
.pf-ev.is-hh { border-color: var(--gold); background: var(--gold-soft); }
.pf-ev-lbl {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .03em;
  text-transform: uppercase;
  color: var(--muted);
}
.pf-ev-date {
  width: 100%;
  font-family: 'Jost', sans-serif;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
}
.pf-ev-date:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }
.pf-ev-sub { font-size: 11px; color: var(--muted); }

.pf-hint { font-size: 11.5px; color: var(--muted); margin-top: -4px; }

/* ── Status pembayaran ── */
.pf-pay {
  padding: 14px 15px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--ivory);
}
.pf-pay.tone-good { border-color: #B8D8B0; background: #EAF3DE; }
.pf-pay.tone-warn { border-color: var(--gold); background: var(--gold-soft); }
.pf-pay.tone-bad  { border-color: var(--rose); background: var(--rose-soft); }
.pf-pay-top { display: flex; align-items: center; gap: 8px; }
.pf-pay-ico { font-size: 15px; }
.pf-pay-badge {
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.pf-pay-desc { font-size: 13px; color: var(--ink); line-height: 1.5; margin-top: 6px; }
.pf-pay-meta { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
.pf-pay-btn {
  margin-top: 11px;
  padding: 9px 16px;
  border: none;
  border-radius: 100px;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.pf-pay-btn:hover { background: var(--wine); }

/* ── Baris navigasi (dashboard bersama) ── */
.pf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--paper);
  text-align: left;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.pf-row:hover { background: var(--ivory); border-color: var(--gold); }
.pf-row-ico { flex: none; font-size: 18px; }
.pf-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pf-row-title { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 600; color: var(--ink); }
.pf-row-sub {
  font-size: 11.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf-row-arrow { flex: none; color: var(--muted); }

/* .btn global-nya width:100%, jadi tombol di baris ini WAJIB boleh menyusut
   (flex-shrink 1). Pakai `flex: none` bikin tombol kiri ngotot selebar
   modal & nendang tombol kanan keluar. */
.pf-actions { margin-top: 22px; }
.pf-actions .btn { width: auto; min-width: 0; white-space: nowrap; }
.pf-signout { flex: 0 1 auto; padding: 14px 18px; }
.pf-actions .btn:last-child { flex: 1 1 auto; }

@media (max-width: 560px) {
  .pf-events { grid-template-columns: 1fr; }
  .pf-modal { padding: 26px 20px; }
}
</style>
