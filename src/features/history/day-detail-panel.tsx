import { useState } from 'react'

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
import type { DayOverride, DayOverrideKind, PunchType, TimeEntry } from '@/domain/entities'
import { OVERRIDE_LABELS } from '@/domain/history'
import { localTimeHHmm, punchActionLabel } from '@/domain/punching'

const PUNCH_TYPES: PunchType[] = [
  'clock_in',
  'break_start',
  'break_end',
  'clock_out',
]

const OVERRIDE_OPTIONS: Array<DayOverrideKind | 'none'> = [
  'none',
  'rest',
  'day_off',
  'vacation',
  'holiday',
  'excused',
  'confirmed_absence',
]

function entryTimeLocal(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

interface DayDetailPanelProps {
  dateKey: string
  entries: TimeEntry[]
  override: DayOverride | null
  busy?: boolean
  onClose: () => void
  onAdd: (type: PunchType, timeHHmm: string) => Promise<void>
  onUpdate: (
    entryId: string,
    patch: { type?: PunchType; timeHHmm?: string },
  ) => Promise<void>
  onRemove: (entryId: string) => Promise<void>
  onSetOverride: (kind: DayOverrideKind | null) => Promise<void>
}

export function DayDetailPanel({
  dateKey,
  entries,
  override,
  busy,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
  onSetOverride,
}: DayDetailPanelProps) {
  const [addType, setAddType] = useState<PunchType>('clock_in')
  const [addTime, setAddTime] = useState(() => localTimeHHmm())
  const [formError, setFormError] = useState<string | null>(null)

  const title = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`))

  return (
    <aside
      className="space-y-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
      aria-labelledby="day-detail-title"
      data-testid="day-detail-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="day-detail-title"
            className="text-lg font-semibold capitalize text-[var(--text)]"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Eventos da jornada · edição valida sequência e sobreposição
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <section className="space-y-3" aria-labelledby="events-title">
        <h3 id="events-title" className="text-sm font-medium text-[var(--text)]">
          Eventos
        </h3>
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum evento neste dia.</p>
        ) : (
          <ul className="divide-y divide-[var(--rule)] rounded-md border border-[var(--border)]">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-end"
                data-testid={`event-${entry.id}`}
              >
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`type-${entry.id}`}>Tipo</Label>
                    <Select
                      value={entry.type}
                      disabled={busy}
                      onValueChange={(value) => {
                        void onUpdate(entry.id, { type: value as PunchType }).catch(
                          (err: unknown) =>
                            setFormError(
                              err instanceof Error ? err.message : 'Falha ao editar',
                            ),
                        )
                      }}
                    >
                      <SelectTrigger
                        id={`type-${entry.id}`}
                        className="h-9 w-full border-[var(--control)]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PUNCH_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {punchActionLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TimeField
                    label="Horário"
                    name={`time-${entry.id}`}
                    value={entryTimeLocal(entry.occurredAt)}
                    disabled={busy}
                    onChange={(timeHHmm) => {
                      void onUpdate(entry.id, { timeHHmm }).catch((err: unknown) =>
                        setFormError(
                          err instanceof Error ? err.message : 'Falha ao editar',
                        ),
                      )
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  data-testid={`remove-event-${entry.id}`}
                  onClick={() => {
                    void onRemove(entry.id).catch((err: unknown) =>
                      setFormError(
                        err instanceof Error ? err.message : 'Falha ao remover',
                      ),
                    )
                  }}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="add-event-title">
        <h3 id="add-event-title" className="text-sm font-medium text-[var(--text)]">
          Adicionar evento
        </h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-type">Tipo</Label>
            <Select
              value={addType}
              onValueChange={(value) => setAddType(value as PunchType)}
              disabled={busy}
            >
              <SelectTrigger
                id="add-type"
                className="h-9 w-full border-[var(--control)]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUNCH_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {punchActionLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TimeField
            label="Horário"
            name="add-time"
            value={addTime}
            onChange={setAddTime}
            disabled={busy}
          />
          <Button
            type="button"
            disabled={busy}
            data-testid="add-event"
            onClick={() => {
              setFormError(null)
              void onAdd(addType, addTime)
                .then(() => setAddTime(localTimeHHmm()))
                .catch((err: unknown) =>
                  setFormError(err instanceof Error ? err.message : 'Falha ao adicionar'),
                )
            }}
          >
            Adicionar
          </Button>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="override-title">
        <h3 id="override-title" className="text-sm font-medium text-[var(--text)]">
          Situação do dia
        </h3>
        <Select
          value={override?.kind ?? 'none'}
          disabled={busy}
          onValueChange={(value) => {
            const next = value as DayOverrideKind | 'none'
            void onSetOverride(next === 'none' ? null : next).catch((err: unknown) =>
              setFormError(err instanceof Error ? err.message : 'Falha ao marcar dia'),
            )
          }}
        >
          <SelectTrigger
            className="h-9 w-full border-[var(--control)]"
            aria-label="Situação do dia"
            data-testid="day-override"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OVERRIDE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === 'none' ? 'Jornada normal' : OVERRIDE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {formError ? (
        <p className="text-sm text-[var(--negative)]" role="alert">
          {formError}
        </p>
      ) : null}
    </aside>
  )
}
