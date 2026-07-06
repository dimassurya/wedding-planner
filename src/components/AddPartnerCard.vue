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
          <p class="apc-note pending">Link undangan untuk <strong>{{ pendingInvite.partner_email }}</strong> — bagikan via WhatsApp atau salin.</p>
          <div class="apc-link-box">
            <span class="apc-link-text">{{ pendingLink }}</span>
            <button class="apc-copy" @click="onCopyPending" :title="copiedPending ? 'Tersalin!' : 'Salin'">
              <svg v-if="!copiedPending" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
          </div>
          <div class="apc-share-row">
            <button class="apc-btn gold" @click="onShareWAPending">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button class="apc-btn ghost" @click="onCancelInvite">Batalkan</button>
          </div>
        </template>

        <!-- Owner: form undang -->
        <template v-else>
          <p class="apc-note">Masukkan email pasanganmu, lalu bagikan link undangan via WhatsApp atau email.</p>
          <input
            v-model="email"
            type="email"
            class="apc-input"
            placeholder="email@pasangan.com"
            @keydown.enter="onGenerate"
          />

          <!-- Setelah link di-generate -->
          <template v-if="inviteLink">
            <div class="apc-link-box">
              <span class="apc-link-text">{{ inviteLink }}</span>
              <button class="apc-copy" @click="onCopy" :title="copied ? 'Tersalin!' : 'Salin'">
                <svg v-if="!copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </button>
            </div>
            <div class="apc-share-row">
              <button class="apc-btn gold" @click="onShareWA">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button class="apc-btn ghost" @click="onEmail">Email</button>
            </div>
          </template>

          <button v-else class="apc-btn gold" :disabled="!email.trim() || sending" @click="onGenerate">
            {{ sending ? 'Menyiapkan...' : 'Buat Link Undangan' }}
          </button>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['close'])
const store = useWeddingStore()

const email         = ref('')
const sending       = ref(false)
const pendingInvite = ref(null)
const inviteLink    = ref('')
const copied        = ref(false)
const copiedPending = ref(false)

const pendingLink = computed(() =>
  pendingInvite.value ? `${window.location.origin}/?invite=${pendingInvite.value.token}` : ''
)

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

function waMessage(link) {
  return encodeURIComponent(`Halo! Kamu diundang untuk merencanakan pernikahan bersama di Soulmate Planner.\n\nKlik link ini untuk bergabung:\n${link}\n\nLink berlaku 7 hari.`)
}

async function onGenerate() {
  if (!email.value.trim() || sending.value) return
  sending.value = true
  try {
    const token = await store.sendPartnerInvite(email.value.trim())
    inviteLink.value = `${window.location.origin}/?invite=${token}`
  } catch (e) {
    store.toast(e.message || 'Gagal membuat undangan')
  } finally {
    sending.value = false
  }
}

async function onCopy() {
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function onShareWA() {
  window.open(`https://wa.me/?text=${waMessage(inviteLink.value)}`)
}

function onEmail() {
  const subject = encodeURIComponent('Undangan Wedding Planner – Soulmate')
  const body    = encodeURIComponent(`Halo!\n\nKamu diundang untuk merencanakan pernikahan bersama di Soulmate Planner.\n\nKlik link berikut untuk bergabung:\n${inviteLink.value}\n\nLink berlaku selama 7 hari.`)
  window.open(`mailto:${email.value}?subject=${subject}&body=${body}`)
}

async function onCopyPending() {
  await navigator.clipboard.writeText(pendingLink.value)
  copiedPending.value = true
  setTimeout(() => { copiedPending.value = false }, 2000)
}

function onShareWAPending() {
  window.open(`https://wa.me/?text=${waMessage(pendingLink.value)}`)
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

.apc-link-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8F3EC;
  border: 1.5px solid #DDD0C4;
  border-radius: 10px;
  padding: 10px 12px;
}
.apc-link-text {
  flex: 1;
  font-size: 12px;
  color: #7a5c28;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}
.apc-copy {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: rgba(205,159,101,.15);
  color: #B8874A;
  cursor: pointer;
  transition: background .15s;
}
.apc-copy:active { background: rgba(205,159,101,.3); }

.apc-share-row {
  display: flex;
  gap: 10px;
}
.apc-share-row .apc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.apc-share-row .apc-btn.gold { flex: 1.5; }
.apc-share-row .apc-btn.ghost { flex: 1; }
</style>
