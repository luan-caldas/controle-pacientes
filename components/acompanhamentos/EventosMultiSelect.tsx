'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandEmpty,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { EventoNaoEsperado } from '@/types'

interface EventosMultiSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
}

export function EventosMultiSelect({ value, onChange }: EventosMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [eventos, setEventos] = useState<EventoNaoEsperado[]>([])
  const [creating, setCreating] = useState(false)
  const [loadError, setLoadError] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase.from('eventos_nao_esperados').select('*').order('nome')
    if (error) { setLoadError(true); return }
    if (data) setEventos(data)
  }

  useEffect(() => { load() }, [])

  const filtered = eventos.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  )

  const showCreate = search.trim().length > 0 &&
    !filtered.some(e => e.nome.toLowerCase() === search.trim().toLowerCase())

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('eventos_nao_esperados')
        .insert({ nome: search.trim() })
        .select()
        .single()
      if (error || !data) return
      setEventos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      onChange([...value, data.id])
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  const selectedEventos = eventos.filter(e => value.includes(e.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" role="combobox" className="w-full justify-between font-normal" />}>
          {loadError ? 'Erro ao carregar' : (value.length === 0 ? 'Selecione eventos...' : `${value.length} evento(s) selecionado(s)`)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              placeholder="Buscar evento..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {filtered.map(e => (
                  <CommandItem key={e.id} value={e.nome} onSelect={() => toggle(e.id)}>
                    <Check className={cn('mr-2 h-4 w-4', value.includes(e.id) ? 'opacity-100' : 'opacity-0')} />
                    {e.nome}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem
                    value={`__criar__${search}`}
                    onSelect={handleCreate}
                    disabled={creating}
                    className="text-blue-600 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar: {search.trim()}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedEventos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedEventos.map(e => (
            <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
              {e.nome}
              <button
                type="button"
                onClick={() => toggle(e.id)}
                className="ml-0.5 rounded hover:text-red-500"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
