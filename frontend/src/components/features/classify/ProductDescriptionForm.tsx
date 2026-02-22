'use client'
import { Textarea } from '@/components/ui/Textarea'

interface Props {
  value: string
  onSubmit: (desc: string) => void
}

export function ProductDescriptionForm({ value, onSubmit }: Props) {
  const description = value

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSubmit(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="label">Product Description</div>
      <Textarea
        value={description}
        onChange={handleChange}
        placeholder="Describe your product in detail. Include materials, function, intended use..."
        className="classify-soft-input h-44 rounded-2xl leading-relaxed"
      />
      <div className="flex items-center justify-between text-xs text-text-muted">
        Tip: Include technical specs, materials, and primary function for better accuracy.
        <span>{description.length} chars</span>
      </div>
    </div>
  )
}
