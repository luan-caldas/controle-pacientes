'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Check, ChevronsUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReportFilter, defaultReportFilter, Diagnostico, EventoNaoEsperado } from '@/types'
import { cn, normalizeStr } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  value: ReportFilter
  onChange: (v: ReportFilter) => void
}

function isActive(f: ReportFilter): boolean {
  return (
    f.genero !== 'Todos' ||
    f.idadeMin !== '' ||
    f.idadeMax !== '' ||
    f.statusPaciente !== 'Todos' ||
    f.diagnostico !== 'Todos' ||
    f.statusAcomp !== 'Todos' ||
    f.dataAdmissaoMin !== null ||
    f.dataAdmissaoMax !== null ||
    f.dataAltaMin !== null ||
    f.dataAltaMax !== null ||
    f.diasMin !== '' ||
    f.diasMax !== '' ||
    f.tipoAdmissao !== 'Todos' ||
    f.recidiva !== 'Todos' ||
    f.eventos.length > 0
  )
}

export function ReportFiltersPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [eventosOpen, setEventosOpen] = useState(false)
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [eventos, setEventos] = useState<EventoNaoEsperado[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('diagnosticos').select('*').order('nome'),
      supabase.from('eventos_nao_esperados').select('*').order('nome'),
    ]).then(([{ data: diags }, { data: evs }]) => {
      setDiagnosticos(diags ?? [])
      setEventos(evs ?? [])
    })
  }, [])

  function set<K extends keyof ReportFilter>(key: K, val: ReportFilter[K]) {
    onChange({ ...value, [key]: val })
  }

  function limpar() {
    onChange(defaultReportFilter)
  }

  const filtroAtivo = isActive(value)
  const selectedEventos = eventos.filter(e => value.eventos.includes(e.id))

  function toggleEvento(id: string) {
    set('eventos', value.eventos.includes(id)
      ? value.eventos.filter(v => v !== id)
      : [...value.eventos, id]
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={open ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-2"
        >
          <Filter size={14} />
          Filtros
          {filtroAtivo && <span className="ml-1.5 h-2 w-2 rounded-full bg-red-500" />}
        </Button>
        {filtroAtivo && (
          <Button variant="ghost" size="sm" onClick={limpar} className="gap-2 text-slate-500">
            <X size={14} />
            Limpar
          </Button>
        )}
      </div>

      {open && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Admissão de */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Admissão (de)</Label>
              <Input
                type="date"
                value={value.dataAdmissaoMin ?? ''}
                onChange={e => set('dataAdmissaoMin', e.target.value || null)}
                className="h-8 text-sm"
              />
            </div>

            {/* Admissão até */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Admissão (até)</Label>
              <Input
                type="date"
                value={value.dataAdmissaoMax ?? ''}
                onChange={e => set('dataAdmissaoMax', e.target.value || null)}
                className="h-8 text-sm"
              />
            </div>

            {/* Alta de */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Alta (de)</Label>
              <Input
                type="date"
                value={value.dataAltaMin ?? ''}
                onChange={e => set('dataAltaMin', e.target.value || null)}
                className="h-8 text-sm"
              />
            </div>

            {/* Alta até */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Alta (até)</Label>
              <Input
                type="date"
                value={value.dataAltaMax ?? ''}
                onChange={e => set('dataAltaMax', e.target.value || null)}
                className="h-8 text-sm"
              />
            </div>

            {/* Dias mín */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Dias (mín)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 5"
                value={value.diasMin}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  set('diasMin', v === '' ? '' : Math.max(0, v))
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Dias máx */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Dias (máx)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 60"
                value={value.diasMax}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  set('diasMax', v === '' ? '' : Math.max(0, v))
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Gênero */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Gênero</Label>
              <Select value={value.genero} onValueChange={v => set('genero', v as ReportFilter['genero'])}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status paciente */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Status paciente</Label>
              <Select value={value.statusPaciente} onValueChange={v => set('statusPaciente', v as ReportFilter['statusPaciente'])}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Diagnóstico */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Diagnóstico</Label>
              <Select value={value.diagnostico} onValueChange={v => set('diagnostico', v ?? 'Todos')}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {diagnosticos.map(d => (
                    <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status acompanhamento */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Status acomp.</Label>
              <Select value={value.statusAcomp} onValueChange={v => set('statusAcomp', v as ReportFilter['statusAcomp'])}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de admissão */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Tipo de admissão</Label>
              <Select value={value.tipoAdmissao} onValueChange={v => set('tipoAdmissao', v as ReportFilter['tipoAdmissao'])}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Via SISREG">Via SISREG</SelectItem>
                  <SelectItem value="Demanda Espontânea">Demanda Espontânea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recidiva */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Recidiva</Label>
              <Select value={value.recidiva} onValueChange={v => set('recidiva', v as ReportFilter['recidiva'])}>
                <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Idade mín */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Idade (mín)</Label>
              <Input
                type="number"
                min={0}
                max={150}
                placeholder="Ex: 18"
                value={value.idadeMin}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  set('idadeMin', v === '' ? '' : Math.max(0, Math.min(150, v)))
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Idade máx */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Idade (máx)</Label>
              <Input
                type="number"
                min={0}
                max={150}
                placeholder="Ex: 65"
                value={value.idadeMax}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  set('idadeMax', v === '' ? '' : Math.max(0, Math.min(150, v)))
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Eventos não esperados — ocupa 2 colunas */}
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-slate-500">Eventos não esperados</Label>
              <Popover open={eventosOpen} onOpenChange={setEventosOpen}>
                <PopoverTrigger render={
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-8 text-sm" />
                }>
                  {value.eventos.length === 0
                    ? 'Selecione eventos...'
                    : `${value.eventos.length} evento(s) selecionado(s)`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command filter={(v, s) => normalizeStr(v).includes(normalizeStr(s)) ? 1 : 0}>
                    <CommandInput placeholder="Buscar evento..." />
                    <CommandList>
                      <CommandEmpty>Nenhum resultado.</CommandEmpty>
                      <CommandGroup>
                        {eventos.map(e => (
                          <CommandItem key={e.id} value={e.nome} onSelect={() => toggleEvento(e.id)}>
                            <Check className={cn('mr-2 h-4 w-4', value.eventos.includes(e.id) ? 'opacity-100' : 'opacity-0')} />
                            {e.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedEventos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEventos.map(e => (
                    <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
                      {e.nome}
                      <button type="button" onClick={() => toggleEvento(e.id)} className="ml-0.5 rounded hover:text-red-500">
                        <X size={11} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
