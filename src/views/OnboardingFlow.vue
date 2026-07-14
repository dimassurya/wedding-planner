<template>
  <div class="ob-page">
    <div class="ob-card">
      <div class="ob-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1" stroke-linejoin="round"/>
        </svg>
        <span>Wedding Planner</span>
      </div>

      <!-- Step indicator -->
      <div class="ob-steps">
        <div class="ob-step" :class="{ active: step === 1, done: step > 1 }">1</div>
        <div class="ob-step-line"></div>
        <div class="ob-step" :class="{ active: step === 2, done: step > 2 }">2</div>
      </div>

      <!-- Step 1: Data pasangan -->
      <template v-if="step === 1">
        <h2 class="ob-title">Selamat datang!</h2>
        <p class="ob-desc">Isi data pasangan — bisa diubah kapan saja di tab Home.</p>

        <div class="ob-form">
          <div class="ob-field">
            <label>Nama Pengantin Pria</label>
            <input v-model="form.pria" type="text" placeholder="Nama lengkap..." maxlength="60" autofocus>
          </div>
          <div class="ob-field">
            <label>Nama Pengantin Wanita</label>
            <input v-model="form.wanita" type="text" placeholder="Nama lengkap..." maxlength="60">
          </div>
          <div class="ob-field">
            <label>Tanggal Pernikahan</label>
            <input v-model="form.tanggal" type="date">
          </div>
          <div class="ob-row">
            <div class="ob-field">
              <label>Jam Mulai</label>
              <input v-model="form.jamMulai" type="time">
            </div>
            <div class="ob-field">
              <label>Jam Selesai</label>
              <input v-model="form.jamSelesai" type="time">
            </div>
          </div>
        </div>

        <button class="ob-btn" @click="step = 2">Lanjut →</button>
        <button class="ob-skip" @click="step = 2">Lewati, isi nanti</button>
      </template>

      <!-- Step 2: Pilih template -->
      <template v-else>
        <h2 class="ob-title">Pakai template bawaan?</h2>
        <p class="ob-desc">Template membantu kamu mulai lebih cepat. Bisa dihapus atau diubah sesukamu.</p>

        <div class="ob-templates">
          <label v-for="t in TEMPLATES" :key="t.key" class="ob-tpl-row" :class="{ checked: templates[t.key] }">
            <input type="checkbox" v-model="templates[t.key]">
            <div class="ob-tpl-info">
              <span class="ob-tpl-name">{{ t.label }}</span>
              <span class="ob-tpl-hint">{{ t.hint }}</span>
            </div>
            <div class="ob-tpl-check">
              <svg v-if="templates[t.key]" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4.5 4.5L16 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </label>
        </div>

        <button class="ob-btn" @click="done">Mulai Rencanakan</button>
        <button class="ob-back" @click="step = 1">← Kembali</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useWeddingStore } from '../stores/wedding'

const store = useWeddingStore()
const step  = ref(1)

const form = reactive({
  pria:       store.couple?.pria       || '',
  wanita:     store.couple?.wanita     || '',
  tanggal:    store.couple?.tanggal    || '',
  jamMulai:   store.couple?.jamMulai   || '',
  jamSelesai: store.couple?.jamSelesai || '',
})

const TEMPLATES = [
  { key: 'budget',    label: 'Anggaran & Vendor',  hint: 'Daftar item budget pernikahan umum' },
  { key: 'checklist', label: 'Checklist Persiapan', hint: 'To-do list persiapan hari H' },
  { key: 'timeline',  label: 'Agenda',               hint: 'Contoh tugas berjadwal menuju hari-H' },
  { key: 'admin',     label: 'Administrasi',         hint: 'Daftar syarat & dokumen' },
  { key: 'seserahan', label: 'Seserahan',            hint: 'Daftar item seserahan umum' },
]

const templates = reactive({
  budget: true, checklist: true, timeline: true, admin: true, seserahan: true,
})

function done() {
  store.completeOnboarding({
    pria:       form.pria,
    wanita:     form.wanita,
    tanggal:    form.tanggal,
    jamMulai:   form.jamMulai,
    jamSelesai: form.jamSelesai,
    templates:  { ...templates },
  })
}
</script>

<style scoped>
.ob-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ivory);
  padding: 24px;
}

.ob-card {
  background: var(--paper);
  border: 1px solid var(--gold-soft);
  border-top: 3px solid var(--gold);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 36px 36px 32px;
  width: 100%;
  max-width: 440px;
}

.ob-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-weight: 700;
  font-size: 1rem;
  color: var(--plum);
}

.ob-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.ob-step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .78rem;
  font-weight: 700;
  color: var(--muted);
  transition: all .2s;
}

.ob-step.active {
  border-color: var(--wine);
  background: var(--wine);
  color: #fff;
}

.ob-step.done {
  border-color: var(--teal);
  background: var(--teal);
  color: #fff;
}

.ob-step-line {
  flex: 1;
  height: 2px;
  background: var(--line);
  border-radius: 2px;
}

.ob-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--cacao);
  margin: 0 0 6px;
}

.ob-desc {
  font-size: .88rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 24px;
}

.ob-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.ob-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ob-field label {
  font-size: .78rem;
  font-weight: 600;
  color: var(--plum);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.ob-field input {
  padding: 10px 13px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-size: .93rem;
  color: var(--ink);
  background: var(--paper);
  outline: none;
  transition: border-color .15s;
  width: 100%;
  box-sizing: border-box;
}

.ob-field input:focus { border-color: var(--gold); }

.ob-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Template selection */
.ob-templates {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.ob-tpl-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  user-select: none;
}

.ob-tpl-row input[type="checkbox"] { display: none; }

.ob-tpl-row.checked {
  border-color: var(--gold);
  background: var(--gold-soft);
}

.ob-tpl-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ob-tpl-name { font-size: .9rem; font-weight: 600; color: var(--cacao); }
.ob-tpl-hint { font-size: .78rem; color: var(--muted); }

.ob-tpl-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
  background: transparent;
}

.ob-tpl-row.checked .ob-tpl-check {
  background: var(--wine);
  border-color: var(--wine);
}

.ob-tpl-check svg { width: 13px; height: 13px; }

/* Buttons */
.ob-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, var(--plum), var(--wine));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 8px;
  box-shadow: 0 6px 18px rgba(110,21,26,.22);
  transition: filter .15s, transform .1s;
}

.ob-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

.ob-skip, .ob-back {
  width: 100%;
  padding: 9px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: .83rem;
  cursor: pointer;
  transition: color .15s;
}

.ob-skip:hover, .ob-back:hover { color: var(--plum); }
</style>
