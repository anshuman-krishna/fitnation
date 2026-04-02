<template>
  <PageLayout
    pageTitle="Phase 1: Mindfulness of Breath"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        In this first phase, your primary focus is on your breath. Pay close attention to the sensation of your breath as it enters and leaves your body. You can observe the rise and fall of your chest or the flow of air at your nostrils. When your mind inevitably wanders, gently bring your focus back to your breath. Start with short sessions, around 5-10 minutes, and gradually increase the duration as you become more comfortable. Breath awareness is a fundamental practice that enhances mindfulness.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> Your breath is your anchor in the sea of thoughts. Begin by paying attention to it. </li>
      <li class="py-3"><span class="dot"></span> It's normal for the mind to wander; when it does, gently return your focus to your breath. </li>
      <li class="py-3"><span class="dot"></span> Start with shorter sessions if you're new to meditation and gradually extend the duration. </li>
      <li class="py-3"><span class="dot"></span> With practice, you'll find that breath awareness can bring a sense of calm and presence to your life. </li>
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
