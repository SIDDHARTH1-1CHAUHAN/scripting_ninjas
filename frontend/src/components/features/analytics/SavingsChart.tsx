'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface ChartData {
  month: string
  value: number
  savings: number
}

export function SavingsChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} />
          <YAxis stroke="var(--text-muted)" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-dark)',
              color: 'var(--text-main)',
            }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--accent-strong)" fill="rgba(129, 111, 232, 0.22)" name="Total Value" />
          <Area type="monotone" dataKey="savings" stroke="var(--accent)" fill="rgba(212, 180, 106, 0.25)" name="Savings" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ClassificationChart({ data }: { data: { chapter: string; count: number; percentage: number }[] }) {
  const COLORS = ['#8f7bfd', '#d4b46a', '#5db3d5', '#a27cff', '#f0aa66', '#7f8cff']

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="count"
            nameKey="chapter"
            label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthlyTrendChart({ data }: { data: { month: string; classifications: number; shipments: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} />
          <YAxis stroke="var(--text-muted)" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-dark)',
              color: 'var(--text-main)',
            }}
          />
          <Bar dataKey="classifications" fill="var(--accent-strong)" name="Classifications" radius={[3, 3, 0, 0]} />
          <Bar dataKey="shipments" fill="var(--accent)" name="Shipments" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
