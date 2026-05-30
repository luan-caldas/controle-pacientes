'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Item { id: string; nome: string }

interface CrudListProps {
  title: string
  tableName: string
  checkDependencies: (id: string) => Promise<boolean>
  dependencyMessage: string
}

export function CrudList({ title, tableName, checkDependencies, dependencyMessage }: CrudListProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNome, setEditingNome] = useState('')
  const [addNome, setAddNome] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await createClient().from(tableName).select('id, nome').order('nome')
    setItems(data ?? [])
    setLoading(false)
  }, [tableName])

  useEffect(() => { load() }, [load])

  function setError(id: string, msg: string) {
    setErrors(prev => ({ ...prev, [id]: msg }))
  }
  function clearError(id: string) {
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  async function handleAdd() {
    const nome = addNome.trim()
    if (!nome) return
    setSaving(true)
    const { error } = await createClient().from(tableName).insert({ nome })
    setSaving(false)
    if (error) return
    setAddNome('')
    load()
  }

  async function handleEdit(id: string) {
    const nome = editingNome.trim()
    if (!nome) return
    setSaving(true)
    const { error } = await createClient().from(tableName).update({ nome }).eq('id', id)
    setSaving(false)
    if (error) return
    setEditingId(null)
    load()
  }

  async function handleDelete(id: string) {
    clearError(id)
    const hasDeps = await checkDependencies(id)
    if (hasDeps) {
      setError(id, dependencyMessage)
      return
    }
    const { error } = await createClient().from(tableName).delete().eq('id', id)
    if (error) {
      setError(id, 'Erro ao excluir. Tente novamente.')
      return
    }
    load()
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <ul className="space-y-1 h-64 overflow-y-auto pr-1">
          {items.length === 0 && (
            <li className="text-sm text-slate-400">Nenhum item cadastrado.</li>
          )}
          {items.map(item => (
            <li key={item.id}>
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingNome}
                    onChange={e => setEditingNome(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEdit(item.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="h-8 text-sm flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleEdit(item.id)} disabled={saving}>
                    <Check size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="flex-1 text-sm text-slate-700 py-1">{item.nome}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => { setEditingId(item.id); setEditingNome(item.nome); clearError(item.id) }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 hover:text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              )}
              {errors[item.id] && (
                <p className="text-xs text-red-600 mt-0.5">{errors[item.id]}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <Input
          value={addNome}
          onChange={e => setAddNome(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Novo item..."
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !addNome.trim()} className="gap-1.5 shrink-0">
          <Plus size={14} />
          Adicionar
        </Button>
      </div>
    </div>
  )
}
