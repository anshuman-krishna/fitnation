<template>
  <footer class="bg-greysuit flex text-black justify-center content-center align-center w-full h-fit py-4 px-auto">
    <div class="flex flex-col w-fit gap-3 mx-auto">
      <div class="flex flex-row gap-4 text-2xl justify-center" id="social-links">
        <a href="https://youtu.be/dQw4w9WgXcQ?si=qDvYMns7bGo0fKVl" class="hover:text-red-600 duration-500 ease-in-out">
          <Icon name="mdi:youtube" />
        </a>
        <a href="https://youtu.be/dQw4w9WgXcQ?si=qDvYMns7bGo0fKVl" class="hover:text-sky-600 duration-500 ease-in-out">
          <Icon name="mdi:twitter" />
        </a>
        <a href="https://youtu.be/dQw4w9WgXcQ?si=qDvYMns7bGo0fKVl" class="hover:text-fuchsia-600 duration-500 ease-in-out">
          <Icon name="mdi:instagram" />
        </a>
        <a href="https://youtu.be/dQw4w9WgXcQ?si=qDvYMns7bGo0fKVl" class="hover:text-sky-600 duration-500 ease-in-out">
          <Icon name="mdi:linkedin" />
        </a>
      </div>
      <div class="flex flex-row justify-center items-center gap-1.5">
        <Icon name="mdi:copyright" />
        <p class="text-lg">{{ new Date().getFullYear() }} FitnationApp</p>
      </div>
    </div>
  </footer>
</template>
