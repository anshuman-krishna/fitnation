<template>
  <a :href="href" class="flex flex-row items-center justify-center gap-2 px-6 py-2 flex flex-row gap-4 w-fit">
    <slot />
    <div :class="`${(!processing) ? 'hidden' : ''}`">
      <Icon name="svg-spinners:tadpole" class="spinner" />
    </div>
  </a>
</template>

<style scoped>
.spinner {
  opacity: 1 !important;
}
</style>

<script lang="ts" setup>
defineProps<{
  href?: string,
  processing?: boolean
}>();
</script>
