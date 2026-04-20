'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  numero_ses: z.string().min(1, 'Número SES é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  genero: z.enum(['Masculino', 'Feminino'], { required_error: 'Gênero é obrigatório' }),
  observacoes: z.string().optional(),
})

export type PacienteFormData = z.infer<typeof schema>

interface PacienteFormProps {
  defaultValues?: Partial<PacienteFormData>
  onSubmit: (data: PacienteFormData) => Promise<void>
  submitLabel: string
}

export function PacienteForm({ defaultValues, onSubmit, submitLabel }: PacienteFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PacienteFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_nascimento">Data de nascimento</Label>
        <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
        {errors.data_nascimento && <p className="text-xs text-red-500">{errors.data_nascimento.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="numero_ses">Número SES</Label>
        <Input id="numero_ses" {...register('numero_ses')} />
        {errors.numero_ses && <p className="text-xs text-red-500">{errors.numero_ses.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
        {errors.telefone && <p className="text-xs text-red-500">{errors.telefone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Gênero</Label>
        <Select
          value={watch('genero')}
          onValueChange={v => setValue('genero', v as 'Masculino' | 'Feminino', { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
          </SelectContent>
        </Select>
        {errors.genero && <p className="text-xs text-red-500">{errors.genero.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" {...register('observacoes')} rows={3} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
