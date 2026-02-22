'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { generateBusinessPitch, getBusinessModel } from '@/lib/api'

export default function BusinessPage() {
  const [prompt, setPrompt] = useState(
    'Create a crisp 90-second hackathon pitch for TradeOptimize AI focused on ROI for import teams.',
  )
  const [monthlyImportValue, setMonthlyImportValue] = useState(250000)
  const [averageDutyRate, setAverageDutyRate] = useState(10)
  const [optimizationRate, setOptimizationRate] = useState(12)

  const modelQuery = useQuery({
    queryKey: ['business-model'],
    queryFn: getBusinessModel,
  })

  const pitchMutation = useMutation({
    mutationFn: generateBusinessPitch,
  })

  const pricingRows = useMemo(() => modelQuery.data?.pricing ?? [], [modelQuery.data?.pricing])
  const overageRows = useMemo(() => modelQuery.data?.overage_pricing ?? [], [modelQuery.data?.overage_pricing])
  const membership = modelQuery.data?.membership_addon
  const revenueScenarios = useMemo(() => modelQuery.data?.revenue_scenarios ?? [], [modelQuery.data?.revenue_scenarios])
  const usps = useMemo(() => modelQuery.data?.usp ?? [], [modelQuery.data?.usp])
  const hackathonPitch = modelQuery.data?.hackathon_pitch
  const roiMonthlySavings = useMemo(() => {
    const monthlyDuties = monthlyImportValue * (averageDutyRate / 100)
    return monthlyDuties * (optimizationRate / 100)
  }, [averageDutyRate, monthlyImportValue, optimizationRate])
  const recommendedPlan = useMemo(() => {
    if (roiMonthlySavings >= 10000) return 'ENTERPRISE'
    if (roiMonthlySavings >= 3500) return 'GROWTH'
    if (roiMonthlySavings >= 1200) return 'STARTER'
    return 'FREE'
  }, [roiMonthlySavings])

  const rightPanel = (
    <div className="space-y-6">
      <div>
        <div className="label text-[#888] mb-2">AI PITCH GENERATOR</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[140px] bg-transparent border border-[#444] p-3 text-sm focus-ring"
        />
        <button
          onClick={() => pitchMutation.mutate(prompt)}
          disabled={pitchMutation.isPending}
          className="mt-3 border border-[#888] px-4 py-2 font-pixel text-xs hover:bg-canvas hover:text-dark disabled:opacity-60"
        >
          {pitchMutation.isPending ? 'GENERATING...' : 'GENERATE_MEGALLM_PITCH'}
        </button>
      </div>

      {pitchMutation.data && (
        <div className="border border-[#555] p-3 text-xs whitespace-pre-wrap">
          <div className="label text-[#888] mb-2">OUTPUT</div>
          {pitchMutation.data.pitch}
          <div className="mt-2 opacity-70">
            SOURCE: {pitchMutation.data.provider.toUpperCase()} / {pitchMutation.data.model}
            {' · '}
            {pitchMutation.data.live ? 'LIVE' : 'FALLBACK'}
          </div>
        </div>
      )}

      <div className="border border-[#555] p-3 text-xs">
        <div className="label text-[#888] mb-2">QUICK_ROI</div>
        <div className="space-y-1">
          <div>EST. SAVINGS/MO: <span className="font-pixel">${roiMonthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          <div>EST. SAVINGS/YR: <span className="font-pixel">${(roiMonthlySavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          <div>RECOMMENDED: <span className="font-pixel">{recommendedPlan}</span></div>
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout rightPanel={rightPanel}>
      <WorkspaceHeader title="BUSINESS" pixelTitle="MODEL" metaLabel="MONETIZATION" metaValue="SAAS + USAGE" />

      <div className="dashboard-scroll p-6 space-y-6 overflow-y-auto">
        {modelQuery.isLoading && <div className="border border-dark p-4 text-sm">Loading business model...</div>}
        {modelQuery.isError && (
          <div className="border border-warning p-4 text-sm">
            Failed to load business model data.
          </div>
        )}

        {modelQuery.data && (
          <>
            <section className="border border-dark p-4">
              <div className="label mb-2">POSITIONING</div>
              <div className="text-lg font-semibold">{modelQuery.data.product}</div>
              <div className="text-sm mt-1">{modelQuery.data.positioning}</div>
            </section>

            {hackathonPitch && (
              <section className="border border-dark p-4 bg-canvas/40">
                <div className="label mb-2">HACKATHON PITCH</div>
                <div className="text-base font-semibold">{hackathonPitch.one_liner}</div>

                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="border border-dark p-3">
                    <div className="label mb-2">PROBLEM</div>
                    <ul className="space-y-2">
                      {hackathonPitch.problem.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-dark p-3">
                    <div className="label mb-2">SOLUTION</div>
                    <ul className="space-y-2">
                      {hackathonPitch.solution.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-dark p-3">
                    <div className="label mb-2">DEMO STORY</div>
                    <ul className="space-y-2">
                      {hackathonPitch.demo_story.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-dark p-3">
                    <div className="label mb-2">WHY WE WIN</div>
                    <ul className="space-y-2">
                      {hackathonPitch.why_we_win.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="border border-dark p-3">
                    <div className="label mb-2">BUSINESS MODEL SUMMARY</div>
                    <ul className="space-y-2">
                      {hackathonPitch.business_model_summary.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-dark p-3 bg-dark text-text-inv">
                    <div className="label text-[#a7a7a7] mb-2">HACKATHON ASK</div>
                    <div>{hackathonPitch.ask}</div>
                  </div>
                </div>
              </section>
            )}

            <section className="grid md:grid-cols-2 gap-4">
              <div className="border border-dark p-4">
                <div className="label mb-2">TARGET CUSTOMERS</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.target_customers.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-dark p-4">
                <div className="label mb-2">GO TO MARKET</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.go_to_market.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="border border-dark p-4">
              <div className="label mb-3">PRICING TIERS</div>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {pricingRows.map((tier) => (
                  <div key={tier.tier} className="border border-dark p-3">
                    <div className="font-pixel text-sm">{tier.tier}</div>
                    <div className="text-2xl font-bold">${tier.price_monthly_usd}/mo</div>
                    {typeof tier.price_yearly_usd === 'number' && (
                      <div className="text-xs opacity-70">${tier.price_yearly_usd}/year</div>
                    )}
                    <div className="text-xs opacity-70 mt-1">{tier.who_for}</div>
                    <ul className="text-xs mt-3 space-y-1">
                      {tier.includes.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {overageRows.length > 0 && (
              <section className="border border-dark p-4">
                <div className="label mb-3">USAGE OVERAGES</div>
                <div className="space-y-2">
                  {overageRows.map((row) => (
                    <div key={row.feature} className="flex items-center justify-between border border-dark p-2 text-sm">
                      <div>{row.feature}</div>
                      <div className="font-pixel">${row.price_usd} / {row.unit}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {membership && (
              <section className="border border-dark p-4 bg-canvas/40">
                <div className="label mb-2">MEMBERSHIP ADD-ON</div>
                <div className="text-lg font-semibold">{membership.name}</div>
                <div className="font-pixel mt-1">${membership.price_monthly_usd}/mo</div>
                <ul className="text-sm mt-3 space-y-2">
                  {membership.includes.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="border border-dark p-4">
              <div className="label mb-3">ROI CALCULATOR</div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs space-y-1">
                  <div className="label">MONTHLY IMPORT VALUE (USD)</div>
                  <input
                    type="number"
                    min={0}
                    value={monthlyImportValue}
                    onChange={(event) => setMonthlyImportValue(Math.max(0, Number(event.target.value) || 0))}
                    className="w-full border border-dark bg-transparent p-2 text-sm focus-ring"
                  />
                </label>
                <label className="text-xs space-y-1">
                  <div className="label">AVERAGE DUTY RATE (%)</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={averageDutyRate}
                    onChange={(event) => setAverageDutyRate(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
                    className="w-full border border-dark bg-transparent p-2 text-sm focus-ring"
                  />
                </label>
                <label className="text-xs space-y-1">
                  <div className="label">OPTIMIZATION IMPACT (%)</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={optimizationRate}
                    onChange={(event) => setOptimizationRate(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
                    className="w-full border border-dark bg-transparent p-2 text-sm focus-ring"
                  />
                </label>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                <div className="border border-dark p-3">
                  <div className="label">EST. SAVINGS/MONTH</div>
                  <div className="font-pixel text-xl mt-1">
                    ${roiMonthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="border border-dark p-3">
                  <div className="label">EST. SAVINGS/YEAR</div>
                  <div className="font-pixel text-xl mt-1">
                    ${(roiMonthlySavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="border border-dark p-3 bg-dark text-text-inv">
                  <div className="label text-[#aaa]">RECOMMENDED PLAN</div>
                  <div className="font-pixel text-xl mt-1">{recommendedPlan}</div>
                </div>
              </div>
            </section>

            {revenueScenarios.length > 0 && (
              <section className="border border-dark p-4">
                <div className="label mb-3">REVENUE SCENARIOS</div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  {revenueScenarios.map((scenario) => (
                    <div key={scenario.name} className="border border-dark p-3">
                      <div className="font-pixel">{scenario.name}</div>
                      <div className="text-xs opacity-70 mt-1">{scenario.mix}</div>
                      <div className="mt-3">MRR: <span className="font-pixel">${scenario.mrr_usd.toLocaleString()}</span></div>
                      <div>ARR: <span className="font-pixel">${scenario.arr_usd.toLocaleString()}</span></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid md:grid-cols-2 gap-4">
              <div className="border border-dark p-4">
                <div className="label mb-2">REVENUE MODEL</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.revenue_model.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-dark p-4">
                <div className="label mb-2">COMPETITIVE EDGE</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.competitive_edge.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs opacity-70">
                  North star: {modelQuery.data.north_star_metric}
                </div>
              </div>
            </section>

            {usps.length > 0 && (
              <section className="border border-dark p-4">
                <div className="label mb-2">USP</div>
                <ul className="text-sm space-y-2">
                  {usps.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
