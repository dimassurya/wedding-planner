<template>
  <div class="overlay show" @click.self="$emit('close')">
    <div class="modal ig-modal">
      <h3>Pasang di Layar Utama</h3>
      <div class="sub">Buka Soulmate langsung dari layar HP, tanpa lewat browser.</div>

      <div v-if="iosBrowser !== 'safari'" class="ig-warn">
        <span>⚠️</span>
        <div>Kamu sedang memakai {{ browserLabel }}. Paling mulus lewat <b>Safari</b> — salin alamat halaman ini, buka di Safari, lalu ulangi langkah di bawah.</div>
      </div>

      <ol class="ig-steps">
        <li>
          <span class="ig-num">1</span>
          <div class="ig-body">
            Ketuk tombol <b>Bagikan</b>
            <span class="ig-ico" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
            </span>
            <div class="ig-hint">{{ shareHint }}</div>
          </div>
        </li>
        <li>
          <span class="ig-num">2</span>
          <div class="ig-body">
            Gulir ke bawah, pilih <b>Tambahkan ke Layar Utama</b>
            <span class="ig-ico" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>
            </span>
            <div class="ig-hint">Kalau tidak terlihat, gulir terus daftar menunya ke bawah.</div>
          </div>
        </li>
        <li>
          <span class="ig-num">3</span>
          <div class="ig-body">
            Ketuk <b>Tambah</b> di pojok kanan atas
            <div class="ig-hint">Ikon Soulmate akan muncul di layar utama HP kamu.</div>
          </div>
        </li>
      </ol>

      <div class="ig-note">
        💡 iPhone tidak mengizinkan aplikasi memasang dirinya sendiri, jadi langkah ini memang harus manual.
      </div>

      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">Mengerti</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useInstallPWA } from '../composables/useInstallPWA'

defineEmits(['close'])

const { iosBrowser } = useInstallPWA()

const browserLabel = computed(() => ({
  chrome: 'Chrome', firefox: 'Firefox', edge: 'Edge',
}[iosBrowser] || 'browser lain'))

// Posisi tombol Bagikan beda-beda per browser.
const shareHint = computed(() => iosBrowser === 'safari'
  ? 'Ada di bar bawah layar Safari (ikon kotak dengan panah ke atas).'
  : 'Biasanya ada di menu ⋯ atau bar alamat.')
</script>

<style scoped>
.ig-modal { max-width: 400px; }

.ig-warn {
  display: flex;
  gap: 9px;
  padding: 11px 13px;
  border-radius: 12px;
  background: var(--gold-soft);
  color: #6b4f1f;
  font-size: 12.5px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.ig-warn span { flex: none; }

.ig-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ig-steps li { display: flex; gap: 11px; align-items: flex-start; }

.ig-num {
  flex: none;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--plum);
  color: #fff;
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 700;
}
.ig-body { flex: 1; min-width: 0; font-size: 14px; color: var(--ink); line-height: 1.45; }
.ig-ico {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1.5px solid var(--line);
  border-radius: 7px;
  background: var(--ivory);
  color: var(--plum);
  vertical-align: middle;
  margin-left: 5px;
}
.ig-hint { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.45; }

.ig-note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  background: var(--ivory);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 16px;
}
</style>
