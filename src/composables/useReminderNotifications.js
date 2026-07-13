import { ref } from 'vue'

// State permission bersifat global (satu browser cuma punya satu izin notifikasi),
// jadi disimpan di module scope supaya semua komponen yang pakai composable ini sinkron.
const supported  = ref(typeof window !== 'undefined' && 'Notification' in window)
const permission = ref(supported.value ? Notification.permission : 'unsupported')

function refreshPermission() {
  if (supported.value) permission.value = Notification.permission
}

async function requestPermission() {
  if (!supported.value) return 'unsupported'
  if (Notification.permission !== 'default') {
    refreshPermission()
    return permission.value
  }
  const result = await Notification.requestPermission()
  permission.value = result
  return result
}

function notify(title, options = {}) {
  if (!supported.value || Notification.permission !== 'granted') return null
  try {
    return new Notification(title, options)
  } catch (e) {
    console.error('[useReminderNotifications] notify failed:', e)
    return null
  }
}

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysLeftFrom(today, dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return Math.round((d - today) / 86400000)
}

// Cek deadline Budget & Timeline yang dekat/lewat, kirim notifikasi browser
// sekali per item per hari (dilacak lewat reminders.lastNotified di settings).
function checkReminders(store) {
  if (!store.reminders?.enabled) return
  if (!supported.value || Notification.permission !== 'granted') return

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const todayKey = localDateKey(today)
  const lastNotified = store.reminders.lastNotified || {}
  const toNotify = []

  ;(store.budget || []).forEach(b => {
    if (!b.jatuhTempo || store.bStatus(b).key === 'lunas') return
    const left = daysLeftFrom(today, b.jatuhTempo)
    if (left > (store.reminders.daysBeforeBudget ?? 3)) return
    const key = `budget-${b.id}-${todayKey}`
    if (lastNotified[key]) return
    toNotify.push({
      key,
      title: left < 0 ? 'Pembayaran lewat jatuh tempo' : 'Pembayaran jatuh tempo segera',
      body: `${b.item || 'Item budget'} — ${left < 0 ? `lewat ${Math.abs(left)} hari` : left === 0 ? 'hari ini' : `${left} hari lagi`}`,
    })
  })

  ;(store.timeline || []).forEach(t => {
    if (!t.deadline || t.status === 'selesai') return
    const left = daysLeftFrom(today, t.deadline)
    if (left > (store.reminders.daysBeforeTimeline ?? 7)) return
    const key = `timeline-${t.id}-${todayKey}`
    if (lastNotified[key]) return
    toNotify.push({
      key,
      title: left < 0 ? 'Tugas timeline terlambat' : 'Tugas timeline mendekati deadline',
      body: `${t.tugas || 'Tugas'} — ${left < 0 ? `lewat ${Math.abs(left)} hari` : left === 0 ? 'hari ini' : `${left} hari lagi`}`,
    })
  })

  if (!toNotify.length) return

  toNotify.slice(0, 5).forEach(n => notify(n.title, { body: n.body, tag: n.key }))
  const merged = { ...lastNotified }
  toNotify.forEach(n => { merged[n.key] = true })
  store.saveReminderSettings({ lastNotified: merged })
}

export function useReminderNotifications() {
  return { supported, permission, requestPermission, refreshPermission, notify, checkReminders }
}
