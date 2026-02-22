import Link from 'next/link'
import { AppLogo } from '@/components/brand/AppLogo'
import { LandingThemeToggle } from '@/components/landing/LandingThemeToggle'
import { Reveal } from '@/components/landing/Reveal'

const journey = [
  {
    step: '01',
    title: 'Supplier Quote Lands',
    detail: 'You ingest product specs, Incoterms, and supplier pricing in one workspace.',
  },
  {
    step: '02',
    title: 'AI Maps Risk + Cost',
    detail: 'TradeOptimize scores HS confidence, estimates landed cost, and flags compliance exposure.',
  },
  {
    step: '03',
    title: 'Team Ships With Clarity',
    detail: 'Ops, finance, and compliance work from one plan before cargo leaves origin.',
  },
]

const capabilities = [
  {
    title: 'Classify Precisely',
    detail: 'Text + image classification with confidence signals and alternative codes.',
  },
  {
    title: 'Price Reality',
    detail: 'Landed cost engine models duties, freight volatility, and margin impact.',
  },
  {
    title: 'Comply Proactively',
    detail: 'Sanctions checks and document controls reduce clearance-day surprises.',
  },
]

const highlights = [
  { label: 'HS decisions', value: 'under 3s' },
  { label: 'Core modules', value: '5 connected' },
  { label: 'Primary users', value: 'import & compliance teams' },
]

export default function Home() {
  return (
    <main className="landing-root relative min-h-screen overflow-hidden text-[var(--landing-ink)]">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />
      <div className="landing-glow landing-glow-c" />

      <section className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
        <Reveal>
          <header className="curve-shell landing-surface px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <AppLogo size="sm" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href="/pricing" className="curve-chip landing-chip px-4 py-2">
                  Pricing
                </Link>
                <Link href="/login" className="curve-chip landing-chip px-4 py-2">
                  Login
                </Link>
                <LandingThemeToggle />
                <Link href="/signup" className="curve-chip landing-cta px-4 py-2 font-pixel">
                  Start Free
                </Link>
              </div>
            </div>
          </header>
        </Reveal>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal variant="left" delay={30}>
            <article className="curve-panel landing-primary p-8 md:p-9">
              <div className="label landing-kicker">FROM SUPPLIER QUOTE TO CUSTOMS CLEARANCE</div>
              <h1 className="landing-title mt-3 text-4xl font-bold leading-[0.94] md:text-6xl">
                BUILD THE STORY
                <br />
                <span className="font-pixel">BEFORE THE SHIPMENT.</span>
              </h1>
              <p className="landing-copy mt-5 max-w-2xl text-base md:text-lg">
                TradeOptimize AI gives your team one narrative for every import lane: what to classify, what it will cost, what can block clearance, and what to do next.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="curve-chip landing-cta px-5 py-3 text-sm font-pixel">
                  START FREE TRIAL
                </Link>
                <Link href="/login" className="curve-chip landing-chip px-5 py-3 text-sm">
                  TRY LIVE DEMO
                </Link>
                <Link href="/pricing" className="curve-chip landing-chip px-5 py-3 text-sm">
                  VIEW PRICING
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="curve-chip landing-tag px-3 py-1">HS + Image Classification</span>
                <span className="curve-chip landing-tag px-3 py-1">Landed Cost + Tariff Simulation</span>
                <span className="curve-chip landing-tag px-3 py-1">Compliance + Document Guardrails</span>
              </div>
            </article>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <aside className="curve-panel landing-secondary p-6">
              <div className="label landing-kicker mb-3">CONTROL TOWER SNAPSHOT</div>
              <div className="space-y-3">
                {highlights.map((item, idx) => (
                  <div key={item.label} className="curve-card landing-card p-4" style={{ transitionDelay: `${100 + idx * 55}ms` }}>
                    <div className="text-xs uppercase tracking-[0.07em] text-[var(--landing-muted)]">{item.label}</div>
                    <div className="mt-1 text-xl font-semibold md:text-2xl">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="curve-card landing-note mt-5 px-4 py-3 text-xs">
                Smoother visual hierarchy, softer contrast, and deliberate depth for a polished operator-facing feel.
              </div>
            </aside>
          </Reveal>
        </div>

        <div className="mt-6">
          <Reveal>
            <section className="curve-panel landing-surface p-6 md:p-8">
              <div className="label landing-kicker">SHIPMENT STORY ARC</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {journey.map((item, idx) => (
                  <Reveal key={item.title} delay={90 + idx * 90}>
                    <article className="curve-card landing-card h-full p-4">
                      <div className="text-xs font-pixel text-[var(--landing-muted)]">STEP {item.step}</div>
                      <div className="mt-1 font-pixel text-sm md:text-base">{item.title}</div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{item.detail}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {capabilities.map((item, idx) => (
            <Reveal key={item.title} delay={120 + idx * 90}>
              <article className="curve-card landing-card landing-capability p-5">
                <div className="font-pixel text-sm md:text-base">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{item.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}
