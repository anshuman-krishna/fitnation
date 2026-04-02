<template>
  <div class="flex flex-col gap-10 min-h-screen bg-williamgreen">
    <NavBar class="" active="bar-auth" />

    <div class="content flex flex-col md:flex-row justify-between items-center py-10 md:py-20 px-6 md:px-20 pt-36">
      <div class="text-periwinklegrey w-full flex flex-col gap-8 text-lg md:w-1/2 pl-6 md:pl-10 pr-6 md:pr-20">
        <p class="font-orelega font-bold text-2xl md:text-4xl">
          Benefits?
        </p>
        <p class="font-golox">
          A Fitnation account would equip you with more features to support you on your journey. Creating manual workouts of your own, Personalized diet charts, Fitness Tracker, you name it.
        </p>
        <p class="font-golox">
          Sign up now to receive the benefits! The sooner the better, it's a journey all of us are on, together, and we are here to help you.
        </p>
      </div>

      <div class="form w-full flex flex-col gap-8 items-center h-fit px-6 md:px-20 md:w-1/2">
        <div class="flex flex-col gap-4 w-full pt-10 md:pt-20">
          <div class="flex items-center justify-center px-4">
            <InputField placeholder="Email" @update:modelValue="newVal => username = newVal" class="bg-greysuit text-tiber rounded placeholder:text-start text-start" />
          </div>
          <div class="flex items-center justify-center px-4">
            <InputField placeholder="Password" @update:modelValue="newVal => password = newVal" class="bg-greysuit text-tiber rounded placeholder:text-start text-start" type="password" />
          </div>
        </div>

        <Button @click="authenticate" class="bg-tiber text-greysuit rounded duration-500 ease-in-out" :class="`${processing ? '' : ''} + ${!is_valid ? 'bg-navydark/90 cursor-not-allowed' : 'cursor-pointer'}`" :processing="processing" :title="`${(!is_valid) ? 'username and password fields cannot be left empty' : ''}`">
          Sign in / Register
        </Button>
      </div>
    </div>

    <Footer class="sticky-footer" />
  </div>
</template>


<script>
import { supabase } from '~/supabase.js';

export default {
  data() {
    return {
      username: '',
      password: '',
      processing: false,
      is_valid: true,
      error_message: '',
    };
  },
  methods: {
    async authenticate() {
      try {
        this.processing = true;

        const { user, session, error } = await supabase.auth.signUp({
          email: this.username,
          password: this.password,
        });

        if (error) {
          console.error('Authentication error:', error.message);
          this.is_valid = false;
          this.error_message = error.message;
        } else {
          // successful login
          this.$router.push('/members');
        }
      } finally {
        this.processing = false;
      }
    },
  },
};
</script>

<style scoped>
.sticky-footer {
  margin-top: auto;
}
</style>
