'use client'
import { useState, useRef } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ExportButtons } from '@/components/features/analytics/ExportButtons'
import { SavingsChart, ClassificationChart, MonthlyTrendChart } from '@/components/features/analytics/SavingsChart'
import { ResultCard } from '@/components/ui/ResultCard'

const mockData = {
  summary: {
    total_classifications: 847,
    total_shipments: 124,
    total_value_usd: 2340000,
    duties_paid_usd: 187200,
    duties_saved_usd: 42350,
    compliance_score: 94,
  },
  chapters: [
    { chapter: 'Chapter 85 - Electrical', count: 312, percentage: 36.8 },
    { chapter: 'Chapter 84 - Machinery', count: 198, percentage: 23.4 },
    { chapter: 'Chapter 39 - Plastics', count: 145, percentage: 17.1 },
    { chapter: 'Chapter 73 - Iron/Steel', count: 89, percentage: 10.5 },
    { chapter: 'Other', count: 103, percentage: 12.2 },
  ],
  monthly: [
    { month: 'Sep', classifications: 620, shipments: 82, value: 1500000, savings: 28000 },
    { month: 'Oct', classifications: 680, shipments: 95, value: 1750000, savings: 32000 },
    { month: 'Nov', classifications: 720, shipments: 102, value: 1900000, savings: 35000 },
    { month: 'Dec', classifications: 790, shipments: 115, value: 2100000, savings: 38000 },
    { month: 'Jan', classifications: 820, shipments: 120, value: 2250000, savings: 40000 },
    { month: 'Feb', classifications: 847, shipments: 124, value: 2340000, savings: 42350 },
  ],
  exportData: [
    { hsCode: '8504.40.95', count: 156, confidence: 94, savings: 12400 },
    { hsCode: '8518.30.20', count: 89, confidence: 97, savings: 8200 },
    { hsCode: '7323.93.00', count: 67, confidence: 99, savings: 5100 },
  ],
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const chartRef = useRef<HTMLDivElement>(null)

  return (
    <AppLayout
      rightPanel={
        <>
          <div className="flex justify-between items-center pb-6 border-b border-[#333]">
            <div className="label text-text-inv">EXPORT_OPTIONS</div>
          </div>
          <div className="space-y-4 mt-4">
            <ExportButtons data={mockData.exportData} chartRef={chartRef} />
            <div className="text-xs text-[#888]">Export your analytics data as PDF, Excel, or CSV for reporting and analysis.</div>
          </div>

          <div className="mt-8">
            <div className="label text-[#888] mb-4">AI_ACCURACY</div>
            <ResultCard label="OVERALL">
              <div className="font-pixel text-2xl mt-2">94.2%</div>
            </ResultCard>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><span>High Confidence (90%+)</span><span className="font-pixel">98.7%</span></div>
              <div className="flex justify-between"><span>Medium Confidence</span><span className="font-pixel">91.3%</span></div>
              <div className="flex justify-between"><span>Low Confidence</span><span className="font-pixel">72.1%</span></div>
            </div>
          </div>
        </>
      }
    >
      <WorkspaceHeader title="ANALYTICS" pixelTitle="DASHBOARD" metaLabel="PERIOD" metaValue={period.toUpperCase()} />

      <div className="p-4 bg-canvas border-b border-dark flex gap-2">
        {['7d', '30d', '90d'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 font-pixel text-sm ${period === p ? 'bg-dark text-canvas' : 'border border-dark'}`}
          >
            {p === '7d' ? 'WEEK' : p === '30d' ? 'MONTH' : 'QUARTER'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border border-dark p-4">
            <div className="label">CLASSIFICATIONS</div>
            <div className="font-pixel text-3xl mt-2">{mockData.summary.total_classifications}</div>
          </div>
          <div className="border border-dark p-4">
            <div className="label">SHIPMENTS</div>
            <div className="font-pixel text-3xl mt-2">{mockData.summary.total_shipments}</div>
          </div>
          <div className="border border-dark p-4">
            <div className="label">TOTAL VALUE</div>
            <div className="font-pixel text-3xl mt-2">${(mockData.summary.total_value_usd / 1000000).toFixed(2)}M</div>
          </div>
          <div className="border border-dark p-4 bg-dark text-text-inv">
            <div className="label text-[#888]">DUTIES SAVED</div>
            <div className="font-pixel text-3xl mt-2 text-green-500">${mockData.summary.duties_saved_usd.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-dark p-4" ref={chartRef}>
            <div className="label mb-4">VALUE & SAVINGS TREND</div>
            <SavingsChart data={mockData.monthly} />
          </div>
          <div className="border border-dark p-4">
            <div className="label mb-4">CLASSIFICATIONS BY CHAPTER</div>
            <ClassificationChart data={mockData.chapters} />
          </div>
        </div>

        <div className="border border-dark p-4">
          <div className="label mb-4">MONTHLY ACTIVITY</div>
          <MonthlyTrendChart data={mockData.monthly} />
        </div>

        <div className="mt-6 border border-dark p-4">
          <div className="label mb-4">TOP HS CHAPTERS</div>
          <div className="space-y-2">
            {mockData.chapters.map((ch, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-full bg-[#ddd]">
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
