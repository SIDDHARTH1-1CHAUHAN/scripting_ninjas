interface CostBreakdownProps {
  data: {
    productValue: number
    baseDuty: number
    section301: number
    mpf: number
    hmf: number
    freight: number
    insurance: number
    totalLanded: number
    perUnit: number
  }
}

export function CostBreakdown({ data }: CostBreakdownProps) {
  const rows = [
    { label: 'Product Value', value: data.productValue },
    { label: 'Base Duty', value: data.baseDuty, indent: true },
    { label: 'Section 301 Tariff', value: data.section301, indent: true, warning: data.section301 > 0 },
    { label: 'MPF', value: data.mpf, indent: true },
    { label: 'HMF', value: data.hmf, indent: true },
    { label: 'Freight', value: data.freight },
    { label: 'Insurance', value: data.insurance },
  ]

  return (
    <div className="border border-dark p-6 space-y-3">
      <div className="label">COST BREAKDOWN</div>
      {rows.map((row) => (
        <div key={row.label} className={`flex justify-between text-sm ${row.indent ? 'pl-4' : ''}`}>
          <span className={row.warning ? 'text-warning' : ''}>{row.label}</span>
          <span className="font-pixel">${row.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
      <div className="border-t border-dark pt-3 mt-3">
        <div className="flex justify-between font-bold">
          <span>TOTAL LANDED</span>
          <span className="font-pixel text-xl">${data.totalLanded.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm opacity-60 mt-1">
          <span>Per Unit</span>
          <span>${data.perUnit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
