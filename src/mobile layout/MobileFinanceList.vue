<template>
  <div class="mf-wrap">
    <div v-if="!rows.length" class="mf-empty">
      <div class="mf-empty-big">Belum ada transaksi</div>
      <div>Ketuk "+ Tambah Transaksi" untuk mulai mencatat.</div>
    </div>

    <button v-for="t in rows" :key="t.id" class="mf-item" @click="$emit('open', t.id)">
      <span class="mf-ico" :class="t.jenis">{{ t.jenis === 'masuk' ? '⬇' : '⬆' }}</span>
      <div class="mf-body">
        <div class="mf-title">{{ itemTitle(t) }}</div>
        <div class="mf-sub">
          <span v-if="itemBadge(t)" class="mf-badge" :class="t.jenis">{{ itemBadge(t) }}</span>
          <span>{{ relDate(t.tanggal) }}</span>
          <span v-if="t.budgetPaymentId" class="mf-linked" title="Otomatis dari pembayaran Budget">💰</span>
        </div>
      </div>
      <div class="mf-amt" :class="t.jenis">{{ t.jenis === 'masuk' ? '+' : '−' }} {{ fmt(t.nominal) }}</div>
    </button>
  </div>
</template>

<script setup>
import { fmt, fmtDate, daysLeft } from '../utils/index'

defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['open'])

// Judul spesifik (catatan) jadi fokus, kategori jadi badge kecil — sama
// persis logic-nya kayak versi PC di FinanceTab.vue.
function itemTitle(t) {
  return (t.catatan && t.catatan.trim()) || t.kategori || (t.jenis === 'masuk' ? 'Dana Masuk' : 'Dana Keluar')
}
function itemBadge(t) {
  return (t.kategori && t.kategori !== itemTitle(t)) ? t.kategori : ''
}

function relDate(dateStr) {
  if (!dateStr) return '—'
  const d = daysLeft(dateStr)
  if (d === 0) return 'Hari ini'
  if (d === -1) return 'Kemarin'
  return fmtDate(dateStr)
}
</script>

<style scoped>
.mf-wrap { display: flex; flex-direction: column; }

.mf-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 2px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--line);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.mf-item:last-child { border-bottom: none; }
.mf-item:active { background: var(--ivory); }

.mf-ico {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.mf-ico.masuk  { background: #EAF3DE; color: #2b5010; }
.mf-ico.keluar { background: var(--rose-soft); color: #7a1a1a; }

.mf-body { flex: 1; min-width: 0; }
.mf-title { font-family: 'Jost', sans-serif; font-size: var(--m-title); font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mf-sub { display: flex; align-items: center; gap: 6px; font-size: var(--m-sub); color: var(--muted); margin-top: 5px; overflow: hidden; }
.mf-badge { flex: none; display: inline-block; font-family: 'Jost', sans-serif; font-size: var(--m-chip); font-weight: 600; padding: 2px 9px; border-radius: 100px; }
.mf-badge.masuk  { background: #EAF3DE; color: #2b5010; }
.mf-badge.keluar { background: var(--rose-soft); color: #7a1a1a; }
.mf-linked { flex: none; }

.mf-amt { flex: none; font-size: var(--m-value); font-weight: 700; font-variant-numeric: tabular-nums; }
.mf-amt.masuk  { color: #2b5010; }
.mf-amt.keluar { color: var(--wine); }

.mf-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
.mf-empty-big { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
</style>
