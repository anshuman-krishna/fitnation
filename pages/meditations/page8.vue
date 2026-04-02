<template>
  <PageLayout
    pageTitle="Wrapping Up Your Meditation Practice"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        Congratulations on completing these eight phases of meditation. Remember, meditation is a lifelong journey, and consistency is key. Feel free to experiment with different techniques and find what resonates most with you. If you're looking for more guidance, consider exploring guided meditations, meditation apps, or joining meditation classes. Keep practicing, and you'll continue to experience the profound benefits of a calm and focused mind.
      </p>

      <p>
        These contents are designed to provide clear guidance on each phase of meditation for your website. You can format and present them as you see fit, and don't forget to add images to enhance the user experience.
      </p>

    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="pb-3"><span class="dot"></span> Congratulations on completing this meditation guide! </li>
      <li class="py-3"><span class="dot"></span> Remember, meditation is a lifelong practice, and every session is an opportunity for growth. </li>
      <li class="py-3"><span class="dot"></span> Continue to explore, learn, and make meditation a part of your daily life. </li>
      <li class="py-3"><span class="dot"></span> The path to a calm and focused mind is yours to walk, and the benefits are endless. Keep meditating and evolving on this beautiful journey. </li>
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
