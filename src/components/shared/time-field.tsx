import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TimeFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

export function TimeField({
  label,
  name,
  value,
  onChange,
  error,
  disabled,
  className,
}: TimeFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="time"
        value={value}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="tabular h-9 border-[var(--control)] bg-[var(--surface)]"
      />
      {error ? (
        <p id={errorId} className="text-xs text-[var(--negative)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
