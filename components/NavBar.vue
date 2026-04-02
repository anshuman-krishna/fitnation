<template>
  <div class="bg-black relative flex flex-row mx-auto px-4 justify-between items-center py-3 dark:border-gray-50 w-full">
    <nav class="mx-auto space-x-8">
      <NavItem target-url="/">Home</NavItem>
      <NavItem target-url="/workouts">Workouts</NavItem>
      <NavItem target-url="/meditation">Meditation</NavItem>
      <NavItem target-url="/calorie">Calorie Tracking</NavItem>
      <NavItem target-url="/auth">Sign In/Register</NavItem>
    </nav>
    <transition
      enter-active-class="duration-200 ease-out"
      enter-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-100 ease-in"
      leave-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
    </transition>
  </div>
</template>

<script setup lang="ts">
import NavItem from '~/components/NavItem.vue';
</script>
