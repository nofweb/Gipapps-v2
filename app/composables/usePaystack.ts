interface PaystackHandler {
  openIframe: () => void
}

interface PaystackSetupOptions {
  key: string
  email: string
  amount: number
  currency?: string
  ref?: string
  callback?: (resp: { reference: string; status?: string; message?: string }) => void
  onClose?: () => void
}

interface PaystackPop {
  setup: (options: PaystackSetupOptions) => PaystackHandler
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop
  }
}

const PAYSTACK_SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js'
let loadPromise: Promise<void> | null = null

export function loadPaystack(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Paystack can only load in the browser'))
  }
  if (window.PaystackPop) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PAYSTACK_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')))
      return
    }
    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.head.appendChild(script)
  }).catch((err) => {
    loadPromise = null
    throw err
  })

  return loadPromise
}

export interface PaystackResult {
  reference: string
  status?: string
  message?: string
}

/**
 * Opens the Paystack inline popup. Resolves with the response on success,
 * rejects with an error if the user closes the popup.
 */
export async function openPaystack(opts: {
  email: string
  amountInKobo: number
  reference: string
  onClose?: () => void
}): Promise<PaystackResult> {
  await loadPaystack()
  const { public: pub } = useRuntimeConfig()
  const key = (pub.paystackPublicKey as string) || ''
  if (!key) throw new Error('Paystack public key is not configured')

  return new Promise<PaystackResult>((resolve, reject) => {
    let settled = false
    const handler = window.PaystackPop!.setup({
      key,
      email: opts.email,
      amount: opts.amountInKobo,
      currency: 'NGN',
      ref: opts.reference,
      callback: (resp) => {
        settled = true
        resolve(resp as PaystackResult)
      },
      onClose: () => {
        opts.onClose?.()
        if (!settled) reject(new Error('Payment was cancelled'))
      },
    })
    handler.openIframe()
  })
}

export function generateTransactionReference(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `GIP-HS-${stamp}-${random}`
}
