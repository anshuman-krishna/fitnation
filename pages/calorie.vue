<template>
  <div class="flex flex-col bg-williamgreen min-h-screen">
    <NavBar />

    <div class="container mx-auto py-10">
      <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold font-orelega text-center text-periwinklegrey pb-2">Calorie Tracking</h1>
      <h2 class="text-lg md:text-xl lg:text-2xl font-bold font-orelega text-center text-periwinklegrey mb-6 pb-2">[The feature is coming soon.. to stay updated, sign up today!]</h2>

      <!-- Calorie Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        <!-- Calorie Card 1 (Daily Intake) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Daily Calorie Intake"
          title="Daily Calorie Intake"
          description="Track your daily calorie consumption to meet your nutritional goals."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Calorie Card 2 (Food Diary) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Food Diary"
          title="Food Diary"
          description="Keep a record of your meals and snacks to monitor your calorie intake."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Calorie Card 3 (Calorie Burn) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Calorie Burn"
          title="Calorie Burn"
          description="Track the calories you burn through exercise and daily activities."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Calorie Card 4 (Nutritional Goals) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Nutritional Goals"
          title="Nutritional Goals"
          description="Set and monitor your nutritional goals for a balanced diet."
          buttonLink="/auth"
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
