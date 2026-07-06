<template>
  <div class="apc-overlay" @click.self="$emit('close')">
    <div class="apc-card">

      <div class="apc-head">
        <span>Pasangan</span>
        <button class="apc-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <!-- Partner melihat status mereka -->
      <template v-if="store.isPartner">
        <div class="apc-status">
          <div class="apc-icon">💑</div>
          <div class="apc-status-text">
            <div class="apc-status-label">Dashboard Bersama</div>
            <div class="apc-status-sub">Kamu sedang mengakses data bersama pasangan</div>
          </div>
        </div>
        <button class="apc-btn danger" @click="onLeave">Keluar dari Dashboard Bersama</button>
      </template>

      <!-- Owner: sudah ada pasangan -->
      <template v-else-if="store.partnerEmail">
        <div class="apc-status">
          <div class="apc-icon">💑</div>
          <div class="apc-status-text">
            <div class="apc-status-label">Pasangan Aktif</div>
            <div class="apc-status-sub">{{ store.partnerEmail }}</div>
          </div>
        </div>
        <button class="apc-btn danger" @click="onRemove">Hapus Pasangan</button>
      </template>

      <!-- Owner: ada invite pending -->
      <template v-else-if="pendingInvite">
        <div class="apc-status pending">
          <div class="apc-icon">⏳</div>
          <div class="apc-status-text">
            <div class="apc-status-label">Menunggu Konfirmasi</div>
            <div class="apc-status-sub">{{ pendingInvite.partner_email }}</div>
          </div>
        </div>
        <button class="apc-btn secondary" @click="onResend">Kirim Ulang Undangan</button>
        <button class="apc-btn danger" @click="onCancelInvite">Batalkan Undangan</button>
      </template>

      <!-- Owner: belum ada pasangan -->
      <template v-else>
        <p class="apc-desc">
          Masukkan email pasanganmu. Mereka akan mendapat undangan untuk bergabung dan bisa mengedit semua data bersama.
        </p>
        <input
          v-model="email"
          type="email"
          class="apc-input"
          placeholder="email@pasangan.com"
          @keydown.enter="onSend"
        />
        <button class="apc-btn primary" :disabled="!email.trim() || sending" @click="onSend">
          {{ sending ? 'Menyiapkan...' : 'Kirim Undangan' }}
        </button>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWeddingStore } from '../stores/wedding'

const emit = defineEmits(['close'])
const store = useWeddingStore()

const email       = ref('')
const sending     = ref(false)
const pendingInvite = ref(null)

onMounted(async () => {
  if (!store.isPartner && !store.partnerEmail) {
    const { data } = await import('../lib/supabase').then(m =>
      m.supabase.from('partner_invitations')
        .select('*')
        .eq('owner_user_id', store.user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
    pendingInvite.value = data || null
  }
})

async function onSend() {
  if (!email.value.trim() || sending.value) return
  sending.value = true
  try {
    const token = await store.sendPartnerInvite(email.value.trim())
    const link = `${window.location.origin}/?invite=${token}`
    const subject = encodeURIComponent('Undangan Wedding Planner - Soulmate')
    const body = encodeURIComponent(
      `Halo!\n\n` +
      `Kamu diundang untuk merencanakan pernikahan bersama di Soulmate Planner.\n\n` +
      `Klik link berikut untuk bergabung:\n${link}\n\n` +
      `Link berlaku selama 7 hari.`
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
  const link = `${window.location.origin}/?invite=${pendingInvite.value.token}`
  const subject = encodeURIComponent('Undangan Wedding Planner - Soulmate')
  const body = encodeURIComponent(
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
  background: rgba(36, 8, 8, .45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}
.apc-card {
  width: 100%;
  max-width: 480px;
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  padding: 8px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slide-up .25s ease;
}
@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.apc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 4px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--plum);
}
.apc-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
}
.apc-close:active { background: var(--gold-soft); }

.apc-status {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--ivory);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
}
.apc-status.pending { background: #FFF8EC; border-color: var(--gold-soft); }
.apc-icon { font-size: 28px; flex-shrink: 0; }
.apc-status-label { font-size: 14px; font-weight: 600; color: var(--plum); }
.apc-status-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }

.apc-desc {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.55;
  margin: 0;
}
.apc-input {
  width: 100%;
  padding: 13px 14px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  color: var(--ink);
  background: var(--paper);
  box-sizing: border-box;
  outline: none;
}
.apc-input:focus { border-color: var(--plum); }

.apc-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity .15s;
}
.apc-btn:disabled { opacity: .5; }
.apc-btn.primary   { background: var(--plum); color: #fff; }
.apc-btn.secondary { background: var(--ivory); color: var(--plum); border: 1.5px solid var(--line); }
.apc-btn.danger    { background: #fdf0f0; color: var(--rose); border: 1.5px solid #f5d0d0; }
.apc-btn:active { opacity: .8; }
</style>
