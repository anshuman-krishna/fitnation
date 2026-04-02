<template>
  <PageLayout
    pageTitle="Phase 2: Body Scan"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        Phase 2 involves a body scan to release tension and promote relaxation. Begin at the top of your head and slowly move your attention down through each part of your body, all the way to your toes. As you scan, notice any areas of tension or discomfort and consciously release them. The body scan is an excellent way to enhance your self-awareness and achieve a deep sense of relaxation.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> Begin the body scan by focusing your awareness on different parts of your body. </li>
      <li class="py-3"><span class="dot"></span> As you move from head to toes, release any tension or discomfort you encounter. </li>
      <li class="py-3"><span class="dot"></span> This practice promotes relaxation and helps you develop a deeper connection with your body. </li>
      <li class="py-3"><span class="dot"></span> With each scan, you're nurturing a sense of well-being within. </li>
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
