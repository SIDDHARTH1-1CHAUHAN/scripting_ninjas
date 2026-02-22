'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ComplianceChecker } from '@/components/features/compliance/ComplianceChecker'
import { RiskIndicator } from '@/components/features/compliance/RiskIndicator'
import { DocumentChecklist } from '@/components/features/compliance/DocumentChecklist'
import { SanctionsAlert } from '@/components/features/compliance/SanctionsAlert'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useCompliance } from '@/hooks'
import { getComplianceDocuments, uploadComplianceDocument, type ComplianceResponse } from '@/lib/api'

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
    status: 'required' | 'recommended' | 'uploaded' | 'verified'
    filename?: string
    uploadedAt?: string
  }>
  overallRisk: 'low' | 'medium' | 'high'
}

export default function CompliancePage() {
  const [loading, setLoading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null)
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [complianceCaseId, setComplianceCaseId] = useState<string | null>(null)
  const [caseSignature, setCaseSignature] = useState<string | null>(null)
  const [checkedEntity, setCheckedEntity] = useState<string>('')
  const { add } = useToast()
  const complianceMutation = useCompliance()

  const buildCaseSignature = (data: {
    entity: string
    hsCode: string
    originCountry: string
    destinationCountry: string
  }) => {
    const hs = data.hsCode.trim().toUpperCase()
    const origin = data.originCountry.trim().toUpperCase()
    const destination = data.destinationCountry.trim().toUpperCase()
    const entity = data.entity.trim().toUpperCase()
    return [hs, origin, destination, entity].join('|')
  }

  const toRiskStatus = (status: string): 'clear' | 'warning' | 'danger' | 'pending' => {
    const normalized = status.toUpperCase()
    if (normalized === 'CLEAR') return 'clear'
    if (normalized === 'BLOCKED') return 'danger'
    if (normalized === 'WARNING' || normalized === 'ACTION_REQUIRED') return 'warning'
    return 'pending'
  }

  const mapComplianceResult = (apiResult: ComplianceResponse): ComplianceResult => {
    const sanctionsCheck = apiResult.checks.find((item) =>
      item.category.toUpperCase().includes('OFAC'),
    )

    const sanctionsStatus: ComplianceResult['sanctionsStatus'] =
      sanctionsCheck?.status.toUpperCase() === 'BLOCKED'
        ? 'blocked'
        : sanctionsCheck?.status.toUpperCase() === 'WARNING'
          ? 'warning'
          : 'clear'

    const normalizedRisk = apiResult.risk_level.toLowerCase()
    const overallRisk: ComplianceResult['overallRisk'] =
      normalizedRisk === 'high' || normalizedRisk === 'medium' || normalizedRisk === 'low'
        ? normalizedRisk
        : 'medium'

    const mapDocumentStatus = (
      status: string,
    ): 'required' | 'recommended' | 'uploaded' | 'verified' => {
      const normalized = status.toLowerCase()
      if (normalized === 'uploaded') return 'uploaded'
      if (normalized === 'verified') return 'verified'
      if (normalized === 'recommended') return 'recommended'
      return 'required'
    }

    return {
      sanctionsStatus,
      sanctionsDetails: sanctionsCheck?.details,
      riskIndicators: apiResult.checks.map((item) => ({
        label: item.category,
        status: toRiskStatus(item.status),
        details: item.details,
      })),
      documents: apiResult.required_documents.map((document) => ({
        name: document.name,
        status: mapDocumentStatus(document.status),
        filename: document.filename,
        uploadedAt: document.uploaded_at,
      })),
      overallRisk,
    }
  }

  const handleCheck = async (data: {
    entity: string
    hsCode: string
    originCountry: string
    destinationCountry: string
    transactionValue: number
  }) => {
    setLoading(true)
    setCheckedEntity(data.entity)
    const currentSignature = buildCaseSignature(data)
    const reusableCaseId =
      caseSignature && caseSignature === currentSignature ? complianceCaseId : null

    try {
      let apiResult = await complianceMutation.mutateAsync({
        hs_code: data.hsCode,
        origin_country: data.originCountry,
        destination_country: data.destinationCountry,
        supplier_name: data.entity || undefined,
        compliance_case_id: reusableCaseId || undefined,
      })

      if (!apiResult.compliance_case_id && reusableCaseId) {
        apiResult = await complianceMutation.mutateAsync({
          hs_code: data.hsCode,
          origin_country: data.originCountry,
          destination_country: data.destinationCountry,
          supplier_name: data.entity || undefined,
        })
      }

      if (apiResult.compliance_case_id) {
        setComplianceCaseId(apiResult.compliance_case_id)
        setCaseSignature(currentSignature)
      }
      setResult(mapComplianceResult(apiResult))
      add('success', 'Compliance check complete!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Compliance check failed'
      if (message.toLowerCase().includes('compliance_case_id') || message.toLowerCase().includes('compliance case')) {
        setComplianceCaseId(null)
        setCaseSignature(null)
      }
      add('error', message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (documentName: string, file: File) => {
    if (!complianceCaseId) {
      add('error', 'Run compliance check first to create a case')
      return
    }

    const maxUploadBytes = 10 * 1024 * 1024
    if (file.size > maxUploadBytes) {
      add('error', 'File exceeds 10MB limit')
      return
    }

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'doc', 'docx']
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!allowedExtensions.includes(extension)) {
      add('error', 'Unsupported file type. Use PDF, image, text, or Word docs.')
      return
    }

    setUploadingDocument(documentName)
    try {
      await uploadComplianceDocument(complianceCaseId, documentName, file)

      let refreshedDocuments: Array<{
        name: string
        status: string
        filename?: string
        uploaded_at?: string
      }> | null = null

      try {
        const refreshed = await getComplianceDocuments(complianceCaseId)
        refreshedDocuments = refreshed.documents
      } catch {
        refreshedDocuments = null
      }

      setResult((prev) => {
        if (!prev) return prev
        if (!refreshedDocuments) {
          return {
            ...prev,
            documents: prev.documents.map((item) =>
              item.name === documentName
                ? {
                    ...item,
                    status: 'uploaded',
                    filename: file.name,
                    uploadedAt: new Date().toISOString(),
                  }
                : item,
            ),
          }
        }
        return {
          ...prev,
          documents: refreshedDocuments.map((item) => ({
            name: item.name,
            status: (item.status || 'required') as 'required' | 'recommended' | 'uploaded' | 'verified',
            filename: item.filename,
            uploadedAt: item.uploaded_at,
          })),
        }
      })
      add('success', `${documentName} uploaded`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document upload failed'
      add('error', message)
    } finally {
      setUploadingDocument(null)
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

      <div className="dashboard-scroll flex-1 overflow-y-auto p-6 space-y-6">
        <div className="border border-dark p-4 bg-canvas/30 text-sm">
          <div className="label mb-1">USAGE TIER</div>
          <div>
            Upgrade for higher compliance-check limits and team workflows.
            <Link href="/business" className="underline ml-1">See plans</Link>.
          </div>
        </div>
        <ComplianceChecker onCheck={handleCheck} />

        {loading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-dark p-3 bg-canvas">
                <div className="label mb-1">COMPLIANCE CASE ID</div>
                <div className="font-pixel text-xs break-all">
                  {complianceCaseId || 'N/A'}
                </div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label mb-1">CHECK SUMMARY</div>
                <div className="text-xs opacity-80">
                  {result.riskIndicators.length} checks run, {result.documents.length} documents tracked
                </div>
              </div>
            </div>

            <SanctionsAlert
              entity={checkedEntity}
              status={result.sanctionsStatus}
              details={result.sanctionsDetails}
            />

            {result.riskIndicators
              .filter((indicator) => indicator.status === 'warning' || indicator.status === 'danger')
              .length > 0 && (
              <div className="border border-warning p-4 bg-warning/5">
                <div className="label mb-2">ACTION ITEMS</div>
                <ul className="text-sm space-y-1">
                  {result.riskIndicators
                    .filter((indicator) => indicator.status === 'warning' || indicator.status === 'danger')
                    .map((indicator) => (
                      <li key={indicator.label}>- {indicator.label}: {indicator.details || 'Review required'}</li>
                    ))}
                </ul>
              </div>
            )}

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

            <DocumentChecklist
              documents={result.documents}
              onUpload={handleUpload}
              uploadingDocument={uploadingDocument}
            />
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
