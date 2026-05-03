import { useAuthStore } from '~/stores/auth'

/**
 * Named route middleware: requires an authenticated user.
 * Apply on protected pages via:
 *   definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const token = useCookie<string | null>('token')

  if (token.value) {
    auth.authenticated = true
    if (!auth.token) auth.token = token.value
    return
  }

  auth.authenticated = false
  return navigateTo({
    path: '/signin',
    query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
  })
})
