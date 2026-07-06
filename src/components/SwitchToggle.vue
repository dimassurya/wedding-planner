<template>
  <label class="switch" :title="title">
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)">
    <span class="slider"></span>
  </label>
</template>

<script setup>
defineProps({ modelValue: Boolean, title: { type: String, default: '' } })
defineEmits(['update:modelValue'])
</script>
