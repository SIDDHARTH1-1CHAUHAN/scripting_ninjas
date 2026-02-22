'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { getBusinessModel } from '@/lib/api'

export default function BusinessPage() {
  const [monthlyImportValue, setMonthlyImportValue] = useState(250000)
  const [averageDutyRate, setAverageDutyRate] = useState(10)
  const [optimizationRate, setOptimizationRate] = useState(12)

  const modelQuery = useQuery({
    queryKey: ['business-model'],
    queryFn: getBusinessModel,
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

  return (
    <AppLayout>
      <WorkspaceHeader title="BUSINESS" pixelTitle="MODEL" metaLabel="FOCUS" metaValue="UNIT ECONOMICS" />

      <div className="business-page dashboard-scroll p-6 space-y-6 overflow-y-auto">
        {modelQuery.isLoading && <div className="business-surface p-4 text-sm">Loading business narrative...</div>}
        {modelQuery.isError && (
          <div className="business-surface p-4 text-sm border-warning">
            Unable to load business model data right now.
          </div>
        )}

        {modelQuery.data && (
          <>
            <section className="business-surface p-4">
              <div className="label mb-2">POSITIONING</div>
              <div className="text-lg font-semibold">{modelQuery.data.product}</div>
              <div className="text-sm mt-1">{modelQuery.data.positioning}</div>
              <div className="mt-2 text-xs opacity-75">
                Takeaway: We turn trade complexity into margin-protecting execution.
              </div>
              <div className="business-inset mt-3 p-3 text-sm">
                <div className="label mb-1">NORTH STAR</div>
                {modelQuery.data.north_star_metric}
              </div>
            </section>

            {hackathonPitch && (
              <section className="business-surface business-surface-glitter p-4">
                <div className="label mb-2">HACKATHON PITCH</div>
                <div className="text-base font-semibold">{hackathonPitch.one_liner}</div>
                <div className="mt-2 text-xs opacity-75">
                  Takeaway: This is an execution platform with measurable financial outcomes, not just another AI chatbot.
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="business-card p-3">
                    <div className="label mb-2">PROBLEM</div>
                    <ul className="space-y-2">
                      {hackathonPitch.problem.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="business-card p-3">
                    <div className="label mb-2">SOLUTION</div>
                    <ul className="space-y-2">
                      {hackathonPitch.solution.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="business-card p-3">
                    <div className="label mb-2">DEMO STORY</div>
                    <ul className="space-y-2">
                      {hackathonPitch.demo_story.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="business-card p-3">
                    <div className="label mb-2">WHY WE WIN</div>
                    <ul className="space-y-2">
                      {hackathonPitch.why_we_win.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="business-card p-3">
                    <div className="label mb-2">BUSINESS MODEL SUMMARY</div>
                    <ul className="space-y-2">
                      {hackathonPitch.business_model_summary.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="business-card business-card-dark p-3">
                    <div className="label text-[#a7a7a7] mb-2">HACKATHON ASK</div>
                    <div>{hackathonPitch.ask}</div>
                  </div>
                </div>
              </section>
            )}

            <section className="business-surface p-4">
              <div className="label mb-1">PRICING TIERS</div>
              <div className="text-xs opacity-75 mb-3">Designed to expand from pilot teams to enterprise-scale trade operations.</div>
              <div className="text-xs opacity-75 mb-3">
                Takeaway: Low-friction entry, clear upgrade path, and strong expansion revenue.
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {pricingRows.map((tier) => (
                  <div key={tier.tier} className="business-card p-3">
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
              <section className="business-surface p-4">
                <div className="label mb-1">USAGE OVERAGES</div>
                <div className="text-xs opacity-75 mb-3">Scales revenue with actual platform usage while preserving transparent pricing.</div>
                <div className="text-xs opacity-75 mb-3">
                  Takeaway: As customer shipment volume grows, monetization grows proportionally.
                </div>
                <div className="space-y-2">
                  {overageRows.map((row) => (
                    <div key={row.feature} className="business-card flex items-center justify-between p-2 text-sm">
                      <div>{row.feature}</div>
                      <div className="font-pixel">${row.price_usd} / {row.unit}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {membership && (
              <section className="business-surface business-surface-glitter p-4">
                <div className="label mb-2">STRATEGIC ADD-ON</div>
                <div className="text-lg font-semibold">{membership.name}</div>
                <div className="font-pixel mt-1">${membership.price_monthly_usd}/mo</div>
                <div className="mt-2 text-xs opacity-75">
                  Takeaway: Adds high-margin advisory revenue on top of core SaaS.
                </div>
                <ul className="text-sm mt-3 space-y-2">
                  {membership.includes.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="business-surface p-4">
              <div className="label mb-1">ROI CALCULATOR</div>
              <div className="text-xs opacity-75 mb-3">Convert trade optimization potential into dollar impact for budgeting and plan selection.</div>
              <div className="text-xs opacity-75 mb-3">
                Takeaway: Buyers can justify spend with quantified savings before procurement.
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs space-y-1">
                  <div className="label">MONTHLY IMPORT VALUE (USD)</div>
                  <input
                    type="number"
                    min={0}
                    value={monthlyImportValue}
                    onChange={(event) => setMonthlyImportValue(Math.max(0, Number(event.target.value) || 0))}
                    className="business-input w-full p-2 text-sm focus-ring"
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
                    className="business-input w-full p-2 text-sm focus-ring"
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
                    className="business-input w-full p-2 text-sm focus-ring"
                  />
                </label>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                <div className="business-card p-3">
                  <div className="label">ESTIMATED SAVINGS / MONTH</div>
                  <div className="font-pixel text-xl mt-1">
                    ${roiMonthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="business-card p-3">
                  <div className="label">ESTIMATED SAVINGS / YEAR</div>
                  <div className="font-pixel text-xl mt-1">
                    ${(roiMonthlySavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="business-card business-card-dark p-3">
                  <div className="label text-[#aaa]">RECOMMENDED TIER</div>
                  <div className="font-pixel text-xl mt-1">{recommendedPlan}</div>
                </div>
              </div>
            </section>

            {revenueScenarios.length > 0 && (
              <section className="business-surface p-4">
                <div className="label mb-1">REVENUE SCENARIOS</div>
                <div className="text-xs opacity-75 mb-3">Three growth bands to communicate traction targets and funding narrative.</div>
                <div className="text-xs opacity-75 mb-3">
                  Takeaway: Even conservative adoption supports a scalable ARR trajectory.
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  {revenueScenarios.map((scenario) => (
                    <div key={scenario.name} className="business-card p-3">
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
              <div className="business-surface p-4">
                <div className="label mb-2">MONETIZATION STRATEGY</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.revenue_model.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs opacity-75">
                  Takeaway: Predictable recurring revenue with multiple expansion levers.
                </div>
              </div>

              <div className="business-surface p-4">
                <div className="label mb-2">DEFENSIBLE ADVANTAGE</div>
                <ul className="text-sm space-y-2">
                  {modelQuery.data.competitive_edge.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs opacity-75">
                  Takeaway: Workflow depth + explainability creates higher switching cost.
                </div>
              </div>
            </section>

            {usps.length > 0 && (
              <section className="business-surface p-4">
                <div className="label mb-2">CORE DIFFERENTIATORS</div>
                <ul className="text-sm space-y-2">
                  {usps.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs opacity-75">
                  Takeaway: TradeOptimize wins by combining operational usability with financial clarity.
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
