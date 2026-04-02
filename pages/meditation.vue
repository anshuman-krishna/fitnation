<template>
  <div class="flex flex-col bg-williamgreen min-h-screen">
    <NavBar />

    <div class="container mx-auto py-10">
      <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold font-orelega text-center text-periwinklegrey mb-6 pb-2">Meditation Classes</h1>

      <!-- Meditation Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        <!-- Meditation Card 1 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 1"
          title="Getting Started"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page1"
          buttonText="Details"
        />

        <!-- Meditation Card 2 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 2"
          title="Meditation for Stress Relief"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page2"
          buttonText="Details"
        />

        <!-- Meditation Card 3 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 3"
          title="Mindfulness Meditation"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page3"
          buttonText="Details"
        />

        <!-- Meditation Card 4 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 4"
          title="Meditation for Inner Peace"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page4"
          buttonText="Details"
        />

        <!-- Meditation Card 5 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 5"
          title="Guided Meditation"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page5"
          buttonText="Details"
        />

        <!-- Meditation Card 6 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 6"
          title="Meditation for Relaxation"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page6"
          buttonText="Details"
        />

        <!-- Meditation Card 7 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 7"
          title="Deep Breathing"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page7"
          buttonText="Details"
        />

        <!-- Meditation Card 8 -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Meditation Class 8"
          title="Meditation for Clarity"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          buttonLink="/meditations/page8"
          buttonText="Details"
        />
      </div>
    </div>

    <Footer class="sticky-footer" />
  </div>
</template>

<style scoped>
.sticky-footer {
  margin-top: auto;
}
</style>
