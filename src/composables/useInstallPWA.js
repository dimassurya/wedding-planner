import { ref } from 'vue'

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
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone

  async function install() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      canInstall.value = false
    }
  }

  return { canInstall, isIOS, isStandalone, install }
}
