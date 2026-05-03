<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { HOMESHIELD_QUESTIONS } from '~/utils/homeshield-constants'

const app = useHomeshieldApplicationStore()
const { questionnaire } = storeToRefs(app)

const error = ref<string | null>(null)

function getMeta(id: number) {
  return HOMESHIELD_QUESTIONS.find(q => q.id === id)
}

function getAnswer(id: number) {
  return questionnaire.value.find(q => q.id === id)
}

function setAnswer(id: number, ans: 'yes' | 'no') {
  app.setQuestionnaireAnswer(id, ans)
  error.value = null
}

function setDetails(id: number, e: Event) {
  app.setQuestionnaireDetails(id, (e.target as HTMLTextAreaElement).value)
}

function proceed() {
  for (const q of questionnaire.value) {
    if (!q.answer) {
      error.value = `Please answer question ${q.id}`
      return
    }
    const meta = getMeta(q.id)
    if (meta?.requiresDetails && q.answer === 'yes' && !q.details.trim()) {
      error.value = `Please provide details for question ${q.id}`
      return
    }
  }
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Proposal questionnaire</h2>
      <p class="mt-1 text-sm text-secondary-500">
        These help us assess the risk on the property.
      </p>
    </header>

    <ul class="space-y-4">
      <li
        v-for="q in HOMESHIELD_QUESTIONS"
        :key="q.id"
        class="rounded-2xl border border-secondary-100 bg-card p-4"
      >
        <div class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
            {{ q.id }}
          </span>
          <p class="flex-1 text-sm font-medium text-secondary-900 leading-relaxed">{{ q.text }}</p>
        </div>

        <div class="mt-3 ml-10 flex gap-2">
          <button
            v-for="ans in ['yes', 'no'] as const"
            :key="ans"
            type="button"
            :aria-pressed="getAnswer(q.id)?.answer === ans"
            :class="[
              'flex-1 rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer max-w-[8rem]',
              getAnswer(q.id)?.answer === ans
                ? ans === 'yes'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-secondary-800 bg-secondary-800 text-white'
                : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
            ]"
            @click="setAnswer(q.id, ans)"
          >
            {{ ans }}
          </button>
        </div>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          leave-active-class="transition duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0"
        >
          <div
            v-if="q.requiresDetails && getAnswer(q.id)?.answer === 'yes'"
            class="ml-10 mt-3"
          >
            <label class="input-label">Please provide details</label>
            <textarea
              :value="getAnswer(q.id)?.details"
              rows="2"
              class="input-field"
              placeholder="Add the details we should know about"
              @input="(e) => setDetails(q.id, e)"
            />
          </div>
        </Transition>
      </li>
    </ul>

    <p v-if="error" class="text-sm font-medium text-tertiary-500">{{ error }}</p>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
