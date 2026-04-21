'use client'

import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Paciente, Acompanhamento } from '@/types'
import { calcularIdade, getDiagnosticoAtivo } from '@/lib/calculos'

interface PacientesTableProps {
  pacientes: Paciente[]
  acompanhamentos: Acompanhamento[]
}

export function PacientesTable({ pacientes, acompanhamentos }: PacientesTableProps) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Gênero</TableHead>
          <TableHead>Idade</TableHead>
          <TableHead>Diagnóstico Ativo</TableHead>
          <TableHead>Nº SES</TableHead>
          <TableHead>Telefone</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pacientes.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-slate-500 py-8">
              Nenhum paciente cadastrado.
            </TableCell>
          </TableRow>
        )}
        {pacientes.map(paciente => {
          const acomps = acompanhamentos.filter(a => a.paciente_id === paciente.id)
          const diagnosticoAtivo = getDiagnosticoAtivo(acomps)
          const idade = calcularIdade(paciente.data_nascimento)

          return (
            <TableRow
              key={paciente.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/pacientes/${paciente.id}`)}
            >
              <TableCell className="font-medium">{paciente.nome}</TableCell>
              <TableCell>{paciente.genero}</TableCell>
              <TableCell>{idade} anos</TableCell>
              <TableCell>
                {diagnosticoAtivo
                  ? <Badge variant="outline">{diagnosticoAtivo}</Badge>
                  : <span className="text-slate-400 text-sm">—</span>
                }
              </TableCell>
              <TableCell>{paciente.numero_ses}</TableCell>
              <TableCell>{paciente.telefone}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
