'use client'

import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PeriodFilter } from './PeriodFilter'
import { PeriodFilter as PeriodFilterType } from '@/types'

interface ChartCardProps {
  title: string
  globalFilter: PeriodFilterType
  children: (filter: PeriodFilterType) => React.ReactNode
  hideFilter?: boolean
}

export function ChartCard({ title, globalFilter, children, hideFilter }: ChartCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [localFilter, setLocalFilter] = useState<PeriodFilterType>({ from: null, to: null })

  const activeFilter: PeriodFilterType = expanded
    ? { from: localFilter.from ?? globalFilter.from, to: localFilter.to ?? globalFilter.to }
    : globalFilter

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(true)}>
            <Maximize2 size={14} />
          </Button>
        </div>
        <div className="h-64">{children(globalFilter)}</div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {!hideFilter && (
            <PeriodFilter
              value={localFilter}
              onChange={setLocalFilter}
              label="Filtro individual (sobrescreve o global)"
            />
          )}
          <div className="h-96">{children(activeFilter)}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
