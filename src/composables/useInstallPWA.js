import { ref, computed } from 'vue'

// ─────────────────────────────────────────────────────────────────────
//  Install PWA — dua jalur, karena iOS memang beda.
//
//  Android/Chrome/Edge: browser nembak event `beforeinstallprompt`, kita
//  tahan (preventDefault) lalu tampilkan tombol sendiri. Sekali klik jadi.
//
//  iPhone/iPad: Safari TIDAK PERNAH nembak `beforeinstallprompt` — Apple
//  nggak pernah mengimplementasikannya, dan nggak ada API apa pun buat
//  memicu install dari JavaScript. Satu-satunya cara ya manual lewat
//  menu Bagikan → Tambahkan ke Layar Utama. Jadi di iOS tombolnya tetap
//  ditampilkan, tapi isinya panduan langkah, bukan prompt otomatis.
//  (Ini batasan platform, bukan bug yang bisa diakali.)
// ─────────────────────────────────────────────────────────────────────

const deferredPrompt = ref(null)
const canInstall = ref(false)

if (typeof window !== 'undefined') {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  if (!isStandalone) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })
    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null
      canInstall.value = false
    })
  }
}

export function useInstallPWA() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  // iPadOS 13+ ngaku-ngaku Macintosh — dibedakan lewat touch point.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)
  const isStandalone = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone)

  // Di iOS semua browser wajib pakai mesin WebKit, tapi menu Bagikan-nya
  // beda tempat. Paling mulus tetap lewat Safari.
  const iosBrowser = /CriOS/.test(ua) ? 'chrome'
    : /FxiOS/.test(ua) ? 'firefox'
    : /EdgiOS/.test(ua) ? 'edge'
    : 'safari'

  // Tombol install ditampilkan kalau: browser-nya mendukung prompt otomatis,
  // ATAU ini iOS yang belum dipasang (panduan manual).
  const showInstall = computed(() => canInstall.value || (isIOS && !isStandalone))
  // true = klik tombol harus buka panduan, bukan prompt otomatis.
  const needsManualGuide = computed(() => !canInstall.value && isIOS && !isStandalone)

  async function install() {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      canInstall.value = false
    }
    return outcome === 'accepted'
  }

  return { canInstall, showInstall, needsManualGuide, isIOS, isStandalone, iosBrowser, install }
}
