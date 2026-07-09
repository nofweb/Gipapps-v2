import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, {
    autoClose: 4000,
    position: 'top-right',
    // `colored` gives solid backgrounds with white text:
    // error → red, success → green, warning → amber, info → blue.
    theme: 'colored',
  } as ToastContainerOptions)
})
