'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'

const COLORS = ['#3b82f6', '#10b981']

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoTipoAdmissao({ acompanhamentos }: Props) {
  const sisreg = acompanhamentos.filter(a => a.tipo_admissao === 'Via SISREG').length
  const data = [
    { name: 'Via SISREG', value: sisreg },
    { name: 'Demanda Espontânea', value: acompanhamentos.length - sisreg },
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
