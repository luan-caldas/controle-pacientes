'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { Textarea } from '@/components/ui/textarea'
import { DiagnosticoCombobox } from './DiagnosticoCombobox'
import { EventosMultiSelect } from './EventosMultiSelect'
import { createClient } from '@/lib/supabase/client'
import { Paciente } from '@/types'

const schema = z.object({
  paciente_id: z.string().uuid('Paciente é obrigatório'),
  diagnostico_id: z.string().uuid('Diagnóstico é obrigatório'),
  tipo_admissao: z.enum(['Via SISREG', 'Demanda Espontânea']),
  data_admissao: z.string().min(1, 'Data de admissão é obrigatória'),
  data_alta: z.string().optional().nullable().transform(v => v === '' ? null : (v ?? null)),
  recidiva: z.boolean(),
  eventos_ids: z.array(z.string().uuid()),
  observacao: z.string().optional(),
})

export type AcompanhamentoFormData = z.infer<typeof schema>
type AcompanhamentoFormInput = z.input<typeof schema>

interface AcompanhamentoFormProps {
  defaultValues?: Partial<AcompanhamentoFormInput>
  pacienteIdFixo?: string
  onSubmit: (data: AcompanhamentoFormData) => Promise<void>
  submitLabel: string
}

export function AcompanhamentoForm({
  defaultValues,
  pacienteIdFixo,
  onSubmit,
  submitLabel,
}: AcompanhamentoFormProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AcompanhamentoFormInput, unknown, AcompanhamentoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_admissao: 'Via SISREG' as const,
      recidiva: false,
      eventos_ids: [],
      ...defaultValues,
      ...(pacienteIdFixo ? { paciente_id: pacienteIdFixo } : {}),
    },
  })

  useEffect(() => {
    if (!pacienteIdFixo) {
      createClient()
        .from('pacientes')
        .select('id, nome')
        .order('nome')
        .then(({ data }) => {
          if (data) setPacientes(data as Paciente[])
        })
    }
  }, [pacienteIdFixo])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!pacienteIdFixo && (
        <div className="space-y-1.5">
          <Label>Paciente</Label>
          <Controller
            control={control}
            name="paciente_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente...">
                    {field.value ? pacientes.find(p => p.id === field.value)?.nome : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[400px]">
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.paciente_id && (
            <p className="text-xs text-red-500">{errors.paciente_id.message}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Diagnóstico</Label>
        <Controller
          control={control}
          name="diagnostico_id"
          render={({ field }) => (
            <DiagnosticoCombobox value={field.value ?? null} onChange={field.onChange} />
          )}
        />
        {errors.diagnostico_id && (
          <p className="text-xs text-red-500">{errors.diagnostico_id.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_admissao">Data de admissão</Label>
        <Input id="data_admissao" type="date" {...register('data_admissao')} />
        {errors.data_admissao && (
          <p className="text-xs text-red-500">{errors.data_admissao.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_alta">
          Data de alta{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </Label>
        <Input id="data_alta" type="date" {...register('data_alta')} />
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de admissão</Label>
        <Controller
          control={control}
          name="tipo_admissao"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Via SISREG">Via SISREG</SelectItem>
                <SelectItem value="Demanda Espontânea">Demanda Espontânea</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="recidiva"
          render={({ field }) => (
            <Checkbox
              id="recidiva"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="recidiva" className="cursor-pointer">Recidiva</Label>
      </div>

      <div className="space-y-1.5">
        <Label>
          Eventos não esperados{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </Label>
        <Controller
          control={control}
          name="eventos_ids"
          render={({ field }) => (
            <EventosMultiSelect value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacao">
          Observação{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </Label>
        <Textarea id="observacao" {...register('observacao')} rows={3} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
