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
          <XAxis dataKey="month" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#080808',
              border: '1px solid #333',
              color: '#E8E8E8',
            }}
          />
          <Area type="monotone" dataKey="value" stroke="#888" fill="#333" name="Total Value" />
          <Area type="monotone" dataKey="savings" stroke="#00C853" fill="#00C85333" name="Savings" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ClassificationChart({ data }: { data: { chapter: string; count: number; percentage: number }[] }) {
  const COLORS = ['#080808', '#333333', '#555555', '#777777', '#999999', '#BBBBBB']

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
            label={({ chapter, percentage }) => `${percentage}%`}
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
          <XAxis dataKey="month" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#080808',
              border: '1px solid #333',
              color: '#E8E8E8',
            }}
          />
          <Bar dataKey="classifications" fill="#080808" name="Classifications" />
          <Bar dataKey="shipments" fill="#555555" name="Shipments" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
