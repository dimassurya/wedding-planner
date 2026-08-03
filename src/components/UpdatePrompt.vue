<template>
  <transition name="upd-fade">
    <div v-if="needRefresh" class="upd" role="status">
      <span class="upd-ico" aria-hidden="true">✨</span>
      <div class="upd-body">
        <div class="upd-title">Versi baru tersedia</div>
        <div class="upd-desc">Muat ulang untuk memakai pembaruan terbaru.</div>
      </div>
      <button class="upd-btn" @click="reload">Muat Ulang</button>
      <button class="upd-x" aria-label="Nanti saja" @click="dismiss">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

// Cek pembaruan berkala — app ini sering dibiarkan kebuka berjam-jam,
// tanpa ini tawaran update baru muncul saat halaman dibuka ulang.
const CEK_TIAP = 30 * 60 * 1000 // 30 menit
const JEDA_MIN = 60 * 1000      // throttle: maksimal 1 cek per menit

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    let terakhirCek = Date.now()

    async function cekUpdate() {
      // Jangan cek pas offline — cuma bikin error di console.
      if (!navigator.onLine) return
      if (Date.now() - terakhirCek < JEDA_MIN) return
      terakhirCek = Date.now()
      try { await registration.update() } catch (_) {}
    }

    setInterval(cekUpdate, CEK_TIAP)

    // PENTING buat HP: app yang sudah di-install hampir selalu "resume
    // dari background", BUKAN load ulang halaman — jadi pengecekan saat
    // registrasi nggak pernah jalan lagi. Tanpa hook ini, tawaran update
    // bisa telat sampai setengah jam walau versi baru sudah lama live
    // (kejadian nyata: fitur baru nggak muncul di HP padahal sudah
    // deploy). registerType tetap 'prompt' — user yang mutusin kapan
    // muat ulang, app nggak pernah refresh sendiri.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') cekUpdate()
    })
    window.addEventListener('focus', cekUpdate)
    // Koneksi balik setelah offline — kandidat kuat ada versi baru terlewat.
    window.addEventListener('online', () => { terakhirCek = 0; cekUpdate() })
  },
})

// true = aktifkan SW baru lalu muat ulang halaman.
const reload = () => updateServiceWorker(true)
// Tutup tawarannya; bakal nongol lagi kalau app dibuka ulang atau pas
// pengecekan berkala berikutnya masih menemukan versi baru.
const dismiss = () => { needRefresh.value = false }
</script>

<style scoped>
.upd {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  /* Di atas bottom-nav mobile (bottom 14px + tinggi ~62px) biar nggak
     ketiban; di desktop cuma kelihatan mengambang di bawah. */
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  z-index: 250;
  width: min(94vw, 420px);
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(36, 8, 8, .18), 0 2px 6px rgba(36, 8, 8, .08);
}
@media (min-width: 861px) {
  .upd { bottom: 22px; }
}

.upd-ico { flex: none; font-size: 18px; line-height: 1; }
.upd-body { flex: 1; min-width: 0; }
.upd-title { font-family: 'Jost', sans-serif; font-size: 13.5px; font-weight: 600; color: var(--ink); }
.upd-desc { font-size: 11.5px; color: var(--muted); margin-top: 2px; line-height: 1.4; }

.upd-btn {
  flex: none;
  padding: 8px 14px;
  border: none;
  border-radius: 100px;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.upd-btn:hover { background: var(--wine); }

.upd-x {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background .15s, color .15s;
}
.upd-x:hover { background: var(--ivory); color: var(--plum); }

.upd-fade-enter-active, .upd-fade-leave-active { transition: opacity .22s ease, transform .22s ease; }
.upd-fade-enter-from, .upd-fade-leave-to { opacity: 0; transform: translate(-50%, 12px); }
.upd-fade-enter-to, .upd-fade-leave-from { transform: translate(-50%, 0); }
</style>
