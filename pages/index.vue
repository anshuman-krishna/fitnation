<template>
  <NavBar />

  <div class="hero text-black scroll-smooth bg-graysuit relative" id="site-container">
    <div class="h-screen flex flex-col items-center">
      <div class="absolute inset-0 z-0" style="background-image: url(''); background-size: cover;"></div>

      <div class="hero-content flex flex-col items-center text-center relative z-10">
        <div class="vertical-center-container">
          <div class="super-big-text font-orelega text-6xl md:text-7xl font-bold">
            FITNATION
          </div>
        </div>
        <p class="font-abril text-2xl md:text-4xl font-bold">
          Fitness, summed up.
        </p>
      </div>
    </div>
  </div>

  <div class="content bg-williamgreen text-periwinklegrey flex flex-col gap-10 py-10 md:py-20 justify-center items-center text-base md:text-lg">
    <div class="intro flex flex-col justify-center items-center gap-4 md:gap-10">
      <p class="text-2xl md:text-4xl font-abril text-center font-bold">From a Fitness Enthusiast, to the Fitness Enthusiasts.</p>
      <div class="flex flex-col text-center gap-2 md:gap-4">
        <p class="font-golox">
          Fitnation is the one-stop solution everyone somehow or the other is looking for, in a form or two, with a feature or other. It has everything that helps you achieve your fitness, calorie, and meditation goals, all, under a single roof.
        </p>
        <p class="font-golox">
          With a wide array of exercises, and a community of fitness enthusiasts to help you along the way, we'd only be ever expanding with new ideas to implement, some of the future prospects include a separate page and a community to showcase your fitness journey or body slash workout progress at, a chat-based feature to answer all your questions, and if any were left still, email support and everything, this is not just another fitness page, it's a revolution, a family, a nation, the Fitnation.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-8">
        <!-- Card 1 -->
        <Card
          cardClasses="card bg-periwinklegrey text-black rounded"
          imageSrc=""
          imageAlt="Kettlebell"
          title="Mind Muscle Connection"
          description="Get fit and strong with our wide array of exercises for each muscle group, with something that matters the most in these, a correct form."
          buttonLink="/workouts"
          buttonText="Learn More"
        />

        <!-- Card 2 -->
        <Card
          cardClasses="card bg-periwinklegrey text-black rounded"
          imageSrc=""
          imageAlt="Jumper"
          title="Calorie Countdown"
          description="Each calorie counts, hence, something that helps you keep track of your calories, and helps you achieve your goals."
          buttonLink="/calorie"
          buttonText="Learn More"
        />

        <!-- Card 3 -->
        <Card
          cardClasses="card bg-periwinklegrey text-black rounded"
          imageSrc=""
          imageAlt="Yoga"
          title="Zen Zone Meditation"
          description="Training on the inside is as necessary for a healthy lifestyle as training on the outside. Here's something that helps you achieve that."
          buttonLink="/meditation"
          buttonText="Learn More"
        />

        <!-- Card 4 -->
        <Card
          cardClasses="card bg-periwinklegrey text-black rounded"
          imageSrc=""
          imageAlt="Barbell"
          title="Strong & Sculpted"
          description="Maximize your strength gains and muscle definition with some of the most widely-used, efficient and hand-crafted workouts."
          buttonLink="/workouts"
          buttonText="Learn More"
        />
      </div>
    </div>
  </div>

  <div class="bg-williamgreen flex flex-col justify-center items-center py-4">
    <h1 class="text-periwinklegrey text-4xl md:text-6xl font-orelega font-bold pb-2">
      Personalized Plans
    </h1>
    <p class="text-periwinklegrey text-base md:text-lg font-golox mt-2 pb-2 md:pb-4">
      With Fitnation, you'll receive custom workout plans tailored to your goals, fitness level, and schedule. Start your fitness journey the right way.
    </p>
    <div class="flex mt-4 md:mt-8 pb-2 md:pb-4">
      <Button class="btn bg-tiber text-greysuit mr-2 md:mr-4 rounded" href="/auth">Get Started</Button>
      <Button class="btn bg-greysuit text-tiber rounded" href="/auth">Learn More</Button>
    </div>

    <questions class="py-8 md:py-18" />
  </div>

  <Footer />
</template>

<style scoped>
/* Add any custom styles you need here */

.super-big-text {
  font-size: 4rem;
  font-weight: bold;
}

.text-4xl.font-bold {
  font-size: 1.5rem;
  font-weight: bold;
}

.vertical-center-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}
</style>
