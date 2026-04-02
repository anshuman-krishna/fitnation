<template>
  <div class="flex flex-col bg-williamgreen min-h-screen">
    <Navbar />

    <div class="container mx-auto py-10">
      <h1 class="text-3xl font-orelega text-center text-white mb-4">[soon]</h1>

      <!-- Example cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        <!-- Card 1 -->
        <div class="flex justify-center">
          <div class="card-container">
            <Card
              cardClasses="bg-white rounded-lg shadow-md p-4"
              imageSrc=""
              imageAlt="Image"
              title="Doomsday"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente quas quis molestiae adipisci quae animi quidem eligendi."
              buttonLink="/doomsday"
              buttonText="Details"
            />
          </div>
        </div>

        <!-- Card 2 (Add your second card here) -->
        <div class="flex justify-center">
          <div class="card-container">
            <Card
              cardClasses="bg-white rounded-lg shadow-md p-4"
              imageSrc=""
              imageAlt="Alt"
              title="Gods"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente quas quis molestiae adipisci quae animi quidem eligendi."
              buttonLink="/your-link"
              buttonText="Details"
            />
          </div>
        </div>

        <!-- Card 3 (Add your third card here) -->
        <div class="flex justify-center">
          <div class="card-container">
            <Card
              cardClasses="bg-white rounded-lg shadow-md p-4"
              imageSrc="@/assets/images/index/your_image.jpg"
              imageAlt="All"
              title="Demons"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente quas quis molestiae adipisci quae animi quidem eligendi."
              buttonLink="/your-link"
              buttonText="Details"
            />
          </div>
        </div>
      </div>

      <!-- Log Out Button -->
      <div class="flex justify-center pt-10">
        <button @click="logout" class="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600">
          Log Out
        </button>
      </div>
    </div>

    <Footer class="sticky-footer" />
  </div>
</template>

<script>
import Navbar from '~/components/NavBar.vue';
import { supabase } from '~/supabase.js';

export default {
  components: {
    Navbar,
  },
  methods: {
    async logout() {
      try {
        await supabase.auth.signOut();
        //redirect
        this.$router.push('/auth'); // login page
      } catch (error) {
        console.error('Logout error:', error.message);
      }
    },
  },
};
</script>

<style scoped>
.sticky-footer {
  margin-top: auto;
}

.card-container {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
