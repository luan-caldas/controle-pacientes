'use client'

import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ChartCardProps {
  title: string
  children: () => React.ReactNode
}

export function ChartCard({ title, children }: ChartCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(true)}>
            <Maximize2 size={14} />
          </Button>
        </div>
        <div className="h-64">{children()}</div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[92vw] sm:max-w-[92vw] w-[92vw]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="h-[65vh]">{children()}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
