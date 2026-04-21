'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoEventos({ acompanhamentos }: Props) {
  const counts: Record<string, number> = {}
  acompanhamentos.forEach(a => {
    (a.eventos ?? []).forEach(e => {
      counts[e.nome] = (counts[e.nome] ?? 0) + 1
    })
  })

  const data = Object.entries(counts)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={160} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
