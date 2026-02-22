'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const MAJOR_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
]

interface FormData {
  hsCode: string
  productValue: number
  quantity: number
  originCountry: string
  destinationCountry: string
  shippingMode: 'ocean' | 'air' | 'rail'
  incoterm: string
}

export function CostCalculatorForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [form, setForm] = useState<FormData>({
    hsCode: '',
    productValue: 0,
    quantity: 1,
    originCountry: 'CN',
    destinationCountry: 'US',
    shippingMode: 'ocean',
    incoterm: 'FOB',
  })

  const updateDecimal = (value: string): number => {
    if (!value.trim()) return 0
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const updateInteger = (value: string): number => {
    if (!value.trim()) return 1
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return 1
    return Math.max(parsed, 1)
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="label">PRODUCT DETAILS</div>
        <Input
          label="HS CODE"
          value={form.hsCode}
          onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
          placeholder="8504.40.95"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="UNIT PRICE (USD)"
            type="number"
            step="0.01"
            min="0"
            value={form.productValue}
            onChange={(e) => setForm({ ...form, productValue: updateDecimal(e.target.value) })}
          />
          <Input
            label="QUANTITY"
            type="number"
            step="1"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: updateInteger(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="label">SHIPPING DETAILS</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="label">ORIGIN</div>
            <select
              value={form.originCountry}
              onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
              className="w-full bg-transparent border border-dark p-3"
            >
              {MAJOR_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label">DESTINATION</div>
            <select
              value={form.destinationCountry}
              onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
              className="w-full bg-transparent border border-dark p-3"
            >
              {MAJOR_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="label">SHIPPING MODE</div>
        <div className="flex gap-4">
          {['ocean', 'air', 'rail'].map((mode) => (
            <button
              key={mode}
              onClick={() => setForm({ ...form, shippingMode: mode as 'ocean' | 'air' | 'rail' })}
              className={`px-4 py-2 border font-pixel text-sm ${
                form.shippingMode === mode ? 'bg-dark text-canvas' : 'border-dark'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-2">
        <Button onClick={() => onSubmit(form)} className="w-full">
          CALCULATE_LANDED_COST ›
        </Button>
      </div>
    </div>
  )
}
