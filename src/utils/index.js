export const fmt = n => 'Rp' + (Math.round(n || 0)).toLocaleString('id-ID')
export const grp = s => { s = String(s).replace(/\D/g, ''); return s ? parseInt(s).toLocaleString('id-ID') : '' }
export const num = s => parseInt(String(s).replace(/\D/g, '')) || 0
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))

export function fmtDate(s) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

export function openLink(url) {
  if (!url) return
  url = String(url).trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  window.open(url, '_blank', 'noopener')
}

export function downloadJSON(obj, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }))
  a.download = filename
  a.click()
}

export function downloadCSV(name, content) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
}

export function dateStamp() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
}

const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
export function toCSV(headers, rows) {
  const lines = [headers.map(csvCell).join(',')]
  rows.forEach(r => lines.push(r.map(csvCell).join(',')))
  return '﻿' + lines.join('\n')
}

// Format currency input while preserving cursor position
export function formatCurrencyInput(e, item, field) {
  const len = e.target.value.length
  const start = e.target.selectionStart
  e.target.value = grp(e.target.value)
  item[field] = num(e.target.value)
  const d = e.target.value.length - len
  try { e.target.setSelectionRange(start + d, start + d) } catch (_) {}
}
