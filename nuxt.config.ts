import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  css: ['~/assets/css/main.css'],

  components: {
    dirs: [
      {
        path: '~/components',
        extensions: ['vue'],
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'Guinea Insurance - Customer Portal',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Guinea Insurance Customer Portal — manage all your insurance products in one place.',
        },
        { name: 'theme-color', content: '#a8cf45' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase:
        process.env.API_URL
        || process.env.NUXT_PUBLIC_API_BASE
        || 'https://testapis.guineainsurance.com/api',
      paystackPublicKey: process.env.NUXT_PAYSTACK_PUBLIC_KEY || '',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
