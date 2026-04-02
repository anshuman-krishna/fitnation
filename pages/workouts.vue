<template>
  <div class="flex flex-col bg-williamgreen min-h-screen">
    <NavBar />

    <div class="container mx-auto py-10">
      <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold font-orelega text-center text-periwinklegrey pb-2">Workout Programs</h1>
      <h2 class="text-lg md:text-xl lg:text-2xl font-bold font-orelega text-center text-periwinklegrey">[The feature is coming soon.. to stay updated, sign up today!]</h2>
      <h2 class="text-base md:text-lg lg:text-xl font-orelega text-center text-periwinklegrey mb-6 pb-2">[checkout /meditation to keep yourself calm till we roll out the feature :D]</h2>

      <!-- Workout Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        <!-- Workout Card 1 (Chest {All}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc="@"
          imageAlt="Chest Workout"
          title="Chest {All}"
          description="A comprehensive chest workout to strengthen your chest muscles."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 2 (Arms {Biceps}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Back Workout"
          title="Arms {Biceps}"
          description="Focus on building your biceps with targeted arm exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 3 (Arms {Triceps}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Legs Workout"
          title="Arms {Triceps}"
          description="Strengthen your triceps with effective arm workouts."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 4 (Arms {Forearms}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Arms {Forearms}"
          description="Focus on forearm development with targeted exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 5 (Core {Abs}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Core {Abs}"
          description="Achieve strong and defined abs with these core exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 6 (Core {Obliques}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Core {Obliques}"
          description="Target your obliques for a balanced core with these exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 7 (Back {Traps & mid}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Back {Traps & mid}"
          description="Strengthen your mid-back and traps with these back exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 8 (Back {Lats & more}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Back {Lats & more}"
          description="Work on your lats and more with these effective back workouts."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 9 (Shoulders {All}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Shoulders {All}"
          description="Comprehensive shoulder workout for impressive shoulder muscles."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 10 (Legs {Quads}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Legs {Quads}"
          description="Strengthen your quads with targeted leg exercises."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 11 (Legs {Hamstrings}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Legs {Hamstrings}"
          description="Target your hamstrings for balanced leg development."
          buttonLink="/auth"
          buttonText="Details"
        />

        <!-- Workout Card 12 (Legs {Calves}) -->
        <Card
          cardClasses="bg-greysuit rounded-lg shadow-md p-4"
          imageSrc=""
          imageAlt="Shoulders Workout"
          title="Legs {Calves}"
          description="Develop your calf muscles with these calf exercises."
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
