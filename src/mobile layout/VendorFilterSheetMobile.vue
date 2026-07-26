<template>
  <Teleport to="body">
    <transition name="vfsm-fade">
      <div v-if="show" class="vfsm-backdrop" @click="$emit('close')"></div>
    </transition>
    <transition name="vfsm-sheet">
      <div v-if="show" class="vfsm-sheet" role="dialog" aria-label="Filter Vendor">
        <div class="vfsm-handle"></div>
        <div class="vfsm-head">
          <span>Filter Vendor</span>
          <button type="button" class="vfsm-x" aria-label="Tutup" @click="$emit('close')">&times;</button>
        </div>

        <div class="vfsm-group">
          <div class="vfsm-group-lbl">Status</div>
          <div class="vfsm-options">
            <button
              v-for="opt in statusOptions" :key="opt.value" type="button"
              class="vfsm-opt" :class="{ on: draftStatus === opt.value }"
              @click="draftStatus = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>

        <div class="vfsm-group">
          <div class="vfsm-group-lbl">Urutkan</div>
          <div class="vfsm-options">
            <button
              v-for="opt in sortOptions" :key="opt.value" type="button"
              class="vfsm-opt" :class="{ on: draftSort === opt.value }"
              @click="draftSort = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>

        <div class="vfsm-actions">
          <button type="button" class="vfsm-btn vfsm-btn-reset" @click="reset">Reset</button>
          <button type="button" class="vfsm-btn vfsm-btn-apply" @click="apply">Terapkan</button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
// Bottom sheet filter mobile — pengganti 2 <select> desktop yang kurang
// enak disentuh di HP. Nyimpen draft lokal dulu, baru di-emit pas
// "Terapkan" ditekan, biar user bisa ganti-ganti pilihan tanpa list
// vendor di belakang ikut lompat-lompat tiap ketukan.
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  status: { type: String, default: 'semua' },
  sort: { type: String, default: 'terbaru' },
})
const emit = defineEmits(['close', 'apply'])

const statusOptions = [
  { value: 'semua', label: 'Semua' },
  { value: 'dipakai', label: 'Dipakai' },
  { value: 'included', label: 'Included' },
  { value: 'batal', label: 'Belum Dipilih' },
]
const sortOptions = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'nama', label: 'Nama' },
  { value: 'harga-rendah', label: 'Harga Terendah' },
  { value: 'harga-tinggi', label: 'Harga Tertinggi' },
]

const draftStatus = ref(props.status)
const draftSort = ref(props.sort)

watch(() => props.show, open => {
  if (open) { draftStatus.value = props.status; draftSort.value = props.sort }
})

function reset() { draftStatus.value = 'semua'; draftSort.value = 'terbaru' }
function apply() { emit('apply', { status: draftStatus.value, sort: draftSort.value }); emit('close') }
</script>

<style scoped>
.vfsm-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(36,8,8,.32);
}
.vfsm-sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 201;
  background: var(--paper);
  border-radius: 22px 22px 0 0;
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 32px rgba(36,8,8,.2);
  max-height: 80vh;
  overflow-y: auto;
}
.vfsm-handle { width: 40px; height: 4px; border-radius: 100px; background: var(--line); margin: 0 auto 14px; }
.vfsm-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
  font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 600; color: var(--plum);
}
.vfsm-x {
  width: 32px; height: 32px; display: grid; place-items: center;
  border: none; border-radius: 50%; background: var(--ivory); color: var(--muted);
  font-size: 22px; line-height: 1;
}
.vfsm-group { margin-bottom: 18px; }
.vfsm-group-lbl { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); margin-bottom: 10px; }
.vfsm-options { display: flex; flex-wrap: wrap; gap: 8px; }
.vfsm-opt {
  min-height: 40px;
  padding: 0 16px;
  font-family: 'Jost', sans-serif; font-size: 13.5px; font-weight: 500; color: var(--cacao);
  background: var(--ivory); border: 1.5px solid var(--line); border-radius: 100px;
  cursor: pointer;
}
.vfsm-opt.on { background: var(--gold-soft); border-color: var(--gold); color: var(--plum); font-weight: 700; }

.vfsm-actions { display: flex; gap: 10px; margin-top: 4px; }
.vfsm-btn {
  flex: 1; min-height: 46px;
  font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 600;
  border-radius: 100px; cursor: pointer;
}
.vfsm-btn-reset { background: var(--paper); border: 1.5px solid var(--line); color: var(--muted); }
.vfsm-btn-apply { background: var(--plum); border: 1.5px solid var(--plum); color: #fff; }

.vfsm-fade-enter-active, .vfsm-fade-leave-active { transition: opacity .2s ease; }
.vfsm-fade-enter-from, .vfsm-fade-leave-to { opacity: 0; }
.vfsm-sheet-enter-active, .vfsm-sheet-leave-active { transition: transform .22s ease; }
.vfsm-sheet-enter-from, .vfsm-sheet-leave-to { transform: translateY(100%); }
</style>
