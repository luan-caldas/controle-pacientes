'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'
import { calcularMeses, getFaixaMeses } from '@/lib/calculos'

const FAIXAS = ['< 1 mês', '1-3 meses', '4-6 meses', '7-9 meses', '10-12 meses', '+12 meses']

interface Props { filter: PeriodFilter }

export function GraficoTempoAlta({ filter }: Props) {
  const [data, setData] = useState(FAIXAS.map(f => ({ faixa: f, total: 0 })))

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamentos')
        .select('data_admissao, data_alta')
        .not('data_alta', 'is', null)

      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)

      const { data: rows } = await query
      if (!rows) return

      const counts: Record<string, number> = {}
      FAIXAS.forEach(f => (counts[f] = 0))

      rows.forEach((r: any) => {
        const meses = calcularMeses(r.data_admissao, r.data_alta)
        const faixa = getFaixaMeses(meses)
        counts[faixa] = (counts[faixa] ?? 0) + 1
      })

      setData(FAIXAS.map(f => ({ faixa: f, total: counts[f] })))
    }
    load()
  }, [filter.from, filter.to])

  if (data.every(d => d.total === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
