'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PeriodFilter as PeriodFilterType } from '@/types'

interface PeriodFilterProps {
  value: PeriodFilterType
  onChange: (v: PeriodFilterType) => void
  label?: string
}

export function PeriodFilter({ value, onChange, label = 'Período (data de admissão)' }: PeriodFilterProps) {
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={value.from ?? ''}
            onChange={e => onChange({ ...value, from: e.target.value || null })}
            className="h-8 text-sm w-36"
          />
          <span className="text-slate-400 text-sm">até</span>
          <Input
            type="date"
            value={value.to ?? ''}
            onChange={e => onChange({ ...value, to: e.target.value || null })}
            className="h-8 text-sm w-36"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-500"
            onClick={() => onChange({ from: null, to: null })}
          >
            Limpar
          </Button>
        </div>
      </div>
    </div>
  )
}
