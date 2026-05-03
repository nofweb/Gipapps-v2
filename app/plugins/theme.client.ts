import { useThemeStore } from '~/stores/theme'

export default defineNuxtPlugin(() => {
  const theme = useThemeStore()
  theme.apply()

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', () => {
      if (theme.mode === 'system') theme.apply()
    })
  }
})
