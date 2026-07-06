<template>
  <div class="progress-wrap">
    <div class="progress-top">
      <span>{{ left }}</span>
      <span><b>{{ pct }}%</b> {{ suffix }}</span>
    </div>
    <div class="pbar"><span :style="{ width: pct + '%' }"></span></div>
  </div>
</template>

<script setup>
defineProps({
  left:   { type: String, default: '' },
  pct:    { type: Number, default: 0 },
  suffix: { type: String, default: '' },
})
</script>
