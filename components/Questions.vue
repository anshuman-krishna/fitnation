<template>
  <div class="flex-col flex py-14 gap-8 items-start h-fit">
    <h1 class="font-orelega font-bold text-4xl text-center text-periwinklegrey">Questions?</h1>
    <div class="flex-col flex items-start gap-2" v-for="item in planItems" :key="item.question">
      <p class="text-lg font-golox font-bold text-periwinklegrey">{{ item.question }}</p>
      <p class="text-sm font-golox text-periwinklegrey">{{ item.text }}</p>
    </div>
    <div class="w-full px-2 py-2 h-auto flex justify-center items-center">
      <Button
        class="flex px-10 mx-10 rounded w-fit py-12 justify-center items-center bg-tiber leading-normal mt-8 text-base text-greysuit"
        href="/auth"
      >
        Contact Us.
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const planItems: { question: string; text: string }[] = [
  {
    question: "Are all the food items present in the calorie tracker?",
    text: "The answer is, yes, they are. And we'll constantly be updating the local-names for the food item and also dishes, so that you can easily find them."
  },
  {
    question: "Can I create my own workout plans irrespective of the ones suggested to me or are present already?",
    text: "Absolutely! you can create and store as many custom workouts you want to. and pretty soon, you can also share them with your friends and family."
  },
  {
    question: "Can I buy products related to fitness from here?",
    text: "Not yet, but we're working on it. We'll soon be launching our own suggestions of sets of fitness products, tried and tested, which will be available for purchase from here, by a link we provide, itself. Till then, you can check out our blog for some suggestions."
  },
  {
    question: "Where can I ask for queries and provide suggestions, if any?",
    text: "We'll soon be integrating a chatbot to solve all your queries, but if there are a few left which were unable to provide much satisfaction to you or have any suggestions, you can always contact us through the contact us page, or our email @fitnationapp77.com"
  },
];
</script>

<style lang="scss" scoped>
/* Your SCSS styles here */
</style>
