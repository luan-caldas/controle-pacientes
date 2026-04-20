'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

interface Props { filter: PeriodFilter }

export function GraficoDiagnosticos({ filter }: Props) {
  const [data, setData] = useState<{ nome: string; total: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamentos')
        .select('diagnostico:diagnosticos(nome)')

      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)

      const { data: rows } = await query
      if (!rows) return

      const counts: Record<string, number> = {}
      rows.forEach((r: any) => {
        const nome = r.diagnostico?.nome ?? 'Desconhecido'
        counts[nome] = (counts[nome] ?? 0) + 1
      })

      setData(
        Object.entries(counts)
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )
    }
    load()
  }, [filter.from, filter.to])

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
