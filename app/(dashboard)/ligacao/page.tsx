'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import { getDiagnosticoAtivo, formatarDataBR } from '@/lib/calculos'
import { Button } from '@/components/ui/button'

interface PacienteAtivo extends Paciente {
  diagnosticoAtivo: string | null
}

export default function LigacaoPage() {
  const [pacientes, setPacientes] = useState<PacienteAtivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('acompanhamentos')
          .select(`
            data_alta,
            created_at,
            paciente:pacientes(id, nome, data_nascimento, numero_ses, telefone, genero, observacoes, created_at),
            diagnostico:diagnosticos(id, nome)
          `)
          .is('data_alta', null)

        if (!data) return

        const porPaciente = new Map<string, { paciente: Paciente; acomps: Acompanhamento[] }>()

        for (const row of data as any[]) {
          const p: Paciente = row.paciente
          if (!porPaciente.has(p.id)) {
            porPaciente.set(p.id, { paciente: p, acomps: [] })
          }
          porPaciente.get(p.id)!.acomps.push({
            ...row,
            paciente_id: p.id,
            paciente: p,
            diagnostico: row.diagnostico,
            eventos: [],
          })
        }

        const resultado: PacienteAtivo[] = Array.from(porPaciente.values())
          .map(({ paciente, acomps }) => ({
            ...paciente,
            diagnosticoAtivo: getDiagnosticoAtivo(acomps),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome))

        setPacientes(resultado)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-lg font-semibold text-slate-800">Lista de Ligação</h1>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer size={15} />
          Imprimir
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm print:hidden">Carregando...</div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4 print:hidden">
            {pacientes.length} paciente(s) com acompanhamento ativo
          </p>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden print:border-0 print:rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 print:bg-white">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome Completo</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Data de Nascimento</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nº SES</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Diagnóstico Atual</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum paciente com acompanhamento ativo.
                    </td>
                  </tr>
                )}
                {pacientes.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-white'}>
                    <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                    <td className="px-4 py-2.5">{formatarDataBR(p.data_nascimento)}</td>
                    <td className="px-4 py-2.5">{p.numero_ses}</td>
                    <td className="px-4 py-2.5">{p.telefone}</td>
                    <td className="px-4 py-2.5">{p.diagnosticoAtivo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 1.5cm; }
          body { font-size: 11px; }
          aside, header, nav, button, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 6px 10px; }
          thead { background: #f8fafc; }
        }
      `}</style>
    </div>
  )
}
