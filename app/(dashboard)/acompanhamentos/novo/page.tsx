'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  AcompanhamentoForm,
  AcompanhamentoFormData,
} from '@/components/acompanhamentos/AcompanhamentoForm'

function NovoAcompanhamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('paciente_id')

  async function handleSubmit(data: AcompanhamentoFormData) {
    const supabase = createClient()
    const { eventos_ids, data_alta, ...rest } = data
    const { data: novo, error } = await supabase
      .from('acompanhamentos')
      .insert({ ...rest, data_alta: data_alta ?? null })
      .select()
      .single()

    if (error || !novo) return

    if (eventos_ids.length > 0) {
      await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: novo.id, evento_id }))
      )
    }

    if (pacienteId) {
      router.push(`/pacientes/${pacienteId}`)
    } else {
      router.push('/acompanhamentos')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 text-slate-600"
      >
        <ArrowLeft size={15} /> Voltar
      </Button>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-6">Novo Acompanhamento</h1>
        <AcompanhamentoForm
          pacienteIdFixo={pacienteId ?? undefined}
          onSubmit={handleSubmit}
          submitLabel="Cadastrar Acompanhamento"
        />
      </div>
    </div>
  )
}

export default function NovoAcompanhamentoPage() {
  return (
    <Suspense>
      <NovoAcompanhamentoContent />
    </Suspense>
  )
}
