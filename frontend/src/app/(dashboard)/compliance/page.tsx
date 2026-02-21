'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ComplianceChecker } from '@/components/features/compliance/ComplianceChecker'
import { RiskIndicator } from '@/components/features/compliance/RiskIndicator'
import { DocumentChecklist } from '@/components/features/compliance/DocumentChecklist'
import { SanctionsAlert } from '@/components/features/compliance/SanctionsAlert'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface ComplianceResult {
  sanctionsStatus: 'clear' | 'blocked' | 'warning'
  sanctionsDetails?: string
  riskIndicators: Array<{
    label: string
    status: 'clear' | 'warning' | 'danger' | 'pending'
    details?: string
  }>
  documents: Array<{
    name: string
    status: 'verified' | 'missing' | 'pending'
  }>
  overallRisk: 'low' | 'medium' | 'high'
}

export default function CompliancePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [checkedEntity, setCheckedEntity] = useState<string>('')
  const { add } = useToast()

  const handleCheck = async (data: {
    entity: string
    hsCode: string
    originCountry: string
    destinationCountry: string
    transactionValue: number
  }) => {
    setLoading(true)
    setCheckedEntity(data.entity)

    try {
      // TODO: Replace with actual API call when backend is ready
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/compliance/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to run compliance check')
      }

      const apiResult = await response.json()
      setResult(apiResult)
      add('success', 'Compliance check complete!')
    } catch (error) {
      // Use mock data for now if API fails
      console.error('API error, using mock data:', error)

      // Determine sanctions status based on origin country
      const sanctionedCountries = ['RU', 'IR', 'KP', 'SY', 'CU']
      const isSanctioned = sanctionedCountries.includes(data.originCountry)

      const mockResult: ComplianceResult = {
        sanctionsStatus: isSanctioned ? 'blocked' : 'clear',
        sanctionsDetails: isSanctioned
          ? `Entity may be subject to sanctions due to origin country restrictions`
          : 'No matches found in OFAC SDN list',
        riskIndicators: [
          {
            label: 'OFAC Screening',
            status: isSanctioned ? 'danger' : 'clear',
            details: isSanctioned ? 'Country is under US sanctions' : 'No OFAC matches found',
          },
          {
            label: 'Export Control',
            status: data.hsCode.startsWith('84') || data.hsCode.startsWith('85') ? 'warning' : 'clear',
            details: data.hsCode.startsWith('84') || data.hsCode.startsWith('85')
              ? 'Product may require export license'
              : 'No export restrictions identified',
          },
          {
            label: 'Transaction Value',
            status: data.transactionValue > 100000 ? 'warning' : 'clear',
            details: data.transactionValue > 100000
              ? 'High value transaction - additional reporting required'
              : 'Transaction value within normal limits',
          },
          {
            label: 'Dual-Use Assessment',
            status: 'pending',
            details: 'Manual review recommended for dual-use classification',
          },
        ],
        documents: [
          { name: 'Commercial Invoice', status: 'verified' },
          { name: 'Bill of Lading', status: 'verified' },
          { name: 'Packing List', status: 'verified' },
          { name: 'Certificate of Origin', status: isSanctioned ? 'missing' : 'verified' },
          { name: 'Export License', status: data.hsCode.startsWith('84') || data.hsCode.startsWith('85') ? 'pending' : 'verified' },
          { name: 'End-User Certificate', status: isSanctioned ? 'missing' : 'pending' },
        ],
        overallRisk: isSanctioned ? 'high' : data.transactionValue > 100000 ? 'medium' : 'low',
      }

      setResult(mockResult)
      add('warning', 'Using mock data - Backend not connected')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <WorkspaceHeader
        title="TRADE"
        pixelTitle="COMPLIANCE"
        metaLabel="STATUS"
        metaValue="ACTIVE"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <ComplianceChecker onCheck={handleCheck} />

        {loading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && result && (
          <>
            <SanctionsAlert
              entity={checkedEntity}
              status={result.sanctionsStatus}
              details={result.sanctionsDetails}
            />

            <div className="border border-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="label">RISK ASSESSMENT</div>
                <div className={`font-pixel text-sm px-3 py-1 ${
                  result.overallRisk === 'high' ? 'bg-warning/20 text-warning' :
                  result.overallRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                  'bg-green-500/20 text-green-600'
                }`}>
                  {result.overallRisk.toUpperCase()}_RISK
                </div>
              </div>
              <div className="space-y-2">
                {result.riskIndicators.map((indicator, idx) => (
                  <RiskIndicator key={idx} {...indicator} />
                ))}
              </div>
            </div>

            <DocumentChecklist documents={result.documents} />
          </>
        )}

        {!loading && !result && (
          <div className="border border-dark p-8 text-center">
            <div className="font-pixel text-xl mb-2">READY</div>
            <p className="text-sm opacity-60">Enter entity and transaction details to run compliance check</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
