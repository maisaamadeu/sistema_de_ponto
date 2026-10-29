import { cn } from '@/lib/utils'

export type StatusTone = 'idle' | 'working' | 'on_break' | 'done' | 'error'

const labels: Record<StatusTone, string> = {
  idle: 'Fora de jornada',
  working: 'Em jornada',
  on_break: 'Em intervalo',
  done: 'Jornada fechada',
  error: 'Incompleto',
}

const dotClass: Record<StatusTone, string> = {
  idle: 'bg-[var(--muted)]',
  working: 'bg-[var(--accent)]',
  on_break: 'bg-[var(--warning)]',
  done: 'bg-[var(--positive)]',
  error: 'bg-[var(--negative)]',
}

interface StatusIndicatorProps {
  status: StatusTone
  label?: string
  className?: string
  showLabel?: boolean
}

export function StatusIndicator({
  status,
  label,
  className,
  showLabel = true,
}: StatusIndicatorProps) {
  const text = label ?? labels[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm text-[var(--text)]',
        className,
      )}
      role="status"
    >
      <span
        className={cn('size-2.5 shrink-0 rounded-full', dotClass[status])}
        aria-hidden="true"
      />
      {showLabel ? <span>{text}</span> : <span className="sr-only">{text}</span>}
    </span>
  )
}
