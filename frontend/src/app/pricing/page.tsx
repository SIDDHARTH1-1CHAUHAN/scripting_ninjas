import Link from 'next/link'

const pricing = [
  {
    tier: 'FREE',
    monthly: '$0',
    yearly: '$0',
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
    monthly: '$149',
    yearly: '$1,490',
    whoFor: 'Small import teams',
    includes: [
      '800 text classifications / month',
      '150 image classifications / month',
      '200 compliance checks / month',
      '3 seats + CSV exports',
      'Email support',
    ],
  },
  {
    tier: 'GROWTH',
    monthly: '$499',
    yearly: '$4,990',
    whoFor: 'Scaling import operations',
    includes: [
      '4,000 text classifications / month',
      '600 image classifications / month',
      '1,000 compliance checks / month',
      'API access + webhooks',
      '10 seats + priority support',
    ],
  },
  {
    tier: 'ENTERPRISE',
    monthly: '$1,499+',
    yearly: '$14,990+',
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
  'Text classification: $0.03 / request',
  'Image classification: $0.08 / request',
  'Compliance check: $0.05 / request',
  'API usage: $2 / 10,000 calls',
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-canvas text-text-main">
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="label">TRADEOPTIMIZE AI</div>
            <h1 className="text-4xl font-bold leading-none">
              PRICING
              <br />
              <span className="font-pixel">SaaS + USAGE</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-canvas transition-colors">
              TRY DEMO
            </Link>
            <Link href="/business" className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-canvas transition-colors">
              ROI VIEW
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pricing.map((plan) => (
            <article key={plan.tier} className="border border-dark p-4 bg-panel/40">
              <div className="font-pixel text-sm">{plan.tier}</div>
              <div className="text-3xl font-bold mt-2">{plan.monthly}<span className="text-sm font-normal">/mo</span></div>
              <div className="text-xs opacity-70">{plan.yearly}/year</div>
              <div className="text-xs mt-2 opacity-75">{plan.whoFor}</div>
              <ul className="text-xs mt-4 space-y-1">
                {plan.includes.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="border border-dark p-4">
            <div className="label mb-2">OVERAGE PRICING</div>
            <ul className="text-sm space-y-2">
              {overages.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-dark p-4">
            <div className="label mb-2">MEMBERSHIP ADD-ON</div>
            <div className="text-lg font-semibold">TradeOptimize Membership - $99/mo</div>
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
