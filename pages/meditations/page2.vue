<template>
  <PageLayout
    pageTitle="Creating a Peaceful Meditation Environment"
    image=""
  >
    <!-- Paragraph Content Goes Here -->
    <template #paragraph>
      <p>
        To get the most out of your meditation practice, it's essential to create a peaceful environment. Choose a quiet and comfortable space where you won't be disturbed. Consider using a cushion or chair for added comfort. Soft lighting and calming décor can help set the right atmosphere. Your meditation space should be a sanctuary that invites tranquility and focus.
      </p>
    </template>
    <!-- Points Content Goes Here -->
    <template #points>
      <li class="py-3"><span class="dot"></span> Your meditation space is your sanctuary, a place where you can find stillness amidst the chaos of life. </li>
      <li class="py-3"><span class="dot"></span> Take your time to create an environment that resonates with you, one that encourages focus and relaxation. </li>
      <li class="py-3"><span class="dot"></span> Find a quiet corner, add a comfortable seat, and infuse it with the calming energy you seek. </li>
      <li class="py-3"><span class="dot"></span> Make this space uniquely yours, and let it support your meditation practice. </li>
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
