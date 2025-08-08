// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Progress Nuxt"
    }
  },
  runtimeConfig: {
    steamApiKey: "",
    public: {
      gsiServer: ""
    }
  },
  ssr: false
})
