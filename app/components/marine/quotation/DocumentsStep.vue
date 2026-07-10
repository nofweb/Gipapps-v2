<script setup lang="ts">
import { ArrowLeft, ArrowRight, UploadCloud, Loader2, CheckCircle2, FileText, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'
import { useUpload } from '~/composables/useUpload'

const app = useMarineQuotationStore()
const { proforma_invoice_number, proformaFileUrl, proformaFileName } = storeToRefs(app)

const { uploadFile } = useUpload()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')

const MAX_MB = 5

function pickFile() {
  fileInput.value?.click()
}

async function handleFile(file: File) {
  uploadError.value = ''
  if (file.size > MAX_MB * 1024 * 1024) {
    uploadError.value = `File is larger than ${MAX_MB}MB.`
    return
  }
  proformaFileName.value = file.name
  uploading.value = true
  try {
    proformaFileUrl.value = await uploadFile(file, 'marine')
  }
  catch (err) {
    proformaFileUrl.value = ''
    uploadError.value = err instanceof Error ? err.message : 'Upload failed. Please try again.'
  }
  finally {
    uploading.value = false
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
  target.value = ''
}

function clearFile() {
  app.clearProforma()
  uploadError.value = ''
}

function proceed() {
  if (!proforma_invoice_number.value) return toast.error('Proforma invoice number is required')
  if (uploading.value) return toast.error('Please wait for the upload to finish')
  if (!proformaFileUrl.value) return toast.error('Please upload the proforma invoice file')
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Proforma invoice</h2>
      <p class="mt-1 text-sm text-secondary-500">Attach the proforma invoice for this shipment.</p>
    </header>

    <div class="space-y-4">
      <div>
        <label class="input-label" for="proforma_invoice_number">Proforma invoice number</label>
        <input id="proforma_invoice_number" v-model="proforma_invoice_number" type="text" class="input-field" placeholder="Proforma invoice number">
      </div>

      <div>
        <p class="input-label">Upload proforma invoice</p>

        <!-- Empty / dropzone state -->
        <button
          v-if="!proformaFileUrl && !uploading"
          type="button"
          class="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-secondary-200 px-6 py-8 transition-colors hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="pickFile"
        >
          <span class="flex size-11 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">
            <UploadCloud class="size-5" aria-hidden="true" />
          </span>
          <span class="text-sm font-medium text-secondary-900">
            Click to <span class="text-primary-700 underline underline-offset-2">upload a document</span>
          </span>
          <span class="text-xs text-secondary-500">PDF, PNG or JPG • up to {{ MAX_MB }}MB</span>
        </button>

        <!-- Uploading / uploaded state -->
        <div v-else class="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
          <div class="flex items-start gap-3">
            <span
              :class="[
                'flex size-9 shrink-0 items-center justify-center rounded-xl',
                uploading ? 'bg-secondary-100 text-secondary-700' : 'bg-primary text-primary-foreground',
              ]"
            >
              <Loader2 v-if="uploading" class="size-4 animate-spin" aria-hidden="true" />
              <CheckCircle2 v-else-if="proformaFileUrl" class="size-4" aria-hidden="true" />
              <FileText v-else class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-secondary-900">
                {{ proformaFileName || (proformaFileUrl ? proformaFileUrl.split('/').pop() : 'Uploaded') }}
              </p>
              <p class="text-xs text-secondary-500">
                <template v-if="uploading">Uploading…</template>
                <template v-else-if="proformaFileUrl">Uploaded successfully</template>
              </p>
            </div>
            <button
              v-if="!uploading"
              type="button"
              class="text-secondary-500 hover:text-tertiary-600 transition-colors cursor-pointer"
              aria-label="Remove file"
              @click="clearFile"
            >
              <X class="size-4" />
            </button>
          </div>
        </div>

        <p v-if="uploadError" class="mt-2 text-xs text-tertiary-500">{{ uploadError }}</p>

        <input
          ref="fileInput"
          type="file"
          class="sr-only"
          accept="application/pdf,image/png,image/jpeg"
          @change="onFileChange"
        >
      </div>
    </div>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" @click="proceed">
        Review <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
