import axios, { type AxiosInstance } from 'axios'

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  api.interceptors.request.use((req) => {
    const token = useCookie<string | null>('token').value
    if (token) {
      req.headers = req.headers ?? {}
      ;(req.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }
    return req
  })

  api.interceptors.response.use(
    res => res,
    async (error) => {
      if (error?.response?.status === 401) {
        const tokenCookie = useCookie<string | null>('token')
        tokenCookie.value = null
        if (import.meta.client) {
          await nuxtApp.runWithContext(() => navigateTo('/signin'))
        }
      }
      return Promise.reject(error)
    },
  )

  return {
    provide: {
      api,
    },
  }
})
