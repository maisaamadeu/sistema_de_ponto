import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimeField } from '@/components/shared'
import type { PunchType } from '@/domain/entities'
import {
  combineLocalDateAndTime,
  localTimeHHmm,
  punchActionLabel,
} from '@/domain/punching'

const TYPES: PunchType[] = ['clock_in', 'break_start', 'break_end', 'clock_out']

interface ManualPunchFormProps {
  dateKey: string
  defaultType: PunchType | null
  disabled?: boolean
  onSubmit: (input: { type: PunchType; occurredAt: string }) => Promise<void>
}

export function ManualPunchForm({
  dateKey,
  defaultType,
  disabled,
  onSubmit,
}: ManualPunchFormProps) {
  const formId = useId()
  const [type, setType] = useState<PunchType>(defaultType ?? 'clock_in')
  const [time, setTime] = useState(() => localTimeHHmm())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || disabled) return
    setError(null)
    setBusy(true)
    try {
      const occurredAt = combineLocalDateAndTime(dateKey, time)
      await onSubmit({ type, occurredAt })
      setTime(localTimeHHmm())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      id={formId}
      className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${formId}-title`}
    >
      <div>
        <h2 id={`${formId}-title`} className="text-lg font-semibold text-[var(--text)]">
          Registro manual
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Informe o horário e o tipo. A sequência é validada antes de gravar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-type`}>Tipo</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as PunchType)}
            disabled={busy || disabled}
          >
            <SelectTrigger
              id={`${formId}-type`}
              className="h-9 border-[var(--control)] bg-[var(--surface)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {punchActionLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TimeField
          label="Horário"
          name="manualTime"
          value={time}
          onChange={setTime}
          disabled={busy || disabled}
          error={error ?? undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="outline" disabled={busy || disabled}>
          {busy ? 'Salvando…' : 'Salvar marcação'}
        </Button>
        <p className="text-xs text-[var(--muted)]" aria-live="polite">
          Persistido só após confirmação no IndexedDB.
        </p>
      </div>
    </form>
  )
}
