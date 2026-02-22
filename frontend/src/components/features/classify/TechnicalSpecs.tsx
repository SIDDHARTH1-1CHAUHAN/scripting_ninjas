'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'

interface Specs {
  material: string
  weight: string
  dimensions: string
  origin_country: string
  intended_use: string
}

interface Props {
  onUpdate: (specs: Specs) => void
}

export function TechnicalSpecs({ onUpdate }: Props) {
  const [specs, setSpecs] = useState<Specs>({
    material: '',
    weight: '',
    dimensions: '',
    origin_country: '',
    intended_use: '',
  })

  const handleChange = (field: keyof Specs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpecs = { ...specs, [field]: e.target.value }
    setSpecs(newSpecs)
    onUpdate(newSpecs)
  }

  return (
    <div className="space-y-4">
      <div className="label">Technical Specifications</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Material"
          placeholder="e.g., Lithium-ion battery"
          value={specs.material}
          onChange={handleChange('material')}
          className="classify-soft-input rounded-xl"
        />
        <Input
          label="Weight"
          placeholder="e.g., 250g"
          value={specs.weight}
          onChange={handleChange('weight')}
          className="classify-soft-input rounded-xl"
        />
        <Input
          label="Dimensions"
          placeholder="e.g., 10x5x2 cm"
          value={specs.dimensions}
          onChange={handleChange('dimensions')}
          className="classify-soft-input rounded-xl"
        />
        <Input
          label="Origin Country"
          placeholder="e.g., China"
          value={specs.origin_country}
          onChange={handleChange('origin_country')}
          className="classify-soft-input rounded-xl"
        />
      </div>
      <Input
        label="Intended Use"
        placeholder="Primary function of the product"
        value={specs.intended_use}
        onChange={handleChange('intended_use')}
        className="classify-soft-input rounded-xl"
      />
      <div className="text-xs text-text-muted">
        Add as many known specs as possible. Better technical detail improves classification accuracy.
      </div>
    </div>
  )
}
