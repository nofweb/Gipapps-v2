import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type { LoginPayload, LoginResponse, User } from '~/types/auth'

interface AuthState {
  authenticated: boolean
  loading: boolean
  user: User | null
  token: string | null
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    authenticated: false,
    loading: false,
    user: null,
    token: null,
    error: null,
  }),

  getters: {
    fullName(state): string {
      const { first_name, last_name } = state.user ?? {}
      return [first_name, last_name].filter(Boolean).join(' ').trim()
    },
    initials(state): string {
      const { first_name, last_name } = state.user ?? {}
      const f = (first_name ?? '').trim().charAt(0)
      const l = (last_name ?? '').trim().charAt(0)
      return (f + l).toUpperCase() || 'GI'
    },
  },

  actions: {
    async authenticateUser(payload: LoginPayload) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const { data } = await api.post<LoginResponse>(
          '/customer/auth/login',
          payload,
        )

        const tokenCookie = useCookie<string | null>('token', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        })
        tokenCookie.value = data.data.access_token

        this.token = data.data.access_token
        this.user = data.data.user
        this.authenticated = true
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to sign in'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.error = message
        throw err
      }
      finally {
        this.loading = false
      }
    },

    async forgotPassword(email: string) {
      const api = useApi()
      const { data } = await api.post('/customer/auth/forgot-password', { email })
      return data
    },

    logUserOut() {
      this.authenticated = false
      this.user = null
      this.token = null
      const tokenCookie = useCookie<string | null>('token')
      tokenCookie.value = null
    },

    hydrateFromCookie() {
      const tokenCookie = useCookie<string | null>('token')
      if (tokenCookie.value) {
        this.token = tokenCookie.value
        this.authenticated = true
      }
    },
  },

  persist: {
    pick: ['user', 'authenticated'],
  },
})
