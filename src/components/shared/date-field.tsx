import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DateField({
  label,
  name,
  value,
  onChange,
  hint,
  error,
  disabled,
  className,
}: DateFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="date"
        value={value}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
          undefined
        }
        onChange={(event) => onChange(event.target.value)}
        className="tabular h-9 border-[var(--control)] bg-[var(--surface)]"
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[var(--muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-[var(--negative)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
