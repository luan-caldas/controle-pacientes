'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

interface Props { filter: PeriodFilter }

export function GraficoEventos({ filter }: Props) {
  const [data, setData] = useState<{ nome: string; total: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamento_eventos')
        .select(`
          evento:eventos_nao_esperados(nome),
          acompanhamento:acompanhamentos(data_admissao)
        `)

      const { data: rows } = await query
      if (!rows) return

      const filtered = (rows as any[]).filter(r => {
        const admissao = r.acompanhamento?.data_admissao
        if (!admissao) return false
        if (filter.from && admissao < filter.from) return false
        if (filter.to && admissao > filter.to) return false
        return true
      })

      const counts: Record<string, number> = {}
      filtered.forEach(r => {
        const nome = r.evento?.nome ?? 'Desconhecido'
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
        <YAxis type="category" dataKey="nome" width={160} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
