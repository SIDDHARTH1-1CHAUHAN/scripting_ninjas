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
      <div className="label">TECHNICAL_SPECIFICATIONS</div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="MATERIAL"
          placeholder="e.g., Lithium-ion battery"
          value={specs.material}
          onChange={handleChange('material')}
        />
        <Input
          label="WEIGHT"
          placeholder="e.g., 250g"
          value={specs.weight}
          onChange={handleChange('weight')}
        />
        <Input
          label="DIMENSIONS"
          placeholder="e.g., 10x5x2 cm"
          value={specs.dimensions}
          onChange={handleChange('dimensions')}
        />
        <Input
          label="ORIGIN_COUNTRY"
          placeholder="e.g., China"
          value={specs.origin_country}
          onChange={handleChange('origin_country')}
        />
      </div>
      <Input
        label="INTENDED_USE"
        placeholder="Primary function of the product"
        value={specs.intended_use}
        onChange={handleChange('intended_use')}
      />
    </div>
  )
}
