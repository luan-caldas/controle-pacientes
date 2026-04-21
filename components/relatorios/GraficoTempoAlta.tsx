'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Acompanhamento } from '@/types'
import { calcularMeses, getFaixaMeses } from '@/lib/calculos'

const FAIXAS = ['< 1 mês', '1-3 meses', '4-6 meses', '7-9 meses', '10-12 meses', '+12 meses']

interface Props { acompanhamentos: Acompanhamento[] }

export function GraficoTempoAlta({ acompanhamentos }: Props) {
  const counts: Record<string, number> = {}
  FAIXAS.forEach(f => (counts[f] = 0))

  acompanhamentos
    .filter(a => a.data_alta)
    .forEach(a => {
      const meses = calcularMeses(a.data_admissao, a.data_alta!)
      const faixa = getFaixaMeses(meses)
      counts[faixa] = (counts[faixa] ?? 0) + 1
    })

  const data = FAIXAS.map(f => ({ faixa: f, total: counts[f] }))

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
