import { ref } from 'vue'

// Breakpoint mengikuti CSS lama (max-width: 680px). Layout PC & HP dipisah,
// bukan responsif — di bawah breakpoint ini app render UI mobile sendiri.
export const MOBILE_BREAKPOINT = 680

// Singleton: satu listener untuk seluruh app.
const isMobile = ref(false)

if (typeof window !== 'undefined') {
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  isMobile.value = mq.matches
  mq.addEventListener('change', e => { isMobile.value = e.matches })
  // Fallback: resize event untuk DevTools emulation yang kadang tidak trigger matchMedia change
  let _t
  window.addEventListener('resize', () => {
    clearTimeout(_t)
    _t = setTimeout(() => { isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT }, 50)
  })
}

export function useIsMobile() {
  return isMobile
}
