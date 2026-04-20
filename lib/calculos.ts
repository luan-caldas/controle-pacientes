import { differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns'
import { Acompanhamento } from '@/types'

/**
 * Normalise a Date to local midnight.
 *
 * `new Date('YYYY-MM-DD')` (ISO date-only format) is parsed as UTC midnight by
 * the JS runtime.  In timezones west of UTC this shifts the represented date
 * back by one day when compared against dates produced by date-fns' parseISO
 * (which always uses local midnight for date-only strings).  Extracting the UTC
 * year/month/day and reconstructing the Date in local time compensates for this
 * so that all comparisons are made against the intended calendar date.
 */
function normaliseDate(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function calcularIdade(dataNascimento: string, hoje = new Date()): number {
  return differenceInYears(normaliseDate(hoje), parseISO(dataNascimento))
}

export function calcularDiasAcompanhamento(
  dataAdmissao: string,
  dataAlta: string | null,
  hoje = new Date()
): number {
  const fim = dataAlta ? parseISO(dataAlta) : normaliseDate(hoje)
  return differenceInDays(fim, parseISO(dataAdmissao))
}

export function isAtivo(dataAlta: string | null): boolean {
  return dataAlta === null
}

export function getDiagnosticoAtivo(acompanhamentos: Acompanhamento[]): string | null {
  const ativos = acompanhamentos
    .filter(a => a.data_alta === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return ativos[0]?.diagnostico?.nome ?? null
}

export function calcularMeses(dataAdmissao: string, dataAlta: string): number {
  return differenceInMonths(parseISO(dataAlta), parseISO(dataAdmissao))
}

export function getFaixaMeses(meses: number): string {
  if (meses < 1) return '< 1 mês'
  if (meses <= 3) return '1-3 meses'
  if (meses <= 6) return '4-6 meses'
  if (meses <= 9) return '7-9 meses'
  if (meses <= 12) return '10-12 meses'
  return '+12 meses'
}

export function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}
