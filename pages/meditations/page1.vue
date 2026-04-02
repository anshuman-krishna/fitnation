<template>
    <PageLayout
      pageTitle="Getting Started with Meditation"
      image=""
    >
      <!-- Paragraph Content Goes Here -->
      <template #paragraph>
        <p>
          Welcome to the world of meditation. Whether you're seeking relaxation, mindfulness, or inner peace, meditation is a powerful practice that can benefit everyone. In this guide, we'll walk you through eight essential phases of meditation to help you embark on a journey to a calmer mind and a more peaceful life.
        </p>
      </template>
      <!-- Points Content Goes Here -->
      <template #points>
        <li class="py-3"><span class="dot"></span> Now that you've taken the first step, let's begin this journey together. </li>
        <li class="py-3"><span class="dot"></span> Explore each phase at your own pace, and remember that meditation is a personal experience. </li>
        <li class="py-3"><span class="dot"></span> Whether you're new to meditation or looking to deepen your practice, these eight phases will guide you along the way. </li>
        <li class="py-3"><span class="dot"></span> Let's dive into the transformative world of meditation.</li>
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
  