'use client'

import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useForexForecast } from '@/hooks'
import type { ForexForecastResponse } from '@/lib/api'

interface ChartRow {
  date: string
  historicalRate?: number
  forecastRate?: number
  isFuture?: boolean
}

function formatAxisDate(dateText: string): string {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function mergeChartData(payload: ForexForecastResponse | null): ChartRow[] {
  if (!payload) return []

  const byDate = new Map<string, ChartRow>()

  payload.historical.forEach((point) => {
    byDate.set(point.date, {
      date: point.date,
      historicalRate: point.rate,
    })
  })

  payload.forecast.forEach((point) => {
    const existing = byDate.get(point.date)
    byDate.set(point.date, {
      date: point.date,
      historicalRate: existing?.historicalRate,
      forecastRate: point.predicted_rate,
      isFuture: point.is_future,
    })
  })

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export default function ForexPage() {
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('INR')
  const [forecastDays, setForecastDays] = useState('7')
  const [result, setResult] = useState<ForexForecastResponse | null>(null)

  const forecastMutation = useForexForecast()
  const { add } = useToast()

  const chartData = useMemo(() => mergeChartData(result), [result])
  const minPoint = result?.minimum_predicted_rate ?? null

  const runForecast = async () => {
    const days = Number.parseInt(forecastDays, 10)
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      add('warning', 'Forecast days must be between 1 and 90')
      return
    }

    try {
      const response = await forecastMutation.mutateAsync({
        from_currency: fromCurrency.trim().toUpperCase(),
        to_currency: toCurrency.trim().toUpperCase(),
        forecast_days: days,
      })
      setResult(response)
      add('success', 'FX payment forecast generated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forecast failed'
      add('error', message)
    }
  }

  return (
    <AppLayout>
      <WorkspaceHeader
        title="FX"
        pixelTitle="SETTLEMENT OPTIMIZER"
        metaLabel="WORKFLOW"
        metaValue="PAY / RECEIVE TIMING"
      />

      <div className="fx-static-page dashboard-scroll no-scrollbar classify-page flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 lg:space-y-5">
        <section className="classify-surface classify-surface-hover rounded-3xl p-4 lg:p-5 space-y-4">
          <div className="label">FX INPUTS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="FROM CURRENCY"
              value={fromCurrency}
              onChange={(event) => setFromCurrency(event.target.value)}
              className="classify-soft-input rounded-xl"
              placeholder="USD"
            />
            <Input
              label="TO CURRENCY"
              value={toCurrency}
              onChange={(event) => setToCurrency(event.target.value)}
              className="classify-soft-input rounded-xl"
              placeholder="INR"
            />
            <Input
              label="FORECAST DAYS"
              value={forecastDays}
              onChange={(event) => setForecastDays(event.target.value)}
              className="classify-soft-input rounded-xl"
              placeholder="7"
              type="number"
              min={1}
              max={90}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="classify-status-pill rounded-2xl px-4 py-3 text-sm text-text-muted">
              Strategy is fixed: pay at the lowest predicted rate and receive bill at the highest predicted rate.
            </div>
            <Button
              onClick={runForecast}
              disabled={forecastMutation.isPending}
              className="rounded-full border border-dark/40 px-6 py-3 shadow-none"
            >
              {forecastMutation.isPending ? 'FORECASTING...' : 'RUN FORECAST'}
            </Button>
          </div>
        </section>

        <section className="classify-surface rounded-3xl p-4 lg:p-5">
          <div className="label mb-3">HISTORICAL + FORECAST CURVE</div>
          <div className="fx-chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickFormatter={formatAxisDate}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border-dark)',
                    color: 'var(--text-main)',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="historicalRate"
                  stroke="var(--text-main)"
                  strokeWidth={1.8}
                  dot={false}
                  name="Historical"
                />
                <Line
                  type="monotone"
                  dataKey="forecastRate"
                  stroke="var(--accent-strong)"
                  strokeWidth={2}
                  dot={false}
                  name="Forecast"
                />
                {minPoint && (
                  <ReferenceDot
                    x={minPoint.date}
                    y={minPoint.rate}
                    r={5}
                    fill="var(--warning)"
                    stroke="var(--warning)"
                    ifOverflow="visible"
                    label={{
                      value: 'Min',
                      position: 'top',
                      fill: 'var(--warning)',
                      fontSize: 10,
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {result && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <article className="classify-result-block p-3.5">
              <div className="label mb-2">MIN PREDICTED RATE</div>
              <div className="font-mono text-2xl">{result.minimum_predicted_rate.rate.toFixed(4)}</div>
              <div className="text-sm text-text-muted mt-1">{result.minimum_predicted_rate.date}</div>
            </article>

            <article className="classify-result-block p-3.5">
              <div className="label mb-2">MAX PREDICTED RATE</div>
              <div className="font-mono text-2xl">{result.maximum_predicted_rate.rate.toFixed(4)}</div>
              <div className="text-sm text-text-muted mt-1">{result.maximum_predicted_rate.date}</div>
            </article>

            <article className="classify-result-block p-3.5">
              <div className="label mb-2">OPTIMAL PAYMENT PLAN</div>
              <div className="text-sm leading-relaxed text-text-main">
                <div>
                  Payment day: <span className="font-semibold">{result.recommendation.payment_date}</span> @{' '}
                  <span className="font-mono">{result.recommendation.payment_rate.toFixed(4)}</span>
                </div>
                <div className="mt-1">
                  Bill receive day: <span className="font-semibold">{result.recommendation.bill_receive_date}</span> @{' '}
                  <span className="font-mono">{result.recommendation.bill_receive_rate.toFixed(4)}</span>
                </div>
                <div className="mt-2 text-xs text-text-muted">{result.recommendation.explanation}</div>
              </div>
            </article>
          </section>
        )}
      </div>
    </AppLayout>
  )
}
