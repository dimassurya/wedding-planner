<template>
  <div id="toast" :class="{ show: store.toastVisible }">{{ store.toastMsg }}</div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
const store = useWeddingStore()
</script>
