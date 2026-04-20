'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, ClipboardList, Phone, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/acompanhamentos', label: 'Acompanhamentos', icon: ClipboardList },
  { href: '/ligacao', label: 'Ligação', icon: Phone },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="px-4 py-4 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700 leading-tight">
            Controle de Pacientes
          </span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 hover:text-slate-800"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
        {children}
      </main>
    </div>
  )
}
