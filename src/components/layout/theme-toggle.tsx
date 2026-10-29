import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme, type ThemePreference } from '@/lib/theme/theme-provider'
import { cn } from '@/lib/utils'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

interface ThemeToggleProps {
  compact?: boolean
  className?: string
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className={cn(
        'inline-flex rounded-md border border-[var(--border)] bg-[var(--surface)] p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = preference === option.value
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size={compact ? 'icon-xs' : 'sm'}
            aria-pressed={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setPreference(option.value)}
            className={cn(
              'gap-1.5',
              selected &&
                'bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]',
            )}
          >
            <option.icon className="size-3.5" aria-hidden="true" />
            {!compact ? <span className="text-xs">{option.label}</span> : null}
          </Button>
        )
      })}
    </div>
  )
}
