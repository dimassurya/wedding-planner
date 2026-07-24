import { ref, onMounted, onBeforeUnmount } from 'vue'

// Toolbar (controls) sticky di bawah navbar, header tabel nempel tepat di
// bawahnya. Tinggi toolbar berubah kalau tombol/chip-nya wrap, jadi posisi
// header (headTop) dihitung ulang otomatis dari tinggi toolbar sebenarnya.
// `top` = sticky top toolbar (nyelip pas di bawah navbar ~73px).
export function useStickyThead(top = 72) {
  const toolbarRef = ref(null)
  const headTop = ref(top + 84) // fallback sebelum diukur
  let ro = null

  onMounted(() => {
    if (!toolbarRef.value) return
    ro = new ResizeObserver(() => {
      headTop.value = top + toolbarRef.value.offsetHeight
    })
    ro.observe(toolbarRef.value)
  })

  onBeforeUnmount(() => { ro?.disconnect() })

  return { toolbarRef, headTop }
}
