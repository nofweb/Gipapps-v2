<script setup lang="ts">
import { Check } from 'lucide-vue-next'

interface Step {
  number: number
  label: string
}

const props = defineProps<{
  current: number
  steps: Step[]
}>()

const progress = computed(() => {
  if (props.steps.length <= 1) return 0
  return ((props.current - 1) / (props.steps.length - 1)) * 100
})
</script>

<template>
  <div>
    <!-- Mobile -->
    <div class="md:hidden">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-secondary-700">Step {{ current }} of {{ steps.length }}</span>
        <span class="text-secondary-500">
          {{ steps.find((s) => s.number === current)?.label }}
        </span>
      </div>
      <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary-100">
        <div
          class="h-full rounded-full bg-gradient-primary transition-all duration-500"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Desktop -->
    <div class="hidden md:block">
      <div class="relative">
        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-secondary-100" />
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gradient-primary transition-all duration-500"
          :style="{ width: `${progress}%` }"
        />
        <ol class="relative flex items-center justify-between">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-center gap-2"
          >
            <span
              :class="[
                'flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300',
                step.number < current
                  ? 'border-primary bg-primary text-primary-foreground shadow-glow-primary'
                  : step.number === current
                    ? 'border-primary bg-card text-primary-700 scale-110 shadow-md'
                    : 'border-secondary-200 bg-card text-secondary-500',
              ]"
            >
              <Check v-if="step.number < current" class="size-4" />
              <span v-else>{{ step.number }}</span>
            </span>
            <span
              :class="[
                'text-[11px] font-medium leading-tight text-center max-w-20',
                step.number === current ? 'text-secondary-900' : 'text-secondary-500',
              ]"
            >
              {{ step.label }}
            </span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
