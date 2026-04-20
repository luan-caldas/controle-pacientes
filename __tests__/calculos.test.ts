import {
  calcularIdade,
  calcularDiasAcompanhamento,
  isAtivo,
  getDiagnosticoAtivo,
  getFaixaMeses,
  formatarDataBR,
} from '@/lib/calculos'
import { Acompanhamento } from '@/types'

describe('calcularIdade', () => {
  it('retorna a idade correta em anos', () => {
    const nascimento = '1990-04-20'
    const hoje = new Date('2026-04-20')
    expect(calcularIdade(nascimento, hoje)).toBe(36)
  })

  it('não conta o aniversário antes de passar', () => {
    const nascimento = '1990-04-21'
    const hoje = new Date('2026-04-20')
    expect(calcularIdade(nascimento, hoje)).toBe(35)
  })
})

describe('calcularDiasAcompanhamento', () => {
  it('retorna dias entre admissão e alta', () => {
    expect(calcularDiasAcompanhamento('2026-01-01', '2026-02-01')).toBe(31)
  })

  it('usa a data de referência quando data_alta é null', () => {
    const ref = new Date('2026-02-01')
    expect(calcularDiasAcompanhamento('2026-01-01', null, ref)).toBe(31)
  })
})

describe('isAtivo', () => {
  it('retorna true quando data_alta é null', () => {
    expect(isAtivo(null)).toBe(true)
  })

  it('retorna false quando data_alta está preenchida', () => {
    expect(isAtivo('2026-01-01')).toBe(false)
  })
})

describe('getDiagnosticoAtivo', () => {
  it('retorna o nome do diagnóstico do acompanhamento ativo mais recente', () => {
    const acompanhamentos: Partial<Acompanhamento>[] = [
      {
        data_alta: '2025-01-01',
        created_at: '2024-01-01T00:00:00Z',
        diagnostico: { id: '1', nome: 'Diagnóstico Antigo' },
      },
      {
        data_alta: null,
        created_at: '2025-06-01T00:00:00Z',
        diagnostico: { id: '2', nome: 'Diagnóstico Ativo' },
      },
    ]
    expect(getDiagnosticoAtivo(acompanhamentos as Acompanhamento[])).toBe('Diagnóstico Ativo')
  })

  it('retorna null quando não há acompanhamento ativo', () => {
    const acompanhamentos: Partial<Acompanhamento>[] = [
      {
        data_alta: '2025-01-01',
        created_at: '2024-01-01T00:00:00Z',
        diagnostico: { id: '1', nome: 'Diagnóstico' },
      },
    ]
    expect(getDiagnosticoAtivo(acompanhamentos as Acompanhamento[])).toBeNull()
  })
})

describe('getFaixaMeses', () => {
  it('1-3 meses', () => expect(getFaixaMeses(2)).toBe('1-3 meses'))
  it('4-6 meses', () => expect(getFaixaMeses(5)).toBe('4-6 meses'))
  it('7-9 meses', () => expect(getFaixaMeses(8)).toBe('7-9 meses'))
  it('10-12 meses', () => expect(getFaixaMeses(11)).toBe('10-12 meses'))
  it('+12 meses', () => expect(getFaixaMeses(13)).toBe('+12 meses'))
})

describe('formatarDataBR', () => {
  it('formata data ISO para dd/mm/aaaa', () => {
    expect(formatarDataBR('2026-04-20')).toBe('20/04/2026')
  })
})
