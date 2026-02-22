'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ExportButtons } from '@/components/features/analytics/ExportButtons'
import { SavingsChart, ClassificationChart, MonthlyTrendChart } from '@/components/features/analytics/SavingsChart'
import { ResultCard } from '@/components/ui/ResultCard'
import {
  getDashboardAnalytics,
  getClassificationStats,
  getCostSavingsReport,
  type AnalyticsCostSavingsResponse,
  type AnalyticsDashboardResponse,
} from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface AnalyticsData {
  summary: AnalyticsDashboardResponse['summary']
  chapters: AnalyticsDashboardResponse['classifications_by_chapter']
  monthly: Array<{
    month: string
    classifications: number
    shipments: number
    value: number
    savings: number
  }>
  exportData: Array<{
    hsCode: string
    count: number
    confidence: number
    savings: number
  }>
  aiAccuracy: AnalyticsDashboardResponse['ai_accuracy']
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const { add } = useToast()

  const buildMonthlyWithSavings = (
    dashboard: AnalyticsDashboardResponse,
    costSavings: AnalyticsCostSavingsResponse,
  ) => {
    const seriesLength = Math.max(dashboard.monthly_trend.length, 1)
    const perPointSavings = Math.round(costSavings.total_savings / seriesLength)
    return dashboard.monthly_trend.map((row, index) => ({
      month: row.month,
      classifications: row.classifications,
      shipments: row.shipments,
      value: row.value,
      savings: perPointSavings * (index + 1),
    }))
  }

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboard, classificationStats, costSavings] = await Promise.all([
        getDashboardAnalytics(period),
        getClassificationStats(),
        getCostSavingsReport(),
      ])

      const perChapterSavings = Math.round(
        costSavings.total_savings / Math.max(classificationStats.top_chapters.length, 1),
      )

      setData({
        summary: dashboard.summary,
        chapters: dashboard.classifications_by_chapter,
        monthly: buildMonthlyWithSavings(dashboard, costSavings),
        exportData: classificationStats.top_chapters.map((chapter) => ({
          hsCode: `${chapter.chapter}00.00`,
          count: chapter.count,
          confidence: classificationStats.avg_confidence,
          savings: perChapterSavings,
        })),
        aiAccuracy: dashboard.ai_accuracy,
      })
    } catch (error) {
      add('error', error instanceof Error ? error.message : 'Analytics load failed')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [add, period])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const periods: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d']

  return (
    <AppLayout
      rightPanel={
        <>
          <div className="flex justify-between items-center pb-6 border-b border-dark">
            <div className="label text-text-inv">EXPORT_OPTIONS</div>
          </div>
          <div className="space-y-4 mt-4">
            <ExportButtons data={data?.exportData || []} chartRef={chartRef} />
            <div className="text-xs text-text-muted">Export analytics data as PDF, Excel, or CSV for investor and ops review.</div>
          </div>

          <div className="mt-8">
            <div className="label text-text-muted mb-4">AI_ACCURACY</div>
            <ResultCard label="OVERALL">
              <div className="font-pixel text-2xl mt-2">
                {data ? `${data.aiAccuracy.overall}%` : '--'}
              </div>
            </ResultCard>
            <div className="mt-4 space-y-2 text-xs">
              {data?.aiAccuracy.by_confidence.slice(0, 3).map((item) => (
                <div className="flex justify-between" key={item.range}>
                  <span>{item.range}</span>
                  <span className="font-pixel">{item.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      }
    >
      <WorkspaceHeader title="ANALYTICS" pixelTitle="DASHBOARD" metaLabel="PERIOD" metaValue={period.toUpperCase()} />

      <div className="p-4 bg-canvas/70 border-b border-dark flex gap-2">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 font-pixel text-sm border border-dark shadow-[var(--surface-shadow)] ${
              period === p ? 'bg-dark text-canvas' : 'bg-panel/60'
            }`}
          >
            {p === '7d' ? 'WEEK' : p === '30d' ? 'MONTH' : 'QUARTER'}
          </button>
        ))}
      </div>

      <div className="dashboard-scroll analytics-scroll flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="border border-dark p-6 mb-6 text-sm opacity-70 bg-panel/70">Loading analytics...</div>
        )}

        {!loading && !data && (
          <div className="border border-warning p-6 mb-6 text-sm bg-warning/10">
            Analytics data unavailable. Verify backend connectivity.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
            <div className="label">CLASSIFICATIONS</div>
            <div className="font-pixel text-3xl mt-2">{data?.summary.total_classifications ?? '--'}</div>
          </div>
          <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
            <div className="label">SHIPMENTS</div>
            <div className="font-pixel text-3xl mt-2">{data?.summary.total_shipments ?? '--'}</div>
          </div>
          <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
            <div className="label">TOTAL VALUE</div>
            <div className="font-pixel text-3xl mt-2">
              {data ? `$${(data.summary.total_value_usd / 1000000).toFixed(2)}M` : '--'}
            </div>
          </div>
          <div className="border border-dark p-4 bg-dark text-text-inv shadow-[var(--surface-shadow)]">
            <div className="label text-text-muted">DUTIES SAVED</div>
            <div className="font-pixel text-3xl mt-2 text-[var(--accent)]">
              {data ? `$${data.summary.duties_saved_usd.toLocaleString()}` : '--'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]" ref={chartRef}>
            <div className="label mb-4">VALUE & SAVINGS TREND</div>
            <SavingsChart data={data?.monthly || []} />
          </div>
          <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
            <div className="label mb-4">CLASSIFICATIONS BY CHAPTER</div>
            <ClassificationChart data={data?.chapters || []} />
          </div>
        </div>

        <div className="border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
          <div className="label mb-4">MONTHLY ACTIVITY</div>
          <MonthlyTrendChart data={data?.monthly || []} />
        </div>

        <div className="mt-6 border border-dark p-4 bg-panel/65 shadow-[var(--surface-shadow)]">
          <div className="label mb-4">TOP HS CHAPTERS</div>
          <div className="space-y-2">
            {(data?.chapters || []).map((ch, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-full bg-canvas/50 border border-dark/40">
                  <div className="h-6 bg-dark flex items-center px-2" style={{ width: `${ch.percentage}%` }}>
                    <span className="text-text-inv text-xs font-pixel truncate">{ch.chapter}</span>
                  </div>
                </div>
                <span className="font-pixel text-sm w-16 text-right">{ch.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
