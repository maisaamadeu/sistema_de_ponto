import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, Clock3, Settings2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Clock3, end: true },
  { to: '/historico', label: 'Histórico', icon: CalendarDays, end: false },
  { to: '/configuracoes', label: 'Configurações', icon: Settings2, end: false },
] as const

export function AppShell() {
  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <header className="border-border/80 bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
              Ponto Fácil
            </p>
            <p className="truncate text-sm font-medium">Controle de jornada</p>
          </div>
          <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav
        aria-label="Principal móvel"
        className="border-border bg-background sticky bottom-0 border-t sm:hidden"
      >
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
        <Separator />
      </nav>
    </div>
  )
}
