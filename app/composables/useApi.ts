import type { AxiosInstance } from 'axios'

/**
 * Returns the shared axios instance (with baseURL + Bearer token interceptor).
 * Use for any authenticated API call:
 *
 *   const api = useApi()
 *   const { data } = await api.get('/policies')
 */
export function useApi(): AxiosInstance {
  return useNuxtApp().$api
}
