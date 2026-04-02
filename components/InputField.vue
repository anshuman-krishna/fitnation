<template>
  <input
    :type="inputType"
    class="px-4 py-2 border-md w-full focus:outline-0 text-center placeholder:text-tiber h-fit"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script lang="ts" setup>
const { placeholder, inputType = "text" } = defineProps<{
  placeholder: string;
  inputType?: string;
}>();
defineEmits(['update:modelValue']);
</script>
