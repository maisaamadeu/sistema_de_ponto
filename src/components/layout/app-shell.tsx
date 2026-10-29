import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, Clock3, Settings2 } from 'lucide-react'

import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Clock3, end: true },
  { to: '/historico', label: 'Histórico', icon: CalendarDays, end: false },
  { to: '/configuracoes', label: 'Configurações', icon: Settings2, end: false },
] as const

function NavItems({ variant }: { variant: 'sidebar' | 'bottom' }) {
  return navItems.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          variant === 'sidebar' &&
            'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150',
          variant === 'bottom' &&
            'inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] transition-colors duration-150',
          isActive
            ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]'
            : 'text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn('size-4', isActive ? 'text-[var(--accent)]' : 'text-current')}
            aria-hidden="true"
            strokeWidth={isActive ? 2.25 : 1.75}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  ))
}

export function AppShell() {
  return (
    <div className="bg-background text-foreground min-h-svh lg:flex">
      <a
        href="#conteudo-principal"
        className="sr-only bg-[var(--accent)] text-[var(--on-accent)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>

      <aside className="hidden w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border)] lg:flex">
        <div className="flex h-full flex-col px-3 py-6">
          <div className="px-3">
            <p className="text-sm font-semibold tracking-tight text-[var(--text)]">
              Ponto Fácil
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Ana Ribeiro · pessoal</p>
          </div>

          <nav aria-label="Principal" className="mt-8 flex flex-col gap-1">
            <NavItems variant="sidebar" />
          </nav>

          <div className="mt-auto space-y-3 px-1 pt-6">
            <p className="px-2 text-xs text-[var(--muted)]">Aparência</p>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text)]">
              Ponto Fácil
            </p>
            <p className="truncate text-xs text-[var(--muted)]">Ana Ribeiro · pessoal</p>
          </div>
          <ThemeToggle compact />
        </header>

        <main
          id="conteudo-principal"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-[calc(var(--bottom-nav-height)+1.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8 lg:pb-8"
        >
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal móvel"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--ground)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div
          className="grid grid-cols-3 gap-1 px-2 pt-1"
          style={{ minHeight: 'var(--bottom-nav-height)' }}
        >
          <NavItems variant="bottom" />
        </div>
      </nav>
    </div>
  )
}
