'use client'
import { HSCodeDisplay } from '@/components/ui/HSCodeDisplay'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { Tag } from '@/components/ui/Tag'

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

interface Props {
  result: ClassificationResult | null
  isLoading: boolean
}

export function ClassificationPanel({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="classify-result-block flex h-64 flex-col items-center justify-center gap-4 p-5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-inv border-t-transparent" />
        <div className="label text-text-muted">Analyzing Product...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="classify-result-block flex h-64 flex-col items-center justify-center gap-4 p-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dark/50 bg-canvas/70 text-2xl">◎</div>
        <div className="label text-text-muted">Awaiting Input</div>
        <p className="text-xs text-text-muted max-w-[220px]">
          Enter a product description or upload an image to generate a classification.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 label text-text-muted">Classification Result</div>
        <HSCodeDisplay code={result.hs_code} description={result.description} />
      </div>

      <div className="classify-result-block p-4">
        <div className="mb-2 label text-text-muted">Confidence</div>
        <ConfidenceBar value={result.confidence} />
      </div>

      <div className="grid gap-3">
        <div className="classify-result-block p-4">
          <div className="mb-2 label text-text-muted">Chapter</div>
          <p className="text-sm leading-relaxed text-text-main">{result.chapter}</p>
        </div>
        <div className="classify-result-block p-4">
          <div className="mb-2 label text-text-muted">GIR Applied</div>
          <Tag variant="dark">{result.gir_applied}</Tag>
        </div>
      </div>

      <div className="classify-result-block p-4">
        <div className="mb-2 label text-text-muted">Reasoning</div>
        <p className="text-sm leading-relaxed text-text-main">{result.reasoning}</p>
      </div>

      <div className="classify-result-block p-4">
        <div className="mb-2 label text-text-muted">Primary Function</div>
        <p className="text-sm leading-relaxed text-text-main">{result.primary_function}</p>
      </div>

      {result.alternatives && result.alternatives.length > 0 && (
        <div>
          <div className="mb-2 label text-text-muted">Alternatives Considered</div>
          <div className="space-y-2">
            {result.alternatives.map((alt) => (
              <div key={alt.code} className="classify-result-block p-3">
                <div className="font-mono text-sm font-semibold tracking-[0.06em] text-text-main">{alt.code}</div>
                <div className="mt-1 text-xs text-text-muted">{alt.description}</div>
                <div className="mt-1 text-xs text-warning">Excluded: {alt.why_not}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.processing_time_ms && (
        <div className="border-t border-dark/30 pt-4 text-xs text-text-muted">
          {result.cached ? 'Cached' : 'Live'} • {result.processing_time_ms} ms
        </div>
      )}
    </div>
  )
}
