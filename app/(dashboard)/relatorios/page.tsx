'use client'

import { useState } from 'react'
import { PeriodFilter as PeriodFilterType } from '@/types'
import { PeriodFilter } from '@/components/relatorios/PeriodFilter'
import { ChartCard } from '@/components/relatorios/ChartCard'
import { GraficoGenero } from '@/components/relatorios/GraficoGenero'
import { GraficoDiagnosticos } from '@/components/relatorios/GraficoDiagnosticos'
import { GraficoTempoAlta } from '@/components/relatorios/GraficoTempoAlta'
import { GraficoRecidiva } from '@/components/relatorios/GraficoRecidiva'
import { GraficoViaSisreg } from '@/components/relatorios/GraficoViaSisreg'
import { GraficoMelhora60Dias } from '@/components/relatorios/GraficoMelhora60Dias'
import { GraficoEventos } from '@/components/relatorios/GraficoEventos'

export default function RelatoriosPage() {
  const [globalFilter, setGlobalFilter] = useState<PeriodFilterType>({ from: null, to: null })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <h1 className="text-lg font-semibold text-slate-800">Relatórios</h1>
        <PeriodFilter value={globalFilter} onChange={setGlobalFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Gênero" globalFilter={globalFilter} hideFilter>
          {() => <GraficoGenero />}
        </ChartCard>

        <ChartCard title="Diagnósticos" globalFilter={globalFilter}>
          {filter => <GraficoDiagnosticos filter={filter} />}
        </ChartCard>

        <ChartCard title="Tempo para Alta (meses)" globalFilter={globalFilter}>
          {filter => <GraficoTempoAlta filter={filter} />}
        </ChartCard>

        <ChartCard title="Recidiva" globalFilter={globalFilter}>
          {filter => <GraficoRecidiva filter={filter} />}
        </ChartCard>

        <ChartCard title="Via SISREG" globalFilter={globalFilter}>
          {filter => <GraficoViaSisreg filter={filter} />}
        </ChartCard>

        <ChartCard title="Melhora em até 60 dias" globalFilter={globalFilter}>
          {filter => <GraficoMelhora60Dias filter={filter} />}
        </ChartCard>

        <ChartCard title="Eventos Não Esperados" globalFilter={globalFilter}>
          {filter => <GraficoEventos filter={filter} />}
        </ChartCard>
      </div>
    </div>
  )
}
