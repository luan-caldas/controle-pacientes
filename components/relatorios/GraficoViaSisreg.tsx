'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

const COLORS = ['#3b82f6', '#94a3b8']

interface Props { filter: PeriodFilter }

export function GraficoViaSisreg({ filter }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient().from('acompanhamentos').select('via_sisreg')
      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)
      const { data: rows } = await query
      if (!rows) return
      const via = rows.filter(r => r.via_sisreg).length
      setData([
        { name: 'Via SISREG', value: via },
        { name: 'Não via SISREG', value: rows.length - via },
      ])
    }
    load()
  }, [filter.from, filter.to])

  if (data.every(d => d.value === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

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
