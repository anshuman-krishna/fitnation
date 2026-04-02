<template>
  <PageLayout
    pageTitle="The Foundation: Posture and Breath Awareness"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        The foundation of meditation lies in your posture and breath awareness. Find a comfortable seated position with your back straight but not rigid. Rest your hands on your lap or knees, and gently close your eyes or maintain a soft gaze. Begin by taking a few deep breaths to settle in. As you start, focus your attention on your natural breath, using it as an anchor for your awareness.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> As you sit down to meditate, start by settling into a comfortable posture. </li>
      <li class="py-3"><span class="dot"></span> Keep your back straight but not tense; this helps maintain alertness and comfort. </li>
      <li class="py-3"><span class="dot"></span> Close your eyes gently or maintain a soft gaze, whatever feels most natural to you. </li>
      <li class="py-3"><span class="dot"></span> Take a moment to breathe deeply, allowing your body and mind to align with the present moment. </li>
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
