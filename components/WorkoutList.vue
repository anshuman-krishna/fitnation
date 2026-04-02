<template>
  <div class="container mx-auto mt-8">
    <h2 class="text-2xl font-semibold">Workouts</h2>
    <ul class="mt-4">
      <li v-for="workout in workouts" :key="workout.id" class="py-2">
        {{ workout.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    workouts: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
</style>
