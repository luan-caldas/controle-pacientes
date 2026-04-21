'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { PacienteForm, PacienteFormData } from './PacienteForm'

interface NovoPacienteSheetProps {
  onSuccess: () => void
}

export function NovoPacienteSheet({ onSuccess }: NovoPacienteSheetProps) {
  const [open, setOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSubmit(data: PacienteFormData) {
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from('pacientes').insert(data)
    if (error) {
      setSaveError('Erro ao salvar. Tente novamente.')
      return
    }
    setOpen(false)
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSaveError(null) }}>
      <SheetTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus size={15} />
        Novo Paciente
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Paciente</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PacienteForm onSubmit={handleSubmit} submitLabel="Cadastrar Paciente" />
        </div>
        {saveError && (
          <p className="text-sm text-red-600 mt-2 text-center">{saveError}</p>
        )}
      </SheetContent>
    </Sheet>
  )
}
