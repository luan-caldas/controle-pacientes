'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'

const COLORS = ['#ef4444', '#10b981']

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoRecidiva({ acompanhamentos }: Props) {
  const comRecidiva = acompanhamentos.filter(a => a.recidiva).length
  const data = [
    { name: 'Com recidiva', value: comRecidiva },
    { name: 'Sem recidiva', value: acompanhamentos.length - comRecidiva },
  ]

  if (data.every(d => d.value === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
