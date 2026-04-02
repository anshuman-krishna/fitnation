// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-icon', '@nuxtjs/supabase'],
  css: ["@/assets/css/tailwind.css"],

  supabase: {
    redirectOptions: {
      login: '/auth',
      callback: '/members',
      exclude: [
        '/muscle',
        '/calorie',
        '/meditation',
        '/workouts',
        '/',
        '/meditations/page1', '/meditations/page2', '/meditations/page3', '/meditations/page4', '/meditations/page5', '/meditations/page6', '/meditations/page7', '/meditations/page8',
      ],
    }  
  },

  app: {
    head: {
      title: 'Fitnation',
      meta: [
        {name: 'description', content: 'Not just another regular fitness page'},
      ],
    }
  },
  
  tailwindcss: {
    viewer: false, // to disable the tailwind CSS viewer mode
    config: {
      theme: {
        extend: {
          colors: {
            greysuit: '#d0cdd6',   
            williamgreen: '#416165',
            black: '#000000',
            tiber: '#0b3948',
            periwinklegrey: '#d9d8f1',
            white: '#ffffff',
            test: '#24292E',
          },
          fontFamily: {
            'orelega': ["Orelega One", "sans"], 
            'golor': ["Golor Text", "serif"], 
            'abril': ["Abril Fatface", "serif"], 
          },
        },
      },
    },
  },
  
})
