'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento } from '@/types'
import { isAtivo, calcularDiasAcompanhamento, formatarDataBR } from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AcompanhamentoForm,
  AcompanhamentoFormData,
} from '@/components/acompanhamentos/AcompanhamentoForm'

export default function AcompanhamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [acomp, setAcomp] = useState<Acompanhamento | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('acompanhamentos')
        .select(`
          *,
          paciente:pacientes(id, nome, data_nascimento, numero_ses, telefone, genero, observacoes, created_at),
          diagnostico:diagnosticos(id, nome),
          eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
        `)
        .eq('id', id)
        .single()

      if (data) {
        setAcomp({ ...data, eventos: data.eventos?.map((e: any) => e.evento) ?? [] })
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleEdit(data: AcompanhamentoFormData) {
    setEditError(null)
    const supabase = createClient()
    // paciente_id cannot be changed after creation; field is locked via pacienteIdFixo
    const { eventos_ids, data_alta, paciente_id: _pacienteId, ...rest } = data

    const { error } = await supabase
      .from('acompanhamentos')
      .update({ ...rest, data_alta: data_alta ?? null })
      .eq('id', id)

    if (error) {
      setEditError('Erro ao salvar. Tente novamente.')
      return
    }

    await supabase.from('acompanhamento_eventos').delete().eq('acompanhamento_id', id)

    if (eventos_ids.length > 0) {
      const { error: evError } = await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: id, evento_id }))
      )
      if (evError) {
        setEditError('Acompanhamento salvo, mas erro ao registrar eventos.')
        return
      }
    }

    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    const supabase = createClient()
    const { error } = await supabase.from('acompanhamentos').delete().eq('id', id)
    if (error) {
      setIsDeleting(false)
      setDeleteError('Erro ao excluir. Tente novamente.')
      return
    }
    router.push('/acompanhamentos')
  }

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
  if (!acomp) return <div className="py-12 text-center text-slate-500 text-sm">Acompanhamento não encontrado.</div>

  const ativo = isAtivo(acomp.data_alta)
  const dias = calcularDiasAcompanhamento(acomp.data_admissao, acomp.data_alta)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/acompanhamentos')}
          className="gap-2 text-slate-600"
        >
          <ArrowLeft size={15} /> Acompanhamentos
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil size={13} /> Editar
          </Button>
          <Sheet open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditError(null) }}>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Editar Acompanhamento</SheetTitle></SheetHeader>
              <div className="mt-6 px-4 pb-4">
                <AcompanhamentoForm
                  defaultValues={{
                    paciente_id: acomp.paciente_id,
                    diagnostico_id: acomp.diagnostico_id,
                    via_sisreg: acomp.via_sisreg,
                    demanda_espontanea: acomp.demanda_espontanea,
                    data_admissao: acomp.data_admissao,
                    data_alta: acomp.data_alta ?? '',
                    recidiva: acomp.recidiva,
                    eventos_ids: acomp.eventos?.map(e => e.id) ?? [],
                    observacao: acomp.observacao ?? '',
                  }}
                  pacienteIdFixo={acomp.paciente_id}
                  onSubmit={handleEdit}
                  submitLabel="Salvar Alterações"
                />
              </div>
              {editError && (
                <p className="text-sm text-red-600 mt-2 px-4 text-center">{editError}</p>
              )}
            </SheetContent>
          </Sheet>

          <Button variant="destructive" size="sm" className="gap-2" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={13} /> Excluir
          </Button>
          <Dialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteError(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir acompanhamento?</DialogTitle>
                <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                {deleteError && <p className="text-sm text-red-600 w-full">{deleteError}</p>}
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Paciente</p>
            <Button
              variant="link"
              className="p-0 h-auto text-base font-semibold gap-1.5"
              onClick={() => router.push(`/pacientes/${acomp.paciente_id}`)}
            >
              {acomp.paciente?.nome}
              <ExternalLink size={13} />
            </Button>
          </div>
          {ativo
            ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
            : <Badge variant="secondary">Alta</Badge>
          }
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Diagnóstico</p>
            <p className="font-medium">{acomp.diagnostico?.nome}</p>
          </div>
          <div>
            <p className="text-slate-500">Dias de acompanhamento</p>
            <p className="font-medium">{dias} dias</p>
          </div>
          <div>
            <p className="text-slate-500">Admissão</p>
            <p className="font-medium">{formatarDataBR(acomp.data_admissao)}</p>
          </div>
          <div>
            <p className="text-slate-500">Alta</p>
            <p className="font-medium">{acomp.data_alta ? formatarDataBR(acomp.data_alta) : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500">Via SISREG</p>
            <p className="font-medium">{acomp.via_sisreg ? 'Sim' : 'Não'}</p>
          </div>
          <div>
            <p className="text-slate-500">Demanda Espontânea</p>
            <p className="font-medium">{acomp.demanda_espontanea ? 'Sim' : 'Não'}</p>
          </div>
          <div>
            <p className="text-slate-500">Recidiva</p>
            <p className="font-medium">{acomp.recidiva ? 'Sim' : 'Não'}</p>
          </div>
          {acomp.eventos && acomp.eventos.length > 0 && (
            <div className="col-span-2">
              <p className="text-slate-500">Eventos não esperados</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {acomp.eventos.map(e => (
                  <Badge key={e.id} variant="outline">{e.nome}</Badge>
                ))}
              </div>
            </div>
          )}
          {acomp.observacao && (
            <div className="col-span-2">
              <p className="text-slate-500">Observação</p>
              <p className="font-medium">{acomp.observacao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
