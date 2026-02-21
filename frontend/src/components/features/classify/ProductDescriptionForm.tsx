'use client'
import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'

interface Props {
  onSubmit: (desc: string) => void
}

export function ProductDescriptionForm({ onSubmit }: Props) {
  const [description, setDescription] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    onSubmit(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="label">PRODUCT DESCRIPTION</div>
      <Textarea
        value={description}
        onChange={handleChange}
        placeholder="Describe your product in detail. Include materials, function, intended use..."
        className="h-40"
      />
      <div className="text-xs opacity-60">
        TIP: Include technical specifications, materials, and primary function for better classification.
      </div>
    </div>
  )
}
