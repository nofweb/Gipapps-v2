<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  auth.logUserOut()
  await router.push('/signin')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-sm text-secondary-500">Signing you out…</p>
  </div>
</template>
