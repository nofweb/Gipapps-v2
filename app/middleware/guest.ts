/**
 * Named route middleware: blocks routes when the user is already authenticated.
 * Apply on signin / forgot-password pages via:
 *   definePageMeta({ middleware: 'guest' })
 */
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie<string | null>('token')
  if (token.value) {
    return navigateTo('/')
  }
})
