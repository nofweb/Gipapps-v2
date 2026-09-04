<script setup lang="ts">
import { ArrowLeft, ArrowRight, AlertTriangle, Send, Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { HOMESHIELD_QUESTIONS } from '~/utils/homeshield-constants'

const app = useHomeshieldApplicationStore()
const { questionnaire, referring, referError } = storeToRefs(app)

const error = ref<string | null>(null)

// Resume where the client left off when returning to this step.
const firstUnanswered = questionnaire.value.findIndex(q => !q.answer)
const index = ref(firstUnanswered === -1 ? HOMESHIELD_QUESTIONS.length - 1 : firstUnanswered)

const question = computed(() => HOMESHIELD_QUESTIONS[index.value]!)
const answer = computed(() => questionnaire.value.find(q => q.id === question.value.id))
const isLast = computed(() => index.value === HOMESHIELD_QUESTIONS.length - 1)
const progress = computed(() => ((index.value + 1) / HOMESHIELD_QUESTIONS.length) * 100)

// This answer refers the client to underwriting — the online flow stops here.
const isBlocked = computed(() => !!question.value.blockOn && answer.value?.answer === question.value.blockOn)

// Questions that offer reasons collect one instead of free-text details.
const needsReason = computed(() =>
  !!question.value.reasonOptions?.length && answer.value?.answer === 'yes' && !isBlocked.value)
const needsDetails = computed(() =>
  question.value.requiresDetails && answer.value?.answer === 'yes' && !isBlocked.value && !needsReason.value)

/** The chosen reason ends the application — this risk cannot be written at all. */
const isDeclined = computed(() => {
  if (!needsReason.value) return false
  return question.value.reasonOptions?.find(o => o.id === answer.value?.reason)?.declines === true
})

function setAnswer(ans: 'yes' | 'no') {
  app.setQuestionnaireAnswer(question.value.id, ans)
  error.value = null
}

function setDetails(e: Event) {
  app.setQuestionnaireDetails(question.value.id, (e.target as HTMLTextAreaElement).value)
}

// Hand the declined risk to underwriting and end the online application.
async function sendToUnderwriting() {
  await app.submitReferral(question.value.id)
}

function back() {
  error.value = null
  if (index.value > 0) index.value -= 1
  else app.prev()
}

function proceed() {
  error.value = null

  if (!answer.value?.answer) {
    error.value = 'Please answer this question to continue'
    return
  }
  if (isBlocked.value) return
  if (needsReason.value && answer.value.reason === null) {
    error.value = 'Please select the applicable reason'
    return
  }
  if (isDeclined.value) return
  if (needsDetails.value && !answer.value.details.trim()) {
    error.value = 'Please provide details for your answer'
    return
  }

  if (isLast.value) app.next()
  else index.value += 1
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

    <div class="flex items-center justify-between text-xs font-medium text-secondary-500">
      <span>Question {{ index + 1 }} of {{ HOMESHIELD_QUESTIONS.length }}</span>
    </div>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-secondary-100">
      <div
        class="h-full rounded-full bg-primary transition-all duration-300 ease-out"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 translate-x-3"
      leave-to-class="opacity-0 -translate-x-3"
    >
      <div :key="question.id" class="rounded-2xl border border-secondary-100 bg-card p-4">
        <div class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
            {{ index + 1 }}
          </span>
          <p class="flex-1 text-sm font-medium leading-relaxed text-secondary-900">{{ question.text }}</p>
        </div>

        <div class="mt-3 ml-10 flex gap-2">
          <button
            v-for="ans in ['yes', 'no'] as const"
            :key="ans"
            type="button"
            :aria-pressed="answer?.answer === ans"
            :class="[
              'flex-1 rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer max-w-[8rem]',
              answer?.answer === ans
                ? ans === 'yes'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-secondary-800 bg-secondary-800 text-white'
                : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
            ]"
            @click="setAnswer(ans)"
          >
            {{ ans }}
          </button>
        </div>

        <div v-if="needsReason" class="ml-10 mt-4">
          <p class="input-label">Please select the applicable reason</p>
          <div class="mt-2 space-y-2">
            <button
              v-for="opt in question.reasonOptions"
              :key="opt.id"
              type="button"
              :aria-pressed="answer?.reason === opt.id"
              :class="[
                'flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors cursor-pointer',
                answer?.reason === opt.id
                  ? 'border-primary bg-primary-50'
                  : 'border-secondary-100 bg-card hover:border-primary-200',
              ]"
              @click="app.setQuestionnaireReason(question.id, opt.id)"
            >
              <span
                :class="[
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                  answer?.reason === opt.id ? 'border-primary bg-primary' : 'border-secondary-200',
                ]"
              >
                <span v-if="answer?.reason === opt.id" class="size-1.5 rounded-full bg-primary-foreground" />
              </span>
              <span class="text-sm leading-relaxed text-secondary-700">{{ opt.id }}. {{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- This reason cannot be covered — the application ends here. -->
        <div v-if="isDeclined" class="ml-10 mt-4 rounded-xl border border-tertiary-200 bg-tertiary-50 p-4">
          <div class="flex items-start gap-3">
            <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
            <div class="text-sm leading-relaxed text-secondary-700">
              <p class="font-semibold text-secondary-900">We’re unable to proceed.</p>
              <p class="mt-1">
                Cover cannot be offered as a previous insurer has declined or terminated your cover
                for this reason.
              </p>
            </div>
          </div>
        </div>

        <div v-if="needsDetails" class="ml-10 mt-3">
          <label class="input-label">{{ question.detailsPrompt || 'Please provide details' }}</label>
          <textarea
            :value="answer?.details"
            rows="2"
            class="input-field"
            :placeholder="question.detailsPrompt || 'Add the details we should know about'"
            @input="setDetails"
          />
        </div>

        <!-- Referral notice — this answer stops the online application -->
        <div v-if="isBlocked" class="ml-10 mt-4 rounded-xl border border-tertiary-200 bg-tertiary-50 p-4">
          <div class="flex items-start gap-3">
            <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
            <div class="text-sm leading-relaxed text-secondary-700">
              <p>
                This risk cannot be completed online. Tap the button below and your details will be sent to our
                technical underwriting team — they will contact you to complete this policy.
              </p>
              <p class="mt-2 text-xs text-secondary-500">
                We will share your name, phone number, email, address, property usage and type, property value and location.
              </p>
              <button
                type="button"
                class="btn-primary mt-4"
                :disabled="referring"
                @click="sendToUnderwriting"
              >
                <Loader2 v-if="referring" class="size-4 animate-spin" />
                <Send v-else class="size-4" />
                {{ referring ? 'Sending…' : 'Send my details to underwriting' }}
              </button>
              <p v-if="referError" class="mt-2 text-xs text-tertiary-500">{{ referError }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="error" class="text-sm font-medium text-tertiary-500">{{ error }}</p>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="back">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" :disabled="isBlocked || isDeclined" @click="proceed">
        {{ isLast ? 'Continue' : 'Next question' }} <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
