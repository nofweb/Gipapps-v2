import axios, { type AxiosInstance, isAxiosError } from 'axios'
import { toast } from 'vue3-toastify'

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

// Per-request opt-outs for the global API-message toasts.
declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean
    skipSuccessToast?: boolean
  }
}

/** Best-effort, human-readable message from an Axios/Error/unknown failure. */
function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const serverMsg = (err.response?.data as { message?: string } | undefined)?.message
    if (typeof serverMsg === 'string' && serverMsg.length > 0) return serverMsg
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong. Please try again.'
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

  // Response interceptor — surfaces the API's message as a toast (rendered
  // top-right by vue3-toastify): green for success, red for errors. Callers that
  // show their own tailored message opt out per request with
  // `{ skipSuccessToast: true }` / `{ skipErrorToast: true }`.
  api.interceptors.response.use(
    (res) => {
      const body = res.data as { status?: string; ok?: boolean; message?: string } | undefined
      const failed = (body?.status !== undefined && body.status !== 'success') || body?.ok === false
      // Only surface success messages for mutations — GET reads (lists,
      // dashboards, lookups) also carry a `message` and would be noise.
      const isMutation = (res.config?.method ?? 'get').toLowerCase() !== 'get'
      if (isMutation && !res.config?.skipSuccessToast && !failed && typeof body?.message === 'string' && body.message.length > 0) {
        toast.success(body.message)
      }
      return res
    },
    async (error) => {
      if (error?.response?.status === 401) {
        const tokenCookie = useCookie<string | null>('token')
        tokenCookie.value = null
        if (import.meta.client) {
          await nuxtApp.runWithContext(() => navigateTo('/signin'))
        }
      }
      if (!(isAxiosError(error) && error.config?.skipErrorToast === true)) {
        toast.error(extractErrorMessage(error))
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
