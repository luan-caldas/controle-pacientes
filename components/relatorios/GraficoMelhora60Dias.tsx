'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'
import { calcularDiasAcompanhamento } from '@/lib/calculos'

const COLORS = ['#10b981', '#94a3b8']

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoMelhora60Dias({ acompanhamentos }: Props) {
  const comAlta = acompanhamentos.filter(a => a.data_alta)
  const em60 = comAlta.filter(a => calcularDiasAcompanhamento(a.data_admissao, a.data_alta) <= 60).length
  const data = [
    { name: 'Alta ≤ 60 dias', value: em60 },
    { name: 'Mais de 60 dias', value: comAlta.length - em60 },
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
