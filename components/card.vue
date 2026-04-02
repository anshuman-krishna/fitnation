<template>
  <div :class="cardClasses">
    <img :src="imageSrc" :alt="imageAlt" class="w-full h-48 object-cover" />
    <div class="p-4">
      <h2 class="text-2xl font-semibold">{{ title }}</h2>
      <p class="text-gray-600 mt-2">{{ description }}</p>
      <Button :href="buttonLink" class="btn bg-tiber text-greysuit mt-4 rounded">{{ buttonText }}</Button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    cardClasses: {
      type: String,
      required: true,
    },
    imageSrc: {
      type: String,
      required: true,
    },
    imageAlt: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    buttonLink: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
  },
};
</script>
