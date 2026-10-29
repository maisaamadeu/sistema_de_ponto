import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8',
        className,
      )}
      role="status"
    >
      {Icon ? <Icon className="size-6 text-[var(--muted)]" aria-hidden="true" /> : null}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-balance text-[var(--text)]">
          {title}
        </h2>
        <p className="max-w-md text-sm text-[var(--muted)]">{description}</p>
      </div>
      {action}
    </div>
  )
}
