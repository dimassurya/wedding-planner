<template>
  <div class="pay-page">
    <div class="pay-card">
      <div class="pay-brand">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1" stroke-linejoin="round"/>
        </svg>
        <span>Wedding Planner</span>
      </div>

      <div v-if="store.user" class="pay-user">
        <img v-if="avatar" :src="avatar" class="pay-avatar" alt="avatar">
        <div class="pay-user-info">
          <div class="pay-user-name">{{ name }}</div>
          <div class="pay-user-email">{{ store.user.email }}</div>
        </div>
      </div>

      <div class="pay-divider"></div>

      <!-- ── State A: belum pernah onboarding — tawarkan trial ── -->
      <template v-if="!store.onboarded">
        <h2 class="pay-title">Coba Gratis 2 Hari</h2>
        <p class="pay-desc">Rasakan semua fitur dulu tanpa bayar. Setelah 2 hari, lanjutkan dengan sekali bayar untuk akses selamanya.</p>

        <ul class="pay-features">
          <li><Check/> Manajemen tamu & undangan</li>
          <li><Check/> Tracking budget & vendor lengkap</li>
          <li><Check/> Seserahan, mahar, administrasi, checklist</li>
          <li><Check/> Sync realtime antar device</li>
        </ul>

        <div class="pay-price">
          <span class="pay-amount">{{ fmt(PRICE) }}</span>
          <span class="pay-once">setelah trial, satu kali bayar</span>
        </div>

        <button class="pay-btn" @click="store.startOnboarding()">
          Mulai Trial 2 Hari
          <span class="pay-badge">Gratis, tanpa kartu</span>
        </button>
      </template>

      <!-- ── State B: sudah onboarding, trial habis & belum bayar ── -->
      <template v-else>
        <h2 class="pay-title">Trial Kamu Sudah Berakhir</h2>
        <p class="pay-desc">Masa coba gratis 2 hari sudah habis. Lanjutkan dengan sekali bayar untuk buka kembali akses ke semua data & fitur kamu.</p>

        <div class="pay-price">
          <span class="pay-amount">{{ fmt(PRICE) }}</span>
          <span class="pay-once">satu kali bayar, akses selamanya</span>
        </div>

        <!-- idle: tombol bayar -->
        <button v-if="payState === 'idle' || payState === 'error'" class="pay-btn" @click="payNow">
          Bayar Sekarang (QRIS)
        </button>
        <p v-if="payState === 'error'" class="pay-err">Gagal membuat transaksi. Coba lagi.</p>

        <!-- loading: bikin transaksi -->
        <div v-else-if="payState === 'loading'" class="pay-qr-wrap">
          <div class="pay-spinner"></div>
          <p class="pay-qr-hint">Menyiapkan pembayaran…</p>
        </div>

        <!-- qr: nunggu discan -->
        <div v-else-if="payState === 'qr'" class="pay-qr-wrap">
          <img :src="qrDataUrl" alt="QRIS" class="pay-qr-img">
          <p class="pay-qr-hint">Scan pakai aplikasi e-wallet / m-banking apa saja yang mendukung QRIS.</p>
          <div class="pay-qr-waiting"><span class="pay-dot"></span> Menunggu pembayaran…</div>
        </div>

        <!-- timeout: belum kekonfirmasi -->
        <div v-else-if="payState === 'timeout'" class="pay-qr-wrap">
          <p class="pay-qr-hint">Belum terdeteksi pembayaran. Kalau kamu sudah bayar, tunggu sebentar lalu cek lagi — atau buat transaksi baru.</p>
          <button class="pay-btn" @click="checkAgain">Cek Status Lagi</button>
          <button class="pay-signout" @click="payNow">Buat Transaksi Baru</button>
        </div>
      </template>

      <button class="pay-signout" @click="store.signOut()">Keluar akun</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, h } from 'vue'
import QRCode from 'qrcode'
import { useWeddingStore } from '../stores/wedding'
import { fmt } from '../utils/index'

const PRICE = 99000

const store  = useWeddingStore()
const avatar = computed(() => store.user?.user_metadata?.avatar_url)
const name   = computed(() => store.user?.user_metadata?.full_name || store.user?.email?.split('@')[0])

// Ikon centang kecil dipakai berulang di daftar fitur — komponen inline
// biar nggak perlu file terpisah cuma buat satu svg kecil.
const Check = () => h('svg', { viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M4 10l4.5 4.5L16 6', stroke: '#6E151A', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
])

const payState   = ref('idle') // idle | loading | qr | timeout | error
const qrDataUrl  = ref('')

async function payNow() {
  payState.value = 'loading'
  const data = await store.createPayment()
  if (!data) { payState.value = 'error'; return }

  try {
    qrDataUrl.value = data.qrImage
      ? `data:image/png;base64,${data.qrImage}`
      : await QRCode.toDataURL(data.qrString, { width: 260, margin: 1 })
  } catch (e) {
    console.error('[PaymentPage] gagal render QR:', e)
    payState.value = 'error'
    return
  }

  payState.value = 'qr'
  const paid = await store.pollUntilPaid()
  // Kalau paid, App.vue sudah otomatis pindah ke app utama (hasAccess jadi
  // true) sebelum baris ini sempat jalan — cuma relevan kalau timeout.
  if (!paid) payState.value = 'timeout'
}

async function checkAgain() {
  const paid = await store.pollUntilPaid({ timeoutMs: 15000 })
  if (!paid) store.toast('Masih belum terdeteksi. Coba beberapa saat lagi.')
}
</script>

<style scoped>
.pay-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ivory);
  padding: 24px;
}

.pay-card {
  background: var(--paper);
  border: 1px solid var(--gold-soft);
  border-top: 3px solid var(--gold);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 36px 36px 36px;
  width: 100%;
  max-width: 440px;
}

.pay-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--plum);
}

.pay-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--ivory);
  border-radius: 10px;
  margin-bottom: 4px;
}

.pay-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--line);
  flex-shrink: 0;
}

.pay-user-name   { font-weight: 600; font-size: .9rem; color: var(--plum); }
.pay-user-email  { font-size: .8rem; color: var(--muted); }

.pay-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  margin: 20px 0;
}

.pay-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--plum);
  margin: 0 0 8px;
}

.pay-desc {
  font-size: .9rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 20px;
}

.pay-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pay-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: .9rem;
  color: var(--ink);
}

.pay-features li svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  padding: 5px;
  background: var(--gold-soft);
  border: 1px solid rgba(205, 159, 101, .45);
  border-radius: 50%;
  box-sizing: border-box;
}

.pay-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: var(--gold-soft);
  border: 1px solid rgba(205, 159, 101, .5);
  border-radius: 14px;
}

.pay-amount {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--wine);
  letter-spacing: .01em;
}

.pay-once {
  font-size: .85rem;
  color: var(--muted);
}

.pay-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--plum), var(--wine));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
  box-shadow: 0 6px 18px rgba(110, 21, 26, .26);
  transition: filter .15s, transform .1s;
}
.pay-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

.pay-badge {
  font-size: .7rem;
  font-weight: 500;
  background: rgba(255,255,255,.25);
  padding: 2px 8px;
  border-radius: 20px;
}

.pay-err { font-size: .85rem; color: var(--rose); margin: -6px 0 12px; text-align: center; }

.pay-qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0 20px;
  text-align: center;
}

.pay-qr-img {
  width: 220px;
  height: 220px;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px;
  background: #fff;
}

.pay-qr-hint { font-size: .85rem; color: var(--muted); line-height: 1.5; margin: 0; }

.pay-qr-waiting {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .85rem;
  font-weight: 600;
  color: var(--plum);
}

.pay-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold);
  animation: pay-pulse 1.2s ease-in-out infinite;
}
@keyframes pay-pulse {
  0%, 100% { opacity: .3; transform: scale(.85); }
  50% { opacity: 1; transform: scale(1); }
}

.pay-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--gold-soft);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: pay-spin .8s linear infinite;
}
@keyframes pay-spin { to { transform: rotate(360deg); } }

.pay-signout {
  width: 100%;
  padding: 10px;
  background: none;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  font-size: .85rem;
  cursor: pointer;
  transition: border-color .15s, color .15s;
  margin-top: 4px;
}

.pay-signout:hover {
  border-color: var(--rose);
  color: var(--rose);
}

@media (max-width: 480px) {
  .pay-card { padding: 32px 20px 28px; }
}
</style>
