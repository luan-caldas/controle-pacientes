'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { normalizeStr } from '@/lib/utils'
import { Paciente, Acompanhamento, Genero } from '@/types'
import { PacientesTable } from '@/components/pacientes/PacientesTable'
import { NovoPacienteSheet } from '@/components/pacientes/NovoPacienteSheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Função de fuzzy match simples
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const t = normalizeStr(text)
  const q = normalizeStr(query)

  if (t.includes(q)) return true

  let tIdx = 0
  let qIdx = 0
  while (tIdx < t.length && qIdx < q.length) {
    if (t[tIdx] === q[qIdx]) qIdx++
    tIdx++
  }

  return qIdx === q.length
}

function fuzzyScore(text: string, query: string): number {
  if (!query) return 1
  const t = normalizeStr(text)
  const q = normalizeStr(query)

  if (t.startsWith(q)) return 3
  if (t.includes(q)) return 2
  if (fuzzyMatch(t, q)) return 1
  return 0
}

// Calcula idade a partir da data de nascimento
function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mesAtual = hoje.getMonth()
  const mesNascimento = nascimento.getMonth()

  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--
  }

  return idade
}

export default function PacientesPage() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroGenero, setFiltroGenero] = useState<Genero | 'Todos'>('Todos')
  const [idadeMin, setIdadeMin] = useState<number | ''>('')
  const [idadeMax, setIdadeMax] = useState<number | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos')
  const [showFiltros, setShowFiltros] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pacs }, { data: acomps }] = await Promise.all([
      supabase.from('pacientes').select('*').order('nome'),
      supabase.from('acompanhamentos').select('*, diagnostico:diagnosticos(id, nome)'),
    ])
    setPacientes(pacs ?? [])
    setAcompanhamentos(acomps ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function limparFiltros() {
    setFiltroGenero('Todos')
    setIdadeMin('')
    setIdadeMax('')
    setFiltroStatus('Todos')
    setSearchTerm('')
  }

  const filtrosAtivos = filtroGenero !== 'Todos' || idadeMin !== '' || idadeMax !== '' || filtroStatus !== 'Todos'

  const filteredPacientes = useMemo(() => {
    const query = searchTerm.trim()

    return pacientes
      .filter(p => {
        // Filtro por gênero
        if (filtroGenero !== 'Todos' && p.genero !== filtroGenero) return false

        // Filtro por faixa de idade
        const idade = calcularIdade(p.data_nascimento)
        if (idadeMin !== '' && idade < idadeMin) return false
        if (idadeMax !== '' && idade > idadeMax) return false

        // Filtro por status
        if (filtroStatus !== 'Todos') {
          const temAcompanhamentoAtivo = acompanhamentos.some(a =>
            a.paciente_id === p.id && !a.data_alta
          )
          if (filtroStatus === 'Ativo' && !temAcompanhamentoAtivo) return false
          if (filtroStatus === 'Inativo' && temAcompanhamentoAtivo) return false
        }

        return true
      })
      .map(p => {
        if (!query) return { paciente: p, score: 1 }
        const nomeScore = fuzzyScore(p.nome, query)
        const sesScore = fuzzyScore(p.numero_ses ?? '', query)
        const telScore = fuzzyScore(p.telefone ?? '', query)
        const maxScore = Math.max(nomeScore, sesScore, telScore)
        return { paciente: p, score: maxScore }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.paciente)
  }, [pacientes, acompanhamentos, searchTerm, filtroGenero, idadeMin, idadeMax, filtroStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Pacientes</h1>
        <NovoPacienteSheet onSuccess={(id) => router.push(`/pacientes/${id}`)} />
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          placeholder="Buscar paciente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Botão de filtros */}
      <div className="flex items-center gap-2">
        <Button
          variant={showFiltros ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFiltros(!showFiltros)}
          className="gap-2"
        >
          <Filter size={14} />
          Filtros
          {filtrosAtivos && (
            <span className="ml-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>

        {filtrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-2 text-slate-500">
            <X size={14} />
            Limpar
          </Button>
        )}
      </div>

      {/* Painel de filtros */}
      {showFiltros && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por gênero */}
            <div className="space-y-1.5">
              <Label>Gênero</Label>
              <Select
                value={filtroGenero}
                onValueChange={(v) => setFiltroGenero(v as Genero | 'Todos')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por idade mínima */}
            <div className="space-y-1.5">
              <Label htmlFor="idade-min">Idade mínima</Label>
              <Input
                id="idade-min"
                type="number"
                min={0}
                max={150}
                placeholder="Ex: 18"
                value={idadeMin}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setIdadeMin(val === '' ? '' : Math.max(0, Math.min(150, val)))
                }}
              />
            </div>

            {/* Filtro por idade máxima */}
            <div className="space-y-1.5">
              <Label htmlFor="idade-max">Idade máxima</Label>
              <Input
                id="idade-max"
                type="number"
                min={0}
                max={150}
                placeholder="Ex: 65"
                value={idadeMax}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setIdadeMax(val === '' ? '' : Math.max(0, Math.min(150, val)))
                }}
              />
            </div>

            {/* Filtro por status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as 'Todos' | 'Ativo' | 'Inativo')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <PacientesTable pacientes={filteredPacientes} acompanhamentos={acompanhamentos} />
        )}
      </div>
    </div>
  )
}
