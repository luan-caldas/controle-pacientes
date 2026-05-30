'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento, Paciente, ReportFilter, defaultReportFilter } from '@/types'
import { calcularIdade, calcularDiasAcompanhamento } from '@/lib/calculos'
import { ReportFiltersPanel } from '@/components/relatorios/ReportFiltersPanel'
import { ChartCard } from '@/components/relatorios/ChartCard'
import { GraficoGenero } from '@/components/relatorios/GraficoGenero'
import { GraficoDiagnosticos } from '@/components/relatorios/GraficoDiagnosticos'
import { GraficoTempoAlta } from '@/components/relatorios/GraficoTempoAlta'
import { GraficoRecidiva } from '@/components/relatorios/GraficoRecidiva'
import { GraficoTipoAdmissao } from '@/components/relatorios/GraficoTipoAdmissao'
import { GraficoMelhora60Dias } from '@/components/relatorios/GraficoMelhora60Dias'
import { GraficoEventos } from '@/components/relatorios/GraficoEventos'

export default function RelatoriosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReportFilter>(defaultReportFilter)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pacs }, { data: acomps }] = await Promise.all([
      supabase.from('pacientes').select('*'),
      supabase.from('acompanhamentos').select(`
        *,
        paciente:pacientes(*),
        diagnostico:diagnosticos(id, nome),
        eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
      `),
    ])
    setPacientes(pacs ?? [])
    setAcompanhamentos((acomps ?? []).map((a: any) => ({
      ...a,
      eventos: a.eventos?.map((e: any) => e.evento) ?? [],
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const f = filter

  const filteredPacientes = useMemo(() => {
    return pacientes.filter(p => {
      if (f.genero !== 'Todos' && p.genero !== f.genero) return false
      if (f.idadeMin !== '' || f.idadeMax !== '') {
        const idade = calcularIdade(p.data_nascimento)
        if (f.idadeMin !== '' && idade < (f.idadeMin as number)) return false
        if (f.idadeMax !== '' && idade > (f.idadeMax as number)) return false
      }
      if (f.statusPaciente !== 'Todos') {
        const hasActive = acompanhamentos.some(a => a.paciente_id === p.id && !a.data_alta)
        if (f.statusPaciente === 'Ativo' && !hasActive) return false
        if (f.statusPaciente === 'Inativo' && hasActive) return false
      }
      return true
    })
  }, [pacientes, acompanhamentos, filter])

  const filtered = useMemo(() => {
    return acompanhamentos.filter(a => {
      if (f.dataAdmissaoMin && a.data_admissao < f.dataAdmissaoMin) return false
      if (f.dataAdmissaoMax && a.data_admissao > f.dataAdmissaoMax) return false
      if (f.dataAltaMin && (!a.data_alta || a.data_alta < f.dataAltaMin)) return false
      if (f.dataAltaMax && (!a.data_alta || a.data_alta > f.dataAltaMax)) return false
      if (f.statusAcomp === 'Ativo' && a.data_alta) return false
      if (f.statusAcomp === 'Alta' && !a.data_alta) return false
      if (f.diagnostico !== 'Todos' && a.diagnostico?.nome !== f.diagnostico) return false
      if (f.tipoAdmissao !== 'Todos' && a.tipo_admissao !== f.tipoAdmissao) return false
      if (f.recidiva === 'Sim' && !a.recidiva) return false
      if (f.recidiva === 'Nao' && a.recidiva) return false
      if (f.eventos.length > 0) {
        const ids = (a.eventos ?? []).map((e: any) => e.id)
        if (!f.eventos.some(id => ids.includes(id))) return false
      }
      const dias = calcularDiasAcompanhamento(a.data_admissao, a.data_alta)
      if (f.diasMin !== '' && dias < (f.diasMin as number)) return false
      if (f.diasMax !== '' && dias > (f.diasMax as number)) return false
      const pacGenero = (a.paciente as any)?.genero
      if (f.genero !== 'Todos' && pacGenero !== f.genero) return false
      if (f.idadeMin !== '' || f.idadeMax !== '') {
        const nasc = (a.paciente as any)?.data_nascimento
        if (!nasc) return false
        const idade = calcularIdade(nasc)
        if (f.idadeMin !== '' && idade < (f.idadeMin as number)) return false
        if (f.idadeMax !== '' && idade > (f.idadeMax as number)) return false
      }
      if (f.statusPaciente !== 'Todos') {
        const hasActive = acompanhamentos.some(a2 => a2.paciente_id === a.paciente_id && !a2.data_alta)
        if (f.statusPaciente === 'Ativo' && !hasActive) return false
        if (f.statusPaciente === 'Inativo' && hasActive) return false
      }
      return true
    })
  }, [acompanhamentos, filter])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-800">Relatórios</h1>

      <ReportFiltersPanel value={filter} onChange={setFilter} />

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Gênero">
            {() => <GraficoGenero pacientes={filteredPacientes} />}
          </ChartCard>

          <ChartCard title="Diagnósticos">
            {() => <GraficoDiagnosticos acompanhamentos={filtered} />}
          </ChartCard>

          <ChartCard title="Tempo para Alta (meses)">
            {() => <GraficoTempoAlta acompanhamentos={filtered} />}
          </ChartCard>

          <ChartCard title="Recidiva">
            {() => <GraficoRecidiva acompanhamentos={filtered} />}
          </ChartCard>

          <ChartCard title="Tipo de Admissão">
            {() => <GraficoTipoAdmissao acompanhamentos={filtered} />}
          </ChartCard>

          <ChartCard title="Melhora em até 60 dias">
            {() => <GraficoMelhora60Dias acompanhamentos={filtered} />}
          </ChartCard>

          <ChartCard title="Eventos Não Esperados">
            {() => <GraficoEventos acompanhamentos={filtered} />}
          </ChartCard>
        </div>
      )}
    </div>
  )
}
