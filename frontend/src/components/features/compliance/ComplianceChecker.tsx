'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
      <div className="grid grid-cols-2 gap-4">
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
            className="w-full bg-transparent border border-dark p-3"
          >
            <option value="CN">China</option>
            <option value="RU">Russia</option>
            <option value="IR">Iran</option>
            <option value="KP">North Korea</option>
            <option value="SY">Syria</option>
            <option value="CU">Cuba</option>
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
            <option value="EU">European Union</option>
          </select>
        </div>
        <Input
          label="TRANSACTION VALUE (USD)"
          type="number"
          value={form.transactionValue}
          onChange={(e) => setForm({ ...form, transactionValue: Number(e.target.value) })}
        />
      </div>
      <div className="mt-4">
        <Button onClick={() => onCheck(form)} className="w-full">
          RUN_COMPLIANCE_CHECK ›
        </Button>
      </div>
    </div>
  )
}
