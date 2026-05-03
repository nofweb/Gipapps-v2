import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
}

function systemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    mode: 'light',
  }),

  getters: {
    /** The actual theme being rendered (resolves 'system'). */
    resolved(state): 'light' | 'dark' {
      if (state.mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
      return state.mode
    },
    isDark(): boolean {
      return this.resolved === 'dark'
    },
  },

  actions: {
    apply() {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      if (this.resolved === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
      root.style.colorScheme = this.resolved
    },
    setMode(mode: ThemeMode) {
      this.mode = mode
      this.apply()
    },
    toggle() {
      this.setMode(this.resolved === 'dark' ? 'light' : 'dark')
    },
  },

  persist: {
    pick: ['mode'],
  },
})
