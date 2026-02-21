'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { CostCalculatorForm } from '@/components/features/landed-cost/CostCalculatorForm'
import { CostBreakdown } from '@/components/features/landed-cost/CostBreakdown'
import { CostPanel } from '@/components/features/landed-cost/CostPanel'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface CostData {
  productValue: number
  baseDuty: number
  section301: number
  mpf: number
  hmf: number
  freight: number
  insurance: number
  totalLanded: number
  perUnit: number
  baseDutyRate: number
  section301Rate: number
  hsCodeDescription?: string
}

export default function LandedCostPage() {
  const [loading, setLoading] = useState(false)
  const [costData, setCostData] = useState<CostData | null>(null)
  const [currentHsCode, setCurrentHsCode] = useState<string>('')
  const { add } = useToast()

  const handleCalculate = async (formData: {
    hsCode: string
    productValue: number
    quantity: number
    originCountry: string
    destinationCountry: string
    shippingMode: string
    incoterm: string
  }) => {
    setLoading(true)
    setCurrentHsCode(formData.hsCode)

    try {
      // TODO: Replace with actual API call when backend is ready
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/landed-cost/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate landed cost')
      }

      const data = await response.json()
      setCostData(data)
      add('success', 'Calculation complete!')
    } catch (error) {
      // Use mock data for now if API fails
      console.error('API error, using mock data:', error)

      const mockData: CostData = {
        productValue: formData.productValue * formData.quantity,
        baseDuty: formData.productValue * formData.quantity * 0.025, // 2.5% base duty
        section301: formData.originCountry === 'CN' ? formData.productValue * formData.quantity * 0.25 : 0, // 25% if from China
        mpf: Math.min(Math.max(formData.productValue * 0.003464, 27.23), 528.33), // MPF calculation
        hmf: formData.shippingMode === 'ocean' ? 0.125 : 0, // HMF only for ocean
        freight: formData.shippingMode === 'air' ? formData.productValue * 0.15 : formData.productValue * 0.05,
        insurance: formData.productValue * formData.quantity * 0.01,
        totalLanded: 0,
        perUnit: 0,
        baseDutyRate: 2.5,
        section301Rate: formData.originCountry === 'CN' ? 25 : 0,
        hsCodeDescription: 'Static converters (for example, rectifiers)',
      }

      mockData.totalLanded =
        mockData.productValue +
        mockData.baseDuty +
        mockData.section301 +
        mockData.mpf +
        mockData.hmf +
        mockData.freight +
        mockData.insurance

      mockData.perUnit = mockData.totalLanded / formData.quantity

      setCostData(mockData)
      add('warning', 'Using mock data - Backend not connected')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout
      rightPanel={
        <CostPanel
          hsCode={currentHsCode || undefined}
          baseDutyRate={costData?.baseDutyRate}
          section301Rate={costData?.section301Rate}
          description={costData?.hsCodeDescription}
        />
      }
    >
      <WorkspaceHeader
        title="LANDED"
        pixelTitle="COST"
        metaLabel="STATUS"
        metaValue="ACTIVE"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="border border-dark p-6">
          <CostCalculatorForm onSubmit={handleCalculate} />
        </div>

        {loading && (
          <CardSkeleton />
        )}

        {!loading && costData && (
          <CostBreakdown data={costData} />
        )}

        {!loading && !costData && (
          <div className="border border-dark p-8 text-center">
            <div className="font-pixel text-xl mb-2">READY</div>
            <p className="text-sm opacity-60">Enter product and shipping details to calculate landed cost</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
