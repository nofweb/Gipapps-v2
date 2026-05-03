<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff, Car, Home, Anchor } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth',
  name: 'signin',
  middleware: 'guest',
})

const auth = useAuthStore()
const route = useRoute()

const email = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)

async function handleSubmit() {
  if (!email.value || !password.value) {
    toast.warning('Please enter both your email and password.')
    return
  }
  try {
    await auth.authenticateUser({ email: email.value.trim(), password: password.value })
    toast.success('Welcome back!')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect, { replace: true })
  }
  catch (err) {
    const message
      = auth.error
      || (err instanceof Error ? err.message : null)
      || 'Sign in failed. Please check your credentials and try again.'
    toast.error(message)
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Left: marketing pane -->
    <aside class="relative hidden overflow-hidden bg-gradient-hero text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div class="absolute inset-0 bg-gradient-radial-primary opacity-80" aria-hidden="true" />
      <div class="absolute -bottom-24 -right-24 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />

      <div class="relative flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur w-fit">
        <img src="/logo.png" alt="Guinea Insurance" class="h-9 w-auto object-contain">
        <span class="text-[10px] font-medium uppercase tracking-widest text-primary-200">Customer Portal</span>
      </div>

      <div class="relative max-w-md">
        <p class="text-sm font-semibold uppercase tracking-widest text-primary">All your cover. One place.</p>
        <h1 class="mt-3 text-4xl font-bold leading-tight">
          Manage every Guinea Insurance product from a single dashboard.
        </h1>
        <p class="mt-4 text-base text-secondary-200">
          View your motor, homeshield, and marine policies side by side. Renew, file claims, and track everything from one secure place.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Car class="size-4 text-primary" /> Motor
          </span>
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Home class="size-4 text-primary" /> Homeshield
          </span>
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Anchor class="size-4 text-primary" /> Marine
          </span>
        </div>
      </div>

      <p class="relative text-xs text-secondary-300">
        © {{ new Date().getFullYear() }} Guinea Insurance Plc. All rights reserved.
      </p>
    </aside>

    <!-- Right: form pane -->
    <section class="flex items-center justify-center px-6 py-12 sm:px-12">
      <div class="w-full max-w-md animate-slide-up">
        <div class="mb-8 lg:hidden">
          <img src="/logo.png" alt="Guinea Insurance" class="h-9 w-auto object-contain">
        </div>

        <h2 class="text-3xl font-bold text-secondary-900">Sign in</h2>
        <p class="mt-1.5 text-sm text-secondary-500">
          Welcome back. Enter your details to access your dashboard.
        </p>

        <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="input-label">Email address</label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="input-field pl-11"
                required
              >
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="password" class="input-label">Password</label>
              <a href="#" class="text-xs font-semibold text-primary-700 hover:text-primary-600">
                Forgot password?
              </a>
            </div>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="input-field pl-11 pr-11"
                required
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-700 cursor-pointer"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOff : Eye" class="size-4" />
              </button>
            </div>
          </div>

          <label class="flex items-center gap-2 select-none cursor-pointer">
            <input
              v-model="remember"
              type="checkbox"
              class="size-4 rounded border-secondary-300 text-primary focus:ring-primary cursor-pointer"
            >
            <span class="text-sm text-secondary-700">Remember me on this device</span>
          </label>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="auth.loading"
          >
            <span
              v-if="auth.loading"
              class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
            {{ auth.loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-secondary-500">
          Need an account?
          <a
            href="mailto:customerexperience@guineainsurance.com"
            class="font-semibold text-primary-700 hover:text-primary-600"
          >
            Contact customer experience
          </a>
        </p>
      </div>
    </section>
  </div>
</template>
