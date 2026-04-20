'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandEmpty,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { Diagnostico } from '@/types'

interface DiagnosticoComboboxProps {
  value: string | null
  onChange: (id: string) => void
}

export function DiagnosticoCombobox({ value, onChange }: DiagnosticoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [creating, setCreating] = useState(false)
  const [loadError, setLoadError] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase.from('diagnosticos').select('*').order('nome')
    if (error) { setLoadError(true); return }
    if (data) setDiagnosticos(data)
  }

  useEffect(() => { load() }, [])

  const filtered = diagnosticos.filter(d =>
    d.nome.toLowerCase().includes(search.toLowerCase())
  )

  const showCreate = search.trim().length > 0 &&
    !filtered.some(d => d.nome.toLowerCase() === search.trim().toLowerCase())

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('diagnosticos')
        .insert({ nome: search.trim() })
        .select()
        .single()
      if (error || !data) return
      setDiagnosticos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      onChange(data.id)
      setOpen(false)
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  const selected = diagnosticos.find(d => d.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {loadError ? 'Erro ao carregar' : (selected?.nome ?? 'Selecione um diagnóstico...')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar diagnóstico..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {filtered.map(d => (
                <CommandItem
                  key={d.id}
                  value={d.nome}
                  onSelect={() => { onChange(d.id); setOpen(false); setSearch('') }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === d.id ? 'opacity-100' : 'opacity-0')} />
                  {d.nome}
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
  )
}
