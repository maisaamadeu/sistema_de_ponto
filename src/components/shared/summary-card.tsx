import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

interface SummaryCardProps extends ComponentProps<'article'> {
  label: string
  value: string
  caption?: string
  className?: string
}

export function SummaryCard({
  label,
  value,
  caption,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <article
      className={cn(
        'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4',
        className,
      )}
      {...props}
    >
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="tabular mt-2 text-2xl font-medium tracking-tight text-[var(--text)]">
        {value}
      </p>
      {caption ? <p className="mt-2 text-xs text-[var(--muted)]">{caption}</p> : null}
    </article>
  )
}
