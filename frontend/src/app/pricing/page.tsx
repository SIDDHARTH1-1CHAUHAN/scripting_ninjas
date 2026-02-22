'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useMemo, useState } from 'react'

import {
  createPaymentCheckoutOrder,
  verifyPayment,
  type PaymentCheckoutOrderRequest,
} from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

type BillingCycle = 'monthly' | 'yearly'

interface PlanCard {
  tier: string
  monthly: number | null
  yearly: number | null
  whoFor: string
  includes: string[]
}

const pricing: PlanCard[] = [
  {
    tier: 'FREE',
    monthly: 0,
    yearly: 0,
    whoFor: 'Evaluation and solo users',
    includes: [
      '25 text classifications / month',
      '10 image classifications / month',
      '30 assistant messages / month',
      '15 landed-cost calculations / month',
      '5 compliance checks / month',
    ],
  },
  {
    tier: 'STARTER',
    monthly: 129,
    yearly: 1290,
    whoFor: 'Lean import teams',
    includes: [
      '900 text HS classifications / month',
      '180 image classifications / month',
      '220 compliance checks / month',
      'Cargo + FX modules and 3 seats',
      'Email support + exports',
    ],
  },
  {
    tier: 'GROWTH',
    monthly: 399,
    yearly: 3990,
    whoFor: 'Scaling multi-lane operations',
    includes: [
      '4,500 text HS classifications / month',
      '750 image classifications / month',
      '1,200 compliance checks / month',
      'API access + webhooks + analytics exports',
      '10 seats + priority support',
    ],
  },
  {
    tier: 'ENTERPRISE',
    monthly: null,
    yearly: null,
    whoFor: 'High-volume import networks',
    includes: [
      'Custom volume and SLA',
      'SSO/SAML + audit logs',
      'Custom integrations',
      'Dedicated onboarding',
      'Compliance support',
    ],
  },
]

const overages = [
  'Text classification: $0.025 / request',
  'Image classification: $0.07 / request',
  'Compliance workflow: $0.045 / check',
  'Route simulation API: $2.5 / 10,000 calls',
]

export default function PricingPage() {
  const user = useAuthStore((state) => state.user)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [isGatewayReady, setIsGatewayReady] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')

  useEffect(() => {
    if (!customerName && user?.name) {
      setCustomerName(user.name)
    }
    if (!customerEmail && user?.email) {
      setCustomerEmail(user.email)
    }
  }, [customerEmail, customerName, user?.email, user?.name])

  const planLabel = useMemo(
    () => (billingCycle === 'monthly' ? '/mo' : '/year'),
    [billingCycle],
  )

  const onCheckout = async (plan: PlanCard) => {
    if (!isGatewayReady || !window.Razorpay) {
      setStatusType('error')
      setStatusMessage('Payment gateway is still loading. Please retry in a moment.')
      return
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setStatusType('error')
      setStatusMessage('Please enter customer name and email before checkout.')
      return
    }
    if (plan.tier === 'FREE' || plan.tier === 'ENTERPRISE') {
      setStatusType('info')
      setStatusMessage(plan.tier === 'FREE' ? 'Free tier needs no checkout.' : 'Enterprise requires sales-assisted onboarding.')
      return
    }

    setPendingPlan(plan.tier)
    setStatusType('info')
    setStatusMessage(`Initializing ${plan.tier} checkout...`)

    try {
      const payload: PaymentCheckoutOrderRequest = {
        plan_tier: plan.tier,
        billing_cycle: billingCycle,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
      }
      const order = await createPaymentCheckoutOrder(payload)

      const razorpay = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'TradeOptimize AI',
        description: `${order.plan_tier} (${order.billing_cycle})`,
        order_id: order.order_id,
        prefill: {
          name: order.customer.name,
          email: order.customer.email,
        },
        notes: {
          plan_tier: order.plan_tier,
          billing_cycle: order.billing_cycle,
        },
        theme: {
          color: '#5f47a9',
        },
        handler: async (paymentResponse) => {
          try {
            const verified = await verifyPayment({
              plan_tier: order.plan_tier,
              billing_cycle: order.billing_cycle,
              customer_email: order.customer.email,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            })
            setStatusType('success')
            setStatusMessage(
              `Payment verified. ${verified.subscription.plan_tier} is active until ${new Date(verified.subscription.current_period_end).toLocaleDateString()}.`,
            )
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment verification failed'
            setStatusType('error')
            setStatusMessage(message)
          } finally {
            setPendingPlan(null)
          }
        },
        modal: {
          ondismiss: () => {
            setPendingPlan(null)
            setStatusType('info')
            setStatusMessage('Checkout closed before payment completion.')
          },
        },
      })

      razorpay.open()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout initialization failed'
      setStatusType('error')
      setStatusMessage(message)
      setPendingPlan(null)
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-text-main">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsGatewayReady(true)}
      />

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="label">TRADEOPTIMIZE AI</div>
            <h1 className="text-4xl font-bold leading-none">
              PRICING
              <br />
              <span className="font-pixel">SAAS + USAGE</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-canvas transition-colors rounded-full">
              TRY DEMO
            </Link>
            <Link href="/business" className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-canvas transition-colors rounded-full">
              ROI VIEW
            </Link>
          </div>
        </div>

        <section className="border border-dark p-4 md:p-5 rounded-3xl bg-panel/50 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs space-y-1">
                <div className="label">CUSTOMER NAME</div>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full border border-dark bg-transparent px-3 py-2 rounded-xl"
                  placeholder="Your full name"
                />
              </label>
              <label className="text-xs space-y-1">
                <div className="label">CUSTOMER EMAIL</div>
                <input
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  className="w-full border border-dark bg-transparent px-3 py-2 rounded-xl"
                  placeholder="you@company.com"
                  type="email"
                />
              </label>
            </div>
            <div className="inline-flex rounded-full border border-dark overflow-hidden h-fit">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm ${billingCycle === 'monthly' ? 'bg-dark text-text-inv' : 'bg-transparent'}`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm ${billingCycle === 'yearly' ? 'bg-dark text-text-inv' : 'bg-transparent'}`}
              >
                YEARLY
              </button>
            </div>
          </div>

          <div
            className={`text-sm border rounded-2xl px-4 py-3 ${
              statusType === 'success'
                ? 'border-[#2d7a3d] bg-[#2d7a3d]/10'
                : statusType === 'error'
                  ? 'border-warning bg-warning/10'
                  : 'border-dark/50 bg-canvas/30'
            }`}
          >
            {statusMessage || 'Razorpay test-mode checkout is enabled. Keys are handled by backend only.'}
          </div>
        </section>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pricing.map((plan) => {
            const amount = billingCycle === 'yearly' ? plan.yearly : plan.monthly
            const isPayable = typeof amount === 'number' && amount > 0
            const isPending = pendingPlan === plan.tier

            return (
              <article key={plan.tier} className="border border-dark p-4 bg-panel/40 rounded-2xl space-y-4">
                <div>
                  <div className="font-pixel text-sm">{plan.tier}</div>
                  <div className="text-3xl font-bold mt-2">
                    {amount === null ? 'Custom' : `$${amount}`}
                    {amount !== null && <span className="text-sm font-normal">{planLabel}</span>}
                  </div>
                  {plan.yearly !== null && plan.monthly !== null && (
                    <div className="text-xs opacity-70">
                      ${plan.monthly}/mo · ${plan.yearly}/year
                    </div>
                  )}
                  <div className="text-xs mt-2 opacity-75">{plan.whoFor}</div>
                </div>

                <ul className="text-xs space-y-1">
                  {plan.includes.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    void onCheckout(plan)
                  }}
                  disabled={isPending}
                  className={`w-full rounded-full px-4 py-2 text-sm border border-dark transition-colors ${
                    isPayable
                      ? 'bg-dark text-text-inv hover:bg-dark/85'
                      : 'bg-transparent text-text-main'
                  }`}
                >
                  {isPending
                    ? 'PROCESSING...'
                    : plan.tier === 'FREE'
                      ? 'CURRENTLY FREE'
                      : plan.tier === 'ENTERPRISE'
                        ? 'CONTACT SALES'
                        : `PAY ${billingCycle.toUpperCase()}`}
                </button>
              </article>
            )
          })}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="border border-dark p-4 rounded-2xl">
            <div className="label mb-2">OVERAGE PRICING</div>
            <ul className="text-sm space-y-2">
              {overages.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-dark p-4 rounded-2xl">
            <div className="label mb-2">MEMBERSHIP ADD-ON</div>
            <div className="text-lg font-semibold">Trade Intelligence Briefing - $79/mo</div>
            <ul className="text-sm mt-3 space-y-2">
              <li>• Monthly compliance clinic</li>
              <li>• Playbooks and document templates</li>
              <li>• Tariff and regulation digest</li>
              <li>• Office-hours Q&A</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
