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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-2 border-text-inv border-t-transparent animate-spin" />
        <div className="label text-[#888]">ANALYZING_PRODUCT...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="text-4xl">📦</div>
        <div className="label text-[#888]">AWAITING_INPUT</div>
        <p className="text-xs text-[#666] max-w-[200px]">
          Enter a product description or upload an image to get HS classification
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="label text-[#888] mb-2">CLASSIFICATION_RESULT</div>
        <HSCodeDisplay code={result.hs_code} description={result.description} />
      </div>

      <div>
        <div className="label text-[#888] mb-2">CONFIDENCE</div>
        <ConfidenceBar value={result.confidence} />
      </div>

      <div>
        <div className="label text-[#888] mb-2">CHAPTER</div>
        <p className="text-sm">{result.chapter}</p>
      </div>

      <div>
        <div className="label text-[#888] mb-2">GIR_APPLIED</div>
        <Tag>{result.gir_applied}</Tag>
      </div>

      <div>
        <div className="label text-[#888] mb-2">REASONING</div>
        <p className="text-sm leading-relaxed">{result.reasoning}</p>
      </div>

      <div>
        <div className="label text-[#888] mb-2">PRIMARY_FUNCTION</div>
        <p className="text-sm">{result.primary_function}</p>
      </div>

      {result.alternatives && result.alternatives.length > 0 && (
        <div>
          <div className="label text-[#888] mb-2">ALTERNATIVES_CONSIDERED</div>
          <div className="space-y-2">
            {result.alternatives.map((alt) => (
              <div key={alt.code} className="border border-[#333] p-3">
                <div className="font-pixel text-sm">{alt.code}</div>
                <div className="text-xs text-[#888]">{alt.description}</div>
                <div className="text-xs text-warning mt-1">✗ {alt.why_not}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.processing_time_ms && (
        <div className="text-xs text-[#666] border-t border-[#333] pt-4">
          {result.cached ? '⚡ CACHED' : '🔄 LIVE'} · {result.processing_time_ms}ms
        </div>
      )}
    </div>
  )
}
