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
