'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento, Diagnostico, EventoNaoEsperado } from '@/types'
import { AcompanhamentosTable } from '@/components/acompanhamentos/AcompanhamentosTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AcompanhamentoForm,
  AcompanhamentoFormData,
} from '@/components/acompanhamentos/AcompanhamentoForm'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// Função de fuzzy match simples
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()

  // Match exato ou substring
  if (t.includes(q)) return true

  // Fuzzy: cada caractere da query deve aparecer na ordem em text
  let tIdx = 0
  let qIdx = 0
  while (tIdx < t.length && qIdx < q.length) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++
    }
    tIdx++
  }

  return qIdx === q.length
}

// Calcula score de relevância (maior = melhor)
function fuzzyScore(text: string, query: string): number {
  if (!query) return 1
  const t = text.toLowerCase()
  const q = query.toLowerCase()

  // Match exato no início tem maior score
  if (t.startsWith(q)) return 3
  // Match exato em qualquer lugar
  if (t.includes(q)) return 2
  // Fuzzy match
  if (fuzzyMatch(t, q)) return 1
  return 0
}

// Calcula quantidade de dias entre admissão e alta (ou hoje se não tiver alta)
function calcularDias(dataAdmissao: string, dataAlta: string | null): number {
  const admissao = new Date(dataAdmissao)
  const alta = dataAlta ? new Date(dataAlta) : new Date()
  const diffTime = alta.getTime() - admissao.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function AcompanhamentosPage() {
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [eventos, setEventos] = useState<EventoNaoEsperado[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  // Estados dos filtros
  const [filtroDiagnostico, setFiltroDiagnostico] = useState<string>('Todos')
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Ativo' | 'Alta'>('Todos')
  const [filtroDataAdmissaoMin, setFiltroDataAdmissaoMin] = useState('')
  const [filtroDataAdmissaoMax, setFiltroDataAdmissaoMax] = useState('')
  const [filtroDataAltaMin, setFiltroDataAltaMin] = useState('')
  const [filtroDataAltaMax, setFiltroDataAltaMax] = useState('')
  const [filtroDiasMin, setFiltroDiasMin] = useState<number | ''>('')
  const [filtroDiasMax, setFiltroDiasMax] = useState<number | ''>('')
  const [filtroViaSisreg, setFiltroViaSisreg] = useState<'Todos' | 'Sim' | 'Nao'>('Todos')
  const [filtroRecidiva, setFiltroRecidiva] = useState<'Todos' | 'Sim' | 'Nao'>('Todos')
  const [filtroEventos, setFiltroEventos] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data }, { data: diags }, { data: evs }] = await Promise.all([
        supabase
          .from('acompanhamentos')
          .select(`
            *,
            paciente:pacientes(id, nome),
            diagnostico:diagnosticos(id, nome),
            eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
          `),
        supabase.from('diagnosticos').select('*').order('nome'),
        supabase.from('eventos_nao_esperados').select('*').order('nome'),
      ])
      const normalized = (data ?? []).map((a: any) => ({
        ...a,
        eventos: a.eventos?.map((e: any) => e.evento) ?? [],
      }))
      setAcompanhamentos(normalized)
      setDiagnosticos(diags ?? [])
      setEventos(evs ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function limparFiltros() {
    setFiltroDiagnostico('Todos')
    setFiltroStatus('Todos')
    setFiltroDataAdmissaoMin('')
    setFiltroDataAdmissaoMax('')
    setFiltroDataAltaMin('')
    setFiltroDataAltaMax('')
    setFiltroDiasMin('')
    setFiltroDiasMax('')
    setFiltroViaSisreg('Todos')
    setFiltroRecidiva('Todos')
    setFiltroEventos([])
    setSearchTerm('')
  }

  const filtrosAtivos =
    filtroDiagnostico !== 'Todos' ||
    filtroStatus !== 'Todos' ||
    filtroDataAdmissaoMin !== '' ||
    filtroDataAdmissaoMax !== '' ||
    filtroDataAltaMin !== '' ||
    filtroDataAltaMax !== '' ||
    filtroDiasMin !== '' ||
    filtroDiasMax !== '' ||
    filtroViaSisreg !== 'Todos' ||
    filtroRecidiva !== 'Todos' ||
    filtroEventos.length > 0

  const filteredAcompanhamentos = useMemo(() => {
    const query = searchTerm.trim()

    return acompanhamentos
      .filter(a => {
        // Filtro por diagnóstico
        if (filtroDiagnostico !== 'Todos' && a.diagnostico_id !== filtroDiagnostico) return false

        // Filtro por status
        if (filtroStatus !== 'Todos') {
          const isAtivo = !a.data_alta
          if (filtroStatus === 'Ativo' && !isAtivo) return false
          if (filtroStatus === 'Alta' && isAtivo) return false
        }

        // Filtro por data de admissão
        if (filtroDataAdmissaoMin && a.data_admissao < filtroDataAdmissaoMin) return false
        if (filtroDataAdmissaoMax && a.data_admissao > filtroDataAdmissaoMax) return false

        // Filtro por data de alta
        if (filtroDataAltaMin && (!a.data_alta || a.data_alta < filtroDataAltaMin)) return false
        if (filtroDataAltaMax && (!a.data_alta || a.data_alta > filtroDataAltaMax)) return false

        // Filtro por faixa de dias
        const dias = calcularDias(a.data_admissao, a.data_alta)
        if (filtroDiasMin !== '' && dias < filtroDiasMin) return false
        if (filtroDiasMax !== '' && dias > filtroDiasMax) return false

        // Filtro por via SISREG
        if (filtroViaSisreg === 'Sim' && !a.via_sisreg) return false
        if (filtroViaSisreg === 'Nao' && a.via_sisreg) return false

        // Filtro por recidiva
        if (filtroRecidiva === 'Sim' && !a.recidiva) return false
        if (filtroRecidiva === 'Nao' && a.recidiva) return false

        // Filtro por eventos
        if (filtroEventos.length > 0) {
          const acompanhamentoEventosIds = a.eventos?.map(e => e.id) ?? []
          const hasAnyEvento = filtroEventos.some(id => acompanhamentoEventosIds.includes(id))
          if (!hasAnyEvento) return false
        }

        return true
      })
      .map(a => {
        if (!query) return { acompanhamento: a, score: 1 }
        const pacienteNome = (a as any).paciente?.nome ?? ''
        const diagnosticoNome = (a as any).diagnostico?.nome ?? ''
        const pacienteScore = fuzzyScore(pacienteNome, query)
        const diagnosticoScore = fuzzyScore(diagnosticoNome, query)
        const maxScore = Math.max(pacienteScore, diagnosticoScore)
        return { acompanhamento: a, score: maxScore }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.acompanhamento)
  }, [
    acompanhamentos,
    searchTerm,
    filtroDiagnostico,
    filtroStatus,
    filtroDataAdmissaoMin,
    filtroDataAdmissaoMax,
    filtroDataAltaMin,
    filtroDataAltaMax,
    filtroDiasMin,
    filtroDiasMax,
    filtroViaSisreg,
    filtroRecidiva,
    filtroEventos,
  ])

  async function handleSubmit(data: AcompanhamentoFormData) {
    setSaveError(null)
    const supabase = createClient()
    const { eventos_ids, data_alta, ...rest } = data
    const { data: novo, error } = await supabase
      .from('acompanhamentos')
      .insert({ ...rest, data_alta: data_alta ?? null })
      .select()
      .single()

    if (error || !novo) {
      setSaveError('Erro ao salvar. Tente novamente.')
      return
    }

    if (eventos_ids.length > 0) {
      const { error: evError } = await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: novo.id, evento_id }))
      )
      if (evError) {
        setSaveError('Acompanhamento salvo, mas erro ao registrar eventos.')
        return
      }
    }

    setSheetOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Acompanhamentos</h1>
        <Button size="sm" className="gap-2" onClick={() => setSheetOpen(true)}>
          <Plus size={15} /> Novo Acompanhamento
        </Button>
        <Sheet open={sheetOpen} onOpenChange={(v) => { setSheetOpen(v); if (!v) setSaveError(null) }}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Novo Acompanhamento</SheetTitle></SheetHeader>
            <div className="mt-6 px-4">
              <AcompanhamentoForm onSubmit={handleSubmit} submitLabel="Cadastrar" />
            </div>
            {saveError && (
              <p className="text-sm text-red-600 mt-2 text-center">{saveError}</p>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          placeholder="Buscar por paciente ou diagnóstico..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Filtro por diagnóstico */}
            <div className="space-y-1.5">
              <Label>Diagnóstico</Label>
              <Select value={filtroDiagnostico} onValueChange={(v) => setFiltroDiagnostico(v ?? 'Todos')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {diagnosticos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as 'Todos' | 'Ativo' | 'Alta')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por data de admissão mínima */}
            <div className="space-y-1.5">
              <Label htmlFor="adm-min">Data admissão (de)</Label>
              <Input
                id="adm-min"
                type="date"
                value={filtroDataAdmissaoMin}
                onChange={(e) => setFiltroDataAdmissaoMin(e.target.value)}
              />
            </div>

            {/* Filtro por data de admissão máxima */}
            <div className="space-y-1.5">
              <Label htmlFor="adm-max">Data admissão (até)</Label>
              <Input
                id="adm-max"
                type="date"
                value={filtroDataAdmissaoMax}
                onChange={(e) => setFiltroDataAdmissaoMax(e.target.value)}
              />
            </div>

            {/* Filtro por data de alta mínima */}
            <div className="space-y-1.5">
              <Label htmlFor="alta-min">Data alta (de)</Label>
              <Input
                id="alta-min"
                type="date"
                value={filtroDataAltaMin}
                onChange={(e) => setFiltroDataAltaMin(e.target.value)}
              />
            </div>

            {/* Filtro por data de alta máxima */}
            <div className="space-y-1.5">
              <Label htmlFor="alta-max">Data alta (até)</Label>
              <Input
                id="alta-max"
                type="date"
                value={filtroDataAltaMax}
                onChange={(e) => setFiltroDataAltaMax(e.target.value)}
              />
            </div>

            {/* Filtro por dias mínimos */}
            <div className="space-y-1.5">
              <Label htmlFor="dias-min">Dias (mín)</Label>
              <Input
                id="dias-min"
                type="number"
                min={0}
                placeholder="Ex: 5"
                value={filtroDiasMin}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setFiltroDiasMin(val === '' ? '' : Math.max(0, val))
                }}
              />
            </div>

            {/* Filtro por dias máximos */}
            <div className="space-y-1.5">
              <Label htmlFor="dias-max">Dias (máx)</Label>
              <Input
                id="dias-max"
                type="number"
                min={0}
                placeholder="Ex: 30"
                value={filtroDiasMax}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setFiltroDiasMax(val === '' ? '' : Math.max(0, val))
                }}
              />
            </div>

            {/* Filtro por via SISREG */}
            <div className="space-y-1.5">
              <Label>Via SISREG</Label>
              <Select
                value={filtroViaSisreg}
                onValueChange={(v) => setFiltroViaSisreg(v as 'Todos' | 'Sim' | 'Nao')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por recidiva */}
            <div className="space-y-1.5">
              <Label>Recidiva</Label>
              <Select
                value={filtroRecidiva}
                onValueChange={(v) => setFiltroRecidiva(v as 'Todos' | 'Sim' | 'Nao')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por eventos - ocupa 2 colunas */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 xl:col-span-2">
              <Label>Eventos não esperados</Label>
              <div className="flex flex-wrap gap-2">
                {eventos.map((e) => (
                  <Label
                    key={e.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors text-sm"
                  >
                    <Checkbox
                      checked={filtroEventos.includes(e.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFiltroEventos([...filtroEventos, e.id])
                        } else {
                          setFiltroEventos(filtroEventos.filter((id) => id !== e.id))
                        }
                      }}
                    />
                    {e.nome}
                  </Label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <AcompanhamentosTable acompanhamentos={filteredAcompanhamentos} />
        )}
      </div>
    </div>
  )
}
