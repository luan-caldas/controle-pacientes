export type Genero = 'Masculino' | 'Feminino'

export interface Paciente {
  id: string
  nome: string
  data_nascimento: string
  numero_ses: string
  telefone: string
  genero: Genero
  observacoes: string | null
  created_at: string
}

export interface Diagnostico {
  id: string
  nome: string
}

export interface EventoNaoEsperado {
  id: string
  nome: string
}

export interface Acompanhamento {
  id: string
  paciente_id: string
  diagnostico_id: string
  via_sisreg: boolean
  demanda_espontanea: boolean
  data_admissao: string
  data_alta: string | null
  recidiva: boolean
  observacao: string | null
  created_at: string
  paciente?: Paciente
  diagnostico?: Diagnostico
  eventos?: EventoNaoEsperado[]
}

export interface PeriodFilter {
  from: string | null
  to: string | null
}

export interface ReportFilter {
  // Período de admissão
  dataAdmissaoMin: string | null
  dataAdmissaoMax: string | null
  // Período de alta
  dataAltaMin: string | null
  dataAltaMax: string | null
  // Faixa de dias
  diasMin: number | ''
  diasMax: number | ''
  // Paciente
  genero: 'Todos' | 'Masculino' | 'Feminino'
  idadeMin: number | ''
  idadeMax: number | ''
  statusPaciente: 'Todos' | 'Ativo' | 'Inativo'
  // Acompanhamento
  diagnostico: string
  statusAcomp: 'Todos' | 'Ativo' | 'Alta'
  viaSisreg: 'Todos' | 'Sim' | 'Nao'
  demandaEspontanea: 'Todos' | 'Sim' | 'Nao'
  recidiva: 'Todos' | 'Sim' | 'Nao'
  eventos: string[]
}

export const defaultReportFilter: ReportFilter = {
  dataAdmissaoMin: null,
  dataAdmissaoMax: null,
  dataAltaMin: null,
  dataAltaMax: null,
  diasMin: '',
  diasMax: '',
  genero: 'Todos',
  idadeMin: '',
  idadeMax: '',
  statusPaciente: 'Todos',
  diagnostico: 'Todos',
  statusAcomp: 'Todos',
  viaSisreg: 'Todos',
  demandaEspontanea: 'Todos',
  recidiva: 'Todos',
  eventos: [],
}
