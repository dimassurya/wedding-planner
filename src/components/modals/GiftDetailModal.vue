<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal" v-if="gift">
      <h3>{{ gift.item || 'Item Baru' }}</h3>
      <div class="sub">
        {{ gift.type === 'seserahan' ? 'Seserahan' : 'Mahar' }}
        <span v-if="gift.includeInBudget" class="gdm-badge">🔗 Dari Budget</span>
      </div>

      <GiftForm :gift="gift" />

      <div class="modal-actions">
        <button class="btn-ghost" @click="onDelete">Hapus</button>
        <button class="btn" @click="$emit('close')">Selesai</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import GiftForm from '../GiftForm.vue'

const props = defineProps({ show: Boolean, giftId: { default: null } })
const emit = defineEmits(['close'])

const store = useWeddingStore()
const gift = computed(() => props.giftId != null ? store.gifts.find(g => g.id === props.giftId) : null)

async function onDelete() {
  if (!gift.value) return
  const id = gift.value.id
  await store.delGift(id)
  if (!store.gifts.find(g => g.id === id)) emit('close')
}
</script>

<style scoped>
.gdm-badge {
  display: inline-block;
  margin-left: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--plum);
  background: var(--gold-soft);
  border-radius: 100px;
  padding: 2px 10px;
}
</style>
