'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const COUNTRY_GROUPS = [
  {
    label: 'North America',
    options: [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexico' },
    ],
  },
  {
    label: 'Latin America',
    options: [
      { code: 'BR', name: 'Brazil' },
      { code: 'AR', name: 'Argentina' },
      { code: 'CL', name: 'Chile' },
      { code: 'CO', name: 'Colombia' },
      { code: 'PE', name: 'Peru' },
    ],
  },
  {
    label: 'Europe',
    options: [
      { code: 'GB', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'BE', name: 'Belgium' },
      { code: 'PL', name: 'Poland' },
      { code: 'SE', name: 'Sweden' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'NO', name: 'Norway' },
      { code: 'UA', name: 'Ukraine' },
      { code: 'RU', name: 'Russia' },
      { code: 'BY', name: 'Belarus' },
    ],
  },
  {
    label: 'Middle East & Africa',
    options: [
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'IL', name: 'Israel' },
      { code: 'TR', name: 'Turkey' },
      { code: 'EG', name: 'Egypt' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'KE', name: 'Kenya' },
      { code: 'IR', name: 'Iran' },
      { code: 'SY', name: 'Syria' },
    ],
  },
  {
    label: 'Asia Pacific',
    options: [
      { code: 'CN', name: 'China' },
      { code: 'IN', name: 'India' },
      { code: 'JP', name: 'Japan' },
      { code: 'KR', name: 'South Korea' },
      { code: 'SG', name: 'Singapore' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'TH', name: 'Thailand' },
      { code: 'VN', name: 'Vietnam' },
      { code: 'ID', name: 'Indonesia' },
      { code: 'PH', name: 'Philippines' },
      { code: 'AU', name: 'Australia' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'KP', name: 'North Korea' },
    ],
  },
]

interface CheckData {
  entity: string
  hsCode: string
  originCountry: string
  destinationCountry: string
  transactionValue: number
}

export function ComplianceChecker({ onCheck }: { onCheck: (data: CheckData) => void }) {
  const [form, setForm] = useState<CheckData>({
    entity: '',
    hsCode: '',
    originCountry: 'CN',
    destinationCountry: 'US',
    transactionValue: 0,
  })

  return (
    <div className="border border-dark p-6">
      <div className="label mb-4">COMPLIANCE CHECK</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="ENTITY NAME"
          value={form.entity}
          onChange={(e) => setForm({ ...form, entity: e.target.value })}
          placeholder="Company or Individual Name"
        />
        <Input
          label="HS CODE"
          value={form.hsCode}
          onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
          placeholder="8504.40.95"
        />
        <div>
          <div className="label">ORIGIN COUNTRY</div>
          <select
            value={form.originCountry}
            onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
            className="w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2"
          >
            {COUNTRY_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((country) => (
                  <option key={`origin-${country.code}`} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <div className="label">DESTINATION COUNTRY</div>
          <select
            value={form.destinationCountry}
            onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
            className="w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2"
          >
            {COUNTRY_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((country) => (
                  <option key={`destination-${country.code}`} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Input
          label="TRANSACTION VALUE (USD)"
          type="number"
          value={form.transactionValue}
          onChange={(e) => setForm({ ...form, transactionValue: Number(e.target.value) })}
          min="0"
          step="0.01"
        />
      </div>
      <div className="text-xs opacity-60 mt-3">
        Tip: Include supplier name for OFAC screening and use full 10-digit HS code for better risk checks.
      </div>
      <div className="mt-4">
        <Button onClick={() => onCheck(form)} className="w-full">
          RUN_COMPLIANCE_CHECK ›
        </Button>
      </div>
    </div>
  )
}
