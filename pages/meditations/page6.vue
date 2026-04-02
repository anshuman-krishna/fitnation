<template>
  <PageLayout
    pageTitle="Phase 3: Loving-Kindness Meditation"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        Phase 3 introduces Loving-Kindness Meditation, a practice that cultivates feelings of love and compassion. Start by directing these positive emotions towards yourself, repeating phrases like "May I be happy, may I be healthy, may I be at ease." Gradually extend this loving-kindness to loved ones, acquaintances, and even those you may have conflicts with. This practice fosters empathy and generates positive emotions towards all beings.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> Phase 3 introduces the beautiful practice of Loving-Kindness Meditation. </li>
      <li class="py-3"><span class="dot"></span> Begin by extending love and compassion to yourself; you deserve it. </li>
      <li class="py-3"><span class="dot"></span> Then, gradually expand your heart's warmth to others, including loved ones, acquaintances, and even those you find challenging. </li>
      <li class="py-3"><span class="dot"></span> This practice will fill your heart with positive emotions and empathy. </li>
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
