<template>
  <div class="bg-williamgreen min-h-screen flex flex-col">
    <NavBar />

    <!-- Page Content -->
    <div class="flex-1 pb-12 overflow-hidden">
      <!-- Title -->
      <h1 class="text-3xl font-bold font-orelega text-center text-periwinklegrey mb-6 pb-2 py-10">{{ pageTitle }}</h1>

      <!-- Paragraph -->
      <div class="font-golox text-golox text-periwinklegrey px-40 py-5">
        <!-- Paragraph Content -->
        <div class="paragraph">
          <slot name="paragraph"></slot>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-col md:flex-row items-center mt-8 text-periwinklegrey px-20 pl-32">
        <!-- Left Column (Image) -->
        <div class="md:flex-1">
          <img :src="image" alt="Image" class="mx-auto" />
        </div>

        <!-- Right Column (Text) -->
        <div class="md:flex-1 mt-6 md:mt-0 text-center text-periwinklegrey">
          <!-- Points -->
          <div class="text-left pl-4 pt-16">
            <div class="points">
              <slot name="points"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Footer class="footer" />
  </div>
</template>

<script>
export default {
  props: {
    pageTitle: String,
    image: String,
  },
};
</script>

<style scoped>
</style>
