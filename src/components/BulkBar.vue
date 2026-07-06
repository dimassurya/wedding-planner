<template>
  <div class="bulkbar" :class="{ show: store.selectedCount > 0 }">
    <span class="count"><b>{{ store.selectedCount }}</b> dipilih</span>
    <button class="bbtn primary" @click="$emit('edit')">Ubah Status</button>
    <button class="bbtn danger" @click="$emit('delete')">Hapus</button>
    <button class="bbtn x" title="Batal pilih" @click="store.clearSelected()">&times;</button>
  </div>
</template>

<script setup>
import { useWeddingStore } from '../stores/wedding'
const store = useWeddingStore()
defineEmits(['edit', 'delete'])
</script>
