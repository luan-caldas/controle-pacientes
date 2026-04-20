'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#3b82f6', '#f59e0b']

export function GraficoGenero() {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    createClient()
      .from('pacientes')
      .select('genero')
      .then(({ data: rows }) => {
        if (!rows) return
        const counts: Record<string, number> = {}
        rows.forEach(r => { counts[r.genero] = (counts[r.genero] ?? 0) + 1 })
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })))
      })
  }, [])

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
