'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ProductDescriptionForm } from '@/components/features/classify/ProductDescriptionForm'
import { ImageUploadSection } from '@/components/features/classify/ImageUploadSection'
import { TechnicalSpecs } from '@/components/features/classify/TechnicalSpecs'
import { ClassificationPanel } from '@/components/features/classify/ClassificationPanel'
import { Button } from '@/components/ui/Button'
import { useClassification, useImageClassification } from '@/hooks'
import { useToast } from '@/components/ui/Toast'
import type { HSClassification } from '@/lib/api'

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

const EXAMPLE_PROMPTS = [
  'Bluetooth headphones with ANC and mic',
  'Stainless steel insulated bottle 32oz',
  'Solar charger with LED flashlight',
  'Lithium battery accessory kit',
]

export default function ClassifyPage() {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [specs, setSpecs] = useState({
    material: '',
    weight: '',
    dimensions: '',
    origin_country: '',
    intended_use: '',
  })
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const classifyMutation = useClassification()
  const imageClassifyMutation = useImageClassification()
  const { add } = useToast()
  const isLoading = classifyMutation.isPending || imageClassifyMutation.isPending

  const buildContext = () => {
    const entries = Object.entries(specs)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)

    return entries.length > 0 ? entries.join('\n') : undefined
  }

  const mapClassificationResult = (apiResult: HSClassification): ClassificationResult => ({
    hs_code: apiResult.hs_code,
    confidence: apiResult.confidence,
    description: apiResult.description,
    chapter: apiResult.chapter || 'Chapter not provided',
    gir_applied: apiResult.gir_applied || 'GIR not provided',
    reasoning: apiResult.reasoning || 'Reasoning not provided',
    primary_function: apiResult.primary_function || 'Primary function not provided',
    alternatives: (apiResult.alternatives || []).map((alternative) => ({
      code: alternative.code,
      description: alternative.description,
      why_not: alternative.why_not || 'No exclusion note provided',
    })),
    processing_time_ms: apiResult.processing_time_ms,
    cached: apiResult.cached,
  })

  const handleClassify = async () => {
    const trimmedDescription = description.trim()
    if (!trimmedDescription && !image) {
      add('warning', 'Provide a product description or image first')
      return
    }

    try {
      const context = buildContext()
      let classificationResult: HSClassification

      if (image) {
        const imageResult = await imageClassifyMutation.mutateAsync({
          image,
          context: context || trimmedDescription || undefined,
        })
        classificationResult = imageResult.classification
      } else {
        classificationResult = await classifyMutation.mutateAsync({
          description: trimmedDescription,
          context,
        })
      }

      setResult(mapClassificationResult(classificationResult))
      add('success', 'Classification complete')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Classification failed'
      add('error', message)
    }
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
    classifyMutation.reset()
    imageClassifyMutation.reset()
  }

  return (
    <AppLayout rightPanel={<ClassificationPanel result={result} isLoading={isLoading} />}>
      <WorkspaceHeader
        title="CLASSIFY"
        pixelTitle="PRODUCT"
        metaLabel="AI Engine"
        metaValue="GEMINI+GROQ"
      />
      <div className="classify-page dashboard-scroll flex-1 space-y-7 overflow-y-auto p-6">
        <div className="classify-surface classify-surface-hover rounded-3xl p-4 text-sm">
          <div className="label mb-1">Plan Status</div>
          <div>
            You are on <span className="font-semibold tracking-wide">FREE</span>. Need higher monthly limits and team access?
            <Link href="/business" className="underline ml-1">View upgrade options</Link>.
          </div>
        </div>

        <section className="classify-surface classify-surface-hover rounded-3xl p-5 space-y-4">
          <div className="label">Quick Start Examples</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setDescription(prompt)}
                className="classify-chip rounded-full border border-dark/45 px-3 py-2 text-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="classify-surface classify-surface-hover rounded-3xl p-5 space-y-6">
          <ProductDescriptionForm value={description} onSubmit={setDescription} />
          <ImageUploadSection onUpload={setImage} />
          <TechnicalSpecs onUpdate={setSpecs} />
        </section>

        <div className="classify-action-dock sticky bottom-0 z-10 rounded-3xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="classify-status-pill rounded-full px-4 py-2 text-xs text-text-muted">
              {description.trim() || image ? 'Ready to classify with current inputs.' : 'Add description or image to enable classification.'}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleClassify}
                disabled={isLoading || (!description && !image)}
                className="rounded-full border border-dark/40 px-6 py-3 shadow-none hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(21,27,46,0.24)]"
              >
                {isLoading ? 'CLASSIFYING...' : 'CLASSIFY PRODUCT'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleClear}
                className="rounded-full border border-dark/40 px-6 py-3 shadow-none hover:-translate-y-0.5"
              >
                CLEAR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
