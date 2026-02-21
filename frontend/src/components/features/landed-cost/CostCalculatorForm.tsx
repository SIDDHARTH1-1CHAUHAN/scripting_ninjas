'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
            label="VALUE (USD)"
            type="number"
            value={form.productValue}
            onChange={(e) => setForm({ ...form, productValue: Number(e.target.value) })}
          />
          <Input
            label="QUANTITY"
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
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
              <option value="CN">China</option>
              <option value="VN">Vietnam</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
            </select>
          </div>
          <div>
            <div className="label">DESTINATION</div>
            <select
              value={form.destinationCountry}
              onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
              className="w-full bg-transparent border border-dark p-3"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="MX">Mexico</option>
              <option value="GB">United Kingdom</option>
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
