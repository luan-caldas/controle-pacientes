'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'

const COLORS = ['#3b82f6', '#f59e0b']

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoGenero({ acompanhamentos }: Props) {
  const seen = new Set<string>()
  const counts: Record<string, number> = {}

  acompanhamentos.forEach(a => {
    if (!seen.has(a.paciente_id) && (a.paciente as any)?.genero) {
      seen.add(a.paciente_id)
      const g = (a.paciente as any).genero as string
      counts[g] = (counts[g] ?? 0) + 1
    }
  })

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

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
