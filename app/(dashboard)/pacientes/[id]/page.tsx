'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import {
  calcularIdade, getDiagnosticoAtivo, isAtivo,
  calcularDiasAcompanhamento, formatarDataBR,
} from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PacienteForm, PacienteFormData } from '@/components/pacientes/PacienteForm'

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editError, setEditError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: pac }, { data: acomps }] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase
          .from('acompanhamentos')
          .select('*, diagnostico:diagnosticos(id, nome), eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))')
          .eq('paciente_id', id)
          .order('data_admissao', { ascending: false }),
      ])
      setPaciente(pac)
      const normalized = (acomps ?? []).map((a: any) => ({
        ...a,
        eventos: a.eventos?.map((e: any) => e.evento) ?? [],
      }))
      setAcompanhamentos(normalized)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleEdit(data: PacienteFormData) {
    setEditError(null)
    const supabase = createClient()
    const { error } = await supabase.from('pacientes').update(data).eq('id', id)
    if (error) {
      setEditError('Erro ao salvar. Tente novamente.')
      return
    }
    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('pacientes').delete().eq('id', id)
    if (error) {
      setIsDeleting(false)
      return
    }
    router.push('/pacientes')
  }

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
  if (!paciente) return <div className="py-12 text-center text-slate-500 text-sm">Paciente não encontrado.</div>

  const idade = calcularIdade(paciente.data_nascimento)
  const diagnosticoAtivo = getDiagnosticoAtivo(acompanhamentos)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pacientes')} className="gap-2 text-slate-600">
          <ArrowLeft size={15} /> Pacientes
        </Button>
        <div className="flex gap-2">
          <Sheet open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditError(null) }}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil size={13} /> Editar
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Editar Paciente</SheetTitle></SheetHeader>
              <div className="mt-6">
                <PacienteForm
                  defaultValues={{
                    nome: paciente.nome,
                    data_nascimento: paciente.data_nascimento,
                    numero_ses: paciente.numero_ses,
                    telefone: paciente.telefone,
                    genero: paciente.genero,
                    observacoes: paciente.observacoes ?? '',
                  }}
                  onSubmit={handleEdit}
                  submitLabel="Salvar Alterações"
                />
              </div>
              {editError && (
                <p className="text-sm text-red-600 mt-2 text-center">{editError}</p>
              )}
            </SheetContent>
          </Sheet>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 size={13} /> Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir paciente?</DialogTitle>
                <DialogDescription>
                  Todos os acompanhamentos vinculados serão excluídos. Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
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
        <h1 className="text-xl font-semibold text-slate-800">{paciente.nome}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Data de nascimento</p>
            <p className="font-medium">{formatarDataBR(paciente.data_nascimento)}</p>
          </div>
          <div>
            <p className="text-slate-500">Idade</p>
            <p className="font-medium">{idade} anos</p>
          </div>
          <div>
            <p className="text-slate-500">Gênero</p>
            <p className="font-medium">{paciente.genero}</p>
          </div>
          <div>
            <p className="text-slate-500">Nº SES</p>
            <p className="font-medium">{paciente.numero_ses}</p>
          </div>
          <div>
            <p className="text-slate-500">Telefone</p>
            <p className="font-medium">{paciente.telefone}</p>
          </div>
          <div>
            <p className="text-slate-500">Diagnóstico ativo</p>
            <p className="font-medium">{diagnosticoAtivo ?? <span className="text-slate-400">—</span>}</p>
          </div>
          {paciente.observacoes && (
            <div className="col-span-2">
              <p className="text-slate-500">Observações</p>
              <p className="font-medium">{paciente.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Acompanhamentos</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/acompanhamentos/novo?paciente_id=${id}`)}
          >
            <Plus size={13} /> Novo Acompanhamento
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Dias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acompanhamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-6 text-sm">
                  Nenhum acompanhamento registrado.
                </TableCell>
              </TableRow>
            )}
            {acompanhamentos.map(a => (
              <TableRow
                key={a.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => router.push(`/acompanhamentos/${a.id}`)}
              >
                <TableCell>{a.diagnostico?.nome}</TableCell>
                <TableCell>
                  {isAtivo(a.data_alta)
                    ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                    : <Badge variant="secondary">Alta</Badge>
                  }
                </TableCell>
                <TableCell>{formatarDataBR(a.data_admissao)}</TableCell>
                <TableCell>{calcularDiasAcompanhamento(a.data_admissao, a.data_alta)} dias</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
