'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { CostCalculatorForm } from '@/components/features/landed-cost/CostCalculatorForm'
import { CostBreakdown } from '@/components/features/landed-cost/CostBreakdown'
import { CostPanel } from '@/components/features/landed-cost/CostPanel'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useLandedCost } from '@/hooks'

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
  const [warnings, setWarnings] = useState<string[]>([])
  const { add } = useToast()
  const landedCostMutation = useLandedCost()

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
      const totalProductValue = formData.productValue * formData.quantity
      const response = await landedCostMutation.mutateAsync({
        hs_code: formData.hsCode,
        product_value: totalProductValue,
        quantity: formData.quantity,
        origin_country: formData.originCountry,
        destination_country: formData.destinationCountry,
        shipping_mode: formData.shippingMode,
        incoterm: formData.incoterm,
      })

      setCostData({
        productValue: response.breakdown.product_value,
        baseDuty: response.breakdown.base_duty,
        section301: response.breakdown.section_301,
        mpf: response.breakdown.mpf,
        hmf: response.breakdown.hmf,
        freight: response.breakdown.freight,
        insurance: response.breakdown.insurance,
        totalLanded: response.total_landed_cost,
        perUnit: response.cost_per_unit,
        baseDutyRate: (response.breakdown.base_duty_rate || 0) * 100,
        section301Rate: (response.breakdown.section_301_rate || 0) * 100,
      })
      setWarnings(response.warnings)
      add('success', 'Calculation complete!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Calculation failed'
      add('error', message)
      setCostData(null)
      setWarnings([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <WorkspaceHeader
        title="LANDED"
        pixelTitle="COST"
        metaLabel="STATUS"
        metaValue="ACTIVE"
      />

      <div className="dashboard-scroll flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border border-dark p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="label mb-1">CALCULATOR</div>
                <p className="text-xs opacity-70">
                  Estimate landed cost using live tariff and lane-aware freight logic.
                </p>
              </div>
            </div>
            <CostCalculatorForm onSubmit={handleCalculate} />
          </div>
          <div className="border border-dark p-4 bg-canvas/30 h-fit">
            <CostPanel
              hsCode={currentHsCode || undefined}
              baseDutyRate={costData?.baseDutyRate}
              section301Rate={costData?.section301Rate}
              description={costData?.hsCodeDescription}
            />
          </div>
        </div>

        {loading && (
          <CardSkeleton />
        )}

        {!loading && costData && (
          <div className="space-y-4">
            <CostBreakdown data={costData} />
            {warnings.length > 0 && (
              <div className="border border-warning p-4">
                <div className="label mb-2 text-warning">WARNINGS</div>
                <ul className="space-y-1 text-sm">
                  {warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
