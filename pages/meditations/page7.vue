<template>
  <PageLayout
    pageTitle="Phase 4: Visualization"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        Visualization is the focus of Phase 4. Here, you'll create mental images of peaceful and positive scenes. Imagine yourself in a serene natural setting, achieving your goals, or experiencing moments of pure joy. Pay attention to the details, colors, and sensations of your visualization. This technique enhances creativity and reduces stress, allowing you to tap into the power of your imagination.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> Visualization is a powerful tool for your meditation journey. </li>
      <li class="py-3"><span class="dot"></span> As you create vivid mental images, let your imagination soar. </li>
      <li class="py-3"><span class="dot"></span> Notice the colors, shapes, and sensations in your mind's eye. </li>
      <li class="py-3"><span class="dot"></span> Visualization is a gateway to creativity and inner peace. </li>
    </template>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/MeditationPageLayout.vue';

export default {
  components: {
    PageLayout,
  },
};
</script>
