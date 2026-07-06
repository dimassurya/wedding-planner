// Bikin link wa.me dari nomor HP Indonesia. Null kalau nomor kosong/invalid.
export function waLink(hp) {
  let n = String(hp || '').replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('0')) n = '62' + n.slice(1)
  else if (n.startsWith('62')) { /* sudah benar */ }
  else if (n.startsWith('8')) n = '62' + n
  if (n.length < 9) return null
  return `https://wa.me/${n}`
}

export function openWa(v) {
  const url = waLink(v?.hp)
  if (url) window.open(url, '_blank', 'noopener')
}
