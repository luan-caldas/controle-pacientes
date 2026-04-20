'use client'

import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Acompanhamento } from '@/types'
import { isAtivo, calcularDiasAcompanhamento, formatarDataBR } from '@/lib/calculos'

interface AcompanhamentosTableProps {
  acompanhamentos: Acompanhamento[]
}

export function AcompanhamentosTable({ acompanhamentos }: AcompanhamentosTableProps) {
  const router = useRouter()

  const sorted = [...acompanhamentos].sort((a, b) => {
    const ativoA = isAtivo(a.data_alta) ? 0 : 1
    const ativoB = isAtivo(b.data_alta) ? 0 : 1
    if (ativoA !== ativoB) return ativoA - ativoB
    return (a.paciente?.nome ?? '').localeCompare(b.paciente?.nome ?? '')
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Paciente</TableHead>
          <TableHead>Diagnóstico</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admissão</TableHead>
          <TableHead>Alta</TableHead>
          <TableHead>Dias</TableHead>
          <TableHead>SISREG</TableHead>
          <TableHead>Recidiva</TableHead>
          <TableHead>Eventos Não Esperados</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-slate-500 py-8">
              Nenhum acompanhamento cadastrado.
            </TableCell>
          </TableRow>
        )}
        {sorted.map(a => {
          const ativo = isAtivo(a.data_alta)
          return (
            <TableRow
              key={a.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/acompanhamentos/${a.id}`)}
            >
              <TableCell className="font-medium">{a.paciente?.nome}</TableCell>
              <TableCell>{a.diagnostico?.nome}</TableCell>
              <TableCell>
                {ativo
                  ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                  : <Badge variant="secondary">Alta</Badge>
                }
              </TableCell>
              <TableCell>{formatarDataBR(a.data_admissao)}</TableCell>
              <TableCell>{a.data_alta ? formatarDataBR(a.data_alta) : '—'}</TableCell>
              <TableCell>{calcularDiasAcompanhamento(a.data_admissao, a.data_alta)} dias</TableCell>
              <TableCell>{a.via_sisreg ? 'Sim' : 'Não'}</TableCell>
              <TableCell>{a.recidiva ? 'Sim' : 'Não'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {a.eventos?.map(e => e.nome).join(', ') || '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
