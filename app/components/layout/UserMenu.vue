<script setup lang="ts">
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { Avatar } from '~/components/ui/avatar'

const auth = useAuthStore()
const { user, fullName, initials } = storeToRefs(auth)
const router = useRouter()

async function handleLogout() {
  auth.logUserOut()
  await router.push('/signin')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      as-child
      class="cursor-pointer focus:outline-none"
    >
      <button
        type="button"
        class="group flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
      >
        <Avatar :initials="initials" size="sm" />
        <span class="hidden text-sm font-semibold text-secondary-800 sm:block">
          {{ fullName || user?.email || 'Account' }}
        </span>
        <ChevronDown class="hidden size-4 text-secondary-500 transition-transform group-data-[state=open]:rotate-180 sm:block" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" :side-offset="8" class="w-64">
      <div class="flex items-center gap-3 px-3 py-3">
        <Avatar :initials="initials" size="md" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-secondary-900">
            {{ fullName || 'Welcome' }}
          </p>
          <p class="truncate text-xs text-secondary-500">
            {{ user?.email || 'Signed in' }}
          </p>
        </div>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem>
        <UserIcon class="size-4 text-secondary-500" />
        <span>My Profile</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings class="size-4 text-secondary-500" />
        <span>Settings</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        class="data-[highlighted]:bg-tertiary-50 data-[highlighted]:text-tertiary-700"
        @select="handleLogout"
      >
        <LogOut class="size-4 text-tertiary-500" />
        <span class="font-medium">Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
