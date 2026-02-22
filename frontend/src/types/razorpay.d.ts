interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
  }
  theme?: {
    color?: string
  }
  notes?: Record<string, string>
  handler?: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void | Promise<void>
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayInstance {
  open: () => void
}

interface Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance
}

