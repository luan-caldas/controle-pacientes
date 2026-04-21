'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento } from '@/types'
import { AcompanhamentosTable } from '@/components/acompanhamentos/AcompanhamentosTable'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AcompanhamentoForm,
  AcompanhamentoFormData,
} from '@/components/acompanhamentos/AcompanhamentoForm'

export default function AcompanhamentosPage() {
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('acompanhamentos')
        .select(`
          *,
          paciente:pacientes(id, nome),
          diagnostico:diagnosticos(id, nome),
          eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
        `)
      const normalized = (data ?? []).map((a: any) => ({
        ...a,
        eventos: a.eventos?.map((e: any) => e.evento) ?? [],
      }))
      setAcompanhamentos(normalized)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(data: AcompanhamentoFormData) {
    setSaveError(null)
    const supabase = createClient()
    const { eventos_ids, data_alta, ...rest } = data
    const { data: novo, error } = await supabase
      .from('acompanhamentos')
      .insert({ ...rest, data_alta: data_alta ?? null })
      .select()
      .single()

    if (error || !novo) {
      setSaveError('Erro ao salvar. Tente novamente.')
      return
    }

    if (eventos_ids.length > 0) {
      const { error: evError } = await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: novo.id, evento_id }))
      )
      if (evError) {
        setSaveError('Acompanhamento salvo, mas erro ao registrar eventos.')
        return
      }
    }

    setSheetOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Acompanhamentos</h1>
        <Button size="sm" className="gap-2" onClick={() => setSheetOpen(true)}>
          <Plus size={15} /> Novo Acompanhamento
        </Button>
        <Sheet open={sheetOpen} onOpenChange={(v) => { setSheetOpen(v); if (!v) setSaveError(null) }}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Novo Acompanhamento</SheetTitle></SheetHeader>
            <div className="mt-6">
              <AcompanhamentoForm onSubmit={handleSubmit} submitLabel="Cadastrar" />
            </div>
            {saveError && (
              <p className="text-sm text-red-600 mt-2 text-center">{saveError}</p>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <AcompanhamentosTable acompanhamentos={acompanhamentos} />
        )}
      </div>
    </div>
  )
}
