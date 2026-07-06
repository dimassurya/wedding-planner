<template>
  <div class="apc-overlay" @click.self="$emit('close')">
    <div class="apc-card">

      <!-- ── Hero ── -->
      <div class="apc-hero">
        <button class="apc-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>

        <!-- Dekorasi hati kecil -->
        <svg class="apc-dh apc-dh1" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>
        <svg class="apc-dh apc-dh2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>
        <svg class="apc-dh apc-dh3" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>
        <svg class="apc-dh apc-dh4" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>

        <!-- Hati utama -->
        <div class="apc-heart-wrap">
          <svg viewBox="0 0 100 90" width="72" height="66" overflow="visible">
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="60%" y2="100%">
                <stop offset="0%" stop-color="#E8BA78"/>
                <stop offset="100%" stop-color="#B8874A"/>
              </linearGradient>
            </defs>
            <path d="M50,82 C50,82 6,50 6,24 C6,10 17,4 28,4 C38,4 45,10 50,20 C55,10 62,4 72,4 C83,4 94,10 94,24 C94,50 50,82 50,82Z" fill="url(#hg)"/>
          </svg>
        </div>

        <h2 class="apc-title">
          {{ store.isPartner ? 'Dashboard Bersama' : store.partnerEmail ? 'Pasangan Aktif' : 'Undang Pasanganmu' }}
        </h2>
        <p class="apc-sub">
          {{ store.isPartner ? 'Kamu mengakses data bersama' : store.partnerEmail ? store.partnerEmail : 'Rencanakan pernikahan bersama' }}
        </p>

        <!-- Garis ornamen -->
        <div class="apc-divider">
          <span class="apc-divider-line"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#CD9F65" opacity=".7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span class="apc-divider-line"></span>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="apc-body">

        <!-- Partner melihat status -->
        <template v-if="store.isPartner">
          <p class="apc-note">Kamu sedang melihat dan mengedit data pernikahan bersama pasangan. Semua perubahan langsung tersinkronisasi.</p>
          <button class="apc-btn danger" @click="onLeave">Keluar dari Dashboard Bersama</button>
        </template>

        <!-- Owner: sudah ada pasangan -->
        <template v-else-if="store.partnerEmail">
          <p class="apc-note">{{ store.partnerEmail }} sudah bergabung dan bisa mengedit semua data bersama kamu.</p>
          <button class="apc-btn danger" @click="onRemove">Hapus Pasangan</button>
        </template>

        <!-- Owner: ada invite pending -->
        <template v-else-if="pendingInvite">
          <p class="apc-note pending">Undangan sudah dikirim ke <strong>{{ pendingInvite.partner_email }}</strong>. Menunggu mereka klik link di email.</p>
          <button class="apc-btn gold" @click="onResend">Kirim Ulang Undangan</button>
          <button class="apc-btn ghost" @click="onCancelInvite">Batalkan Undangan</button>
        </template>

        <!-- Owner: form undang -->
        <template v-else>
          <p class="apc-note">Masukkan email pasanganmu. Mereka akan menerima undangan untuk bergabung dan bisa mengedit semua data bersama.</p>
          <input
            v-model="email"
            type="email"
            class="apc-input"
            placeholder="email@pasangan.com"
            @keydown.enter="onSend"
          />
          <button class="apc-btn gold" :disabled="!email.trim() || sending" @click="onSend">
            {{ sending ? 'Menyiapkan...' : 'Kirim Undangan' }}
          </button>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['close'])
const store = useWeddingStore()

const email         = ref('')
const sending       = ref(false)
const pendingInvite = ref(null)

onMounted(async () => {
  if (!store.isPartner && !store.partnerEmail) {
    const { data } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('owner_user_id', store.user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    pendingInvite.value = data || null
  }
})

async function onSend() {
  if (!email.value.trim() || sending.value) return
  sending.value = true
  try {
    const token = await store.sendPartnerInvite(email.value.trim())
    const link    = `${window.location.origin}/?invite=${token}`
    const subject = encodeURIComponent('Undangan Wedding Planner – Soulmate')
    const body    = encodeURIComponent(
      `Halo!\n\nKamu diundang untuk merencanakan pernikahan bersama di Soulmate Planner.\n\n` +
      `Klik link berikut untuk bergabung:\n${link}\n\nLink berlaku selama 7 hari.`
    )
    window.open(`mailto:${email.value.trim()}?subject=${subject}&body=${body}`)
    store.toast('Undangan siap dikirim lewat email 📧')
    emit('close')
  } catch (e) {
    store.toast(e.message || 'Gagal membuat undangan')
  } finally {
    sending.value = false
  }
}

async function onResend() {
  if (!pendingInvite.value) return
  const link    = `${window.location.origin}/?invite=${pendingInvite.value.token}`
  const subject = encodeURIComponent('Undangan Wedding Planner – Soulmate')
  const body    = encodeURIComponent(
    `Halo!\n\nKamu diundang untuk merencanakan pernikahan bersama di Soulmate Planner.\n\n` +
    `Klik link berikut untuk bergabung:\n${link}\n\nLink berlaku selama 7 hari.`
  )
  window.open(`mailto:${pendingInvite.value.partner_email}?subject=${subject}&body=${body}`)
  store.toast('Email dibuka ulang 📧')
  emit('close')
}

async function onCancelInvite() {
  if (!pendingInvite.value) return
  await store.cancelPartnerInvite(pendingInvite.value.id)
  pendingInvite.value = null
  store.toast('Undangan dibatalkan')
}

async function onRemove() {
  const ok = await store.askConfirm({
    title: 'Hapus pasangan?',
    message: `${store.partnerEmail} tidak akan bisa mengakses dashboard ini lagi.`,
    confirmLabel: 'Hapus',
  })
  if (!ok) return
  await store.removePartner()
  emit('close')
}

async function onLeave() {
  const ok = await store.askConfirm({
    title: 'Keluar dari dashboard bersama?',
    message: 'Kamu akan kembali ke dashboardmu sendiri yang kosong.',
    confirmLabel: 'Keluar',
  })
  if (!ok) return
  await store.leavePartnership()
  emit('close')
}
</script>

<style scoped>
.apc-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(36, 8, 8, .55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.apc-card {
  width: 100%;
  max-width: 480px;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  animation: apc-up .3s cubic-bezier(.22,1,.36,1);
}
@keyframes apc-up {
  from { transform: translateY(60px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ── Hero ── */
.apc-hero {
  position: relative;
  background: linear-gradient(160deg, #6E151A 0%, #3a0808 50%, #240808 100%);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.apc-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(205,159,101,.3);
  color: rgba(205,159,101,.8);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background .15s;
}
.apc-close:active { background: rgba(255,255,255,.2); }

/* Hati dekorasi kecil */
.apc-dh {
  position: absolute;
  color: #CD9F65;
  opacity: .15;
}
.apc-dh1 { width: 32px; top: 12px; left: 18px;   opacity: .12; transform: rotate(-20deg); }
.apc-dh2 { width: 20px; top: 8px;  left: 58px;   opacity: .08; transform: rotate(15deg); }
.apc-dh3 { width: 28px; bottom: 28px; right: 20px; opacity: .12; transform: rotate(20deg); }
.apc-dh4 { width: 16px; top: 20px; right: 56px;  opacity: .08; transform: rotate(-10deg); }

/* Hati utama */
.apc-heart-wrap {
  filter: drop-shadow(0 4px 20px rgba(205,159,101,.5));
  margin-bottom: 4px;
}

.apc-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  font-weight: 600;
  color: #E8BA78;
  letter-spacing: .02em;
  text-align: center;
}
.apc-sub {
  font-size: 13px;
  color: rgba(232,186,120,.6);
  letter-spacing: .04em;
  text-align: center;
}

.apc-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  width: 180px;
}
.apc-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(205,159,101,.5), transparent);
}

/* ── Body ── */
.apc-body {
  background: #FFFEF9;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.apc-note {
  font-size: 14px;
  color: #9C7575;
  line-height: 1.6;
}
.apc-note strong { color: #6E151A; }
.apc-note.pending { color: #7a5c28; }

.apc-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #DDD0C4;
  border-radius: 12px;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  color: #240808;
  background: #FFFEF9;
  box-sizing: border-box;
  outline: none;
  transition: border-color .2s;
}
.apc-input:focus { border-color: #CD9F65; box-shadow: 0 0 0 3px rgba(205,159,101,.15); }

.apc-btn {
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity .15s, transform .1s;
  letter-spacing: .02em;
}
.apc-btn:active { transform: scale(.98); }
.apc-btn:disabled { opacity: .45; }

.apc-btn.gold {
  background: linear-gradient(135deg, #CD9F65, #B8874A);
  color: #fff;
  box-shadow: 0 4px 16px rgba(205,159,101,.35);
}
.apc-btn.ghost {
  background: transparent;
  color: #9C7575;
  border: 1.5px solid #DDD0C4;
}
.apc-btn.danger {
  background: #fdf0f0;
  color: #B32E33;
  border: 1.5px solid #f5d0d0;
}
</style>
