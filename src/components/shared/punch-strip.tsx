import type { DemoPunch } from '@/features/demo/mock-data'
import { cn } from '@/lib/utils'

interface PunchStripProps {
  punches: DemoPunch[]
  activeType?: DemoPunch['type']
  className?: string
}

export function PunchStrip({ punches, activeType, className }: PunchStripProps) {
  return (
    <ol
      className={cn(
        'grid grid-cols-2 gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-4',
        className,
      )}
      aria-label="Marcações do dia"
    >
      {punches.map((punch) => {
        const isActive = punch.type === activeType
        return (
          <li
            key={punch.type}
            className={cn(
              'min-w-0 border-b-2 pb-2',
              isActive ? 'border-[var(--accent)]' : 'border-transparent',
            )}
          >
            <p className="text-[13px] text-[var(--muted)]">{punch.label}</p>
            <p
              className={cn(
                'tabular mt-1 text-[1.35rem] font-medium tracking-tight',
                punch.time ? 'text-[var(--text)]' : 'text-[var(--muted)]',
              )}
            >
              {punch.time ?? '—'}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
