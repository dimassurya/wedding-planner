<template>
  <div class="stp">
    <button type="button" class="stp-btn" :disabled="modelValue <= min" @click="dec" aria-label="Kurangi">−</button>
    <span class="stp-val">{{ modelValue }}</span>
    <button type="button" class="stp-btn" :disabled="max != null && modelValue >= max" @click="inc" aria-label="Tambah">+</button>
  </div>
</template>

<script setup>
// Stepper +/- generik — pengganti dropdown angka buat kuantitas kecil
// (jumlah orang, jumlah kamar, dst). Reusable di luar form Tamu juga.
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: null },
})
const emit = defineEmits(['update:modelValue'])
function dec() { if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1) }
function inc() { if (props.max == null || props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1) }
</script>

<style scoped>
.stp {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--ivory);
  overflow: hidden;
  width: fit-content;
}
.stp-btn {
  flex: none;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  color: var(--plum);
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.stp-btn:hover:not(:disabled) { background: var(--gold-soft); }
.stp-btn:active:not(:disabled) { background: var(--gold); color: #fff; }
.stp-btn:disabled { color: var(--line); cursor: not-allowed; }
.stp-val {
  min-width: 52px;
  text-align: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
</style>
