'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ProductDescriptionForm } from '@/components/features/classify/ProductDescriptionForm'
import { ImageUploadSection } from '@/components/features/classify/ImageUploadSection'
import { TechnicalSpecs } from '@/components/features/classify/TechnicalSpecs'
import { ClassificationPanel } from '@/components/features/classify/ClassificationPanel'
import { Button } from '@/components/ui/Button'

interface ClassificationResult {
  hs_code: string
  confidence: number
  description: string
  chapter: string
  gir_applied: string
  reasoning: string
  primary_function: string
  alternatives?: Array<{ code: string; description: string; why_not: string }>
  processing_time_ms?: number
  cached?: boolean
}

export default function ClassifyPage() {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [_specs, setSpecs] = useState({
    material: '',
    weight: '',
    dimensions: '',
    origin_country: '',
    intended_use: '',
  })
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClassify = async () => {
    setIsLoading(true)
    // Mock API call - will be replaced with real API
    await new Promise(r => setTimeout(r, 2000))
    setResult({
      hs_code: '8504.40.95',
      confidence: 94,
      description: 'Static converters; power supplies',
      chapter: 'Chapter 85 - Electrical machinery',
      gir_applied: 'GIR 3(b) - Essential character',
      reasoning: 'Based on GIR 3(b), the essential character is the charging function. The device converts AC to DC power for charging electronic devices.',
      primary_function: 'Charging electronic devices',
      alternatives: [
        { code: '8513.10.40', description: 'Portable flashlights', why_not: 'Secondary feature only' },
      ],
      processing_time_ms: 2340,
      cached: false,
    })
    setIsLoading(false)
  }

  const handleClear = () => {
    setDescription('')
    setImage(null)
    setSpecs({
      material: '',
      weight: '',
      dimensions: '',
      origin_country: '',
      intended_use: '',
    })
    setResult(null)
  }

  return (
    <AppLayout rightPanel={<ClassificationPanel result={result} isLoading={isLoading} />}>
      <WorkspaceHeader
        title="CLASSIFY"
        pixelTitle="PRODUCT"
        metaLabel="AI_ENGINE"
        metaValue="GROQ_LLM"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <ProductDescriptionForm onSubmit={setDescription} />
        <ImageUploadSection onUpload={setImage} />
        <TechnicalSpecs onUpdate={setSpecs} />

        <div className="flex gap-4">
          <Button
            onClick={handleClassify}
            disabled={isLoading || (!description && !image)}
          >
            {isLoading ? 'CLASSIFYING...' : 'CLASSIFY_PRODUCT'}
          </Button>
          <Button variant="secondary" onClick={handleClear}>
            CLEAR
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
