'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import { PacientesTable } from '@/components/pacientes/PacientesTable'
import { NovoPacienteSheet } from '@/components/pacientes/NovoPacienteSheet'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pacs }, { data: acomps }] = await Promise.all([
      supabase.from('pacientes').select('*').order('nome'),
      supabase.from('acompanhamentos').select('*, diagnostico:diagnosticos(id, nome)'),
    ])
    setPacientes(pacs ?? [])
    setAcompanhamentos(acomps ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Pacientes</h1>
        <NovoPacienteSheet onSuccess={load} />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <PacientesTable pacientes={pacientes} acompanhamentos={acompanhamentos} />
        )}
      </div>
    </div>
  )
}
