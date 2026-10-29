import { useEffect } from 'react'
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TimeField } from '@/components/shared'
import {
  ABSENCE_POLICY_OPTIONS,
  WEEKDAY_LABELS,
  formatMinutesAsHours,
  syncAutoExpected,
  workScheduleFormSchema,
  type WeekdayTimesFormValues,
  type WorkScheduleFormValues,
} from '@/domain/settings'
import { cn } from '@/lib/utils'

export interface WorkScheduleFormProps {
  defaultValues: WorkScheduleFormValues
  submitLabel: string
  onSubmit: (values: WorkScheduleFormValues) => Promise<void> | void
  showPreferences?: boolean
  className?: string
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-[var(--negative)]" role="alert">
      {message}
    </p>
  )
}

function TimesFields({
  values,
  onChange,
  errors,
  namePrefix,
}: {
  values: WeekdayTimesFormValues
  onChange: (next: WeekdayTimesFormValues) => void
  errors?: FieldErrors<WeekdayTimesFormValues>
  namePrefix: string
}) {
  function patch(partial: Partial<WeekdayTimesFormValues>) {
    const merged = { ...values, ...partial }
    onChange(syncAutoExpected(merged))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TimeField
          label="Entrada"
          name={`${namePrefix}.clockIn`}
          value={values.clockIn}
          onChange={(clockIn) => patch({ clockIn })}
          error={errors?.clockIn?.message}
        />
        <TimeField
          label="Início do intervalo"
          name={`${namePrefix}.breakStart`}
          value={values.breakStart}
          onChange={(breakStart) => patch({ breakStart })}
          error={errors?.breakStart?.message}
        />
        <TimeField
          label="Fim do intervalo"
          name={`${namePrefix}.breakEnd`}
          value={values.breakEnd}
          onChange={(breakEnd) => patch({ breakEnd })}
          error={errors?.breakEnd?.message}
        />
        <TimeField
          label="Saída"
          name={`${namePrefix}.clockOut`}
          value={values.clockOut}
          onChange={(clockOut) => patch({ clockOut })}
          error={errors?.clockOut?.message}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${namePrefix}-expected`}>Carga esperada (minutos)</Label>
          <Input
            id={`${namePrefix}-expected`}
            name={`${namePrefix}.expectedDailyMinutes`}
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            step={1}
            autoComplete="off"
            spellCheck={false}
            value={values.expectedDailyMinutes}
            aria-invalid={Boolean(errors?.expectedDailyMinutes) || undefined}
            onChange={(event) =>
              patch({
                expectedDailyMinutes: Number(event.target.value),
                expectedManual: true,
              })
            }
            className="tabular h-9 border-[var(--control)] bg-[var(--surface)]"
          />
          <FieldError message={errors?.expectedDailyMinutes?.message} />
          <p className="text-xs text-[var(--muted)]">
            Calculado: {formatMinutesAsHours(values.expectedDailyMinutes)}
            {values.expectedManual ? ' · ajuste manual' : ' · automático'}
          </p>
        </div>
        {values.expectedManual ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch({
                expectedManual: false,
              })
            }
          >
            Recalcular automático
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function firstErrorMessage(errors: FieldErrors<WorkScheduleFormValues>): string | null {
  const walk = (node: unknown): string | null => {
    if (!node || typeof node !== 'object') return null
    if (
      'message' in node &&
      typeof (node as { message?: unknown }).message === 'string'
    ) {
      return (node as { message: string }).message
    }
    for (const value of Object.values(node as Record<string, unknown>)) {
      const found = walk(value)
      if (found) return found
    }
    return null
  }
  return walk(errors)
}

export function WorkScheduleForm({
  defaultValues,
  submitLabel,
  onSubmit,
  showPreferences = true,
  className,
}: WorkScheduleFormProps) {
  const form = useForm<WorkScheduleFormValues>({
    resolver: zodResolver(workScheduleFormSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const mode = useWatch({ control: form.control, name: 'mode' })
  const weekdays = useWatch({ control: form.control, name: 'weekdays' })
  const uniform = useWatch({ control: form.control, name: 'uniform' })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const rootError = firstErrorMessage(form.formState.errors)
  const submitting = form.formState.isSubmitting

  return (
    <form
      className={cn('space-y-8', className)}
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values)
      })}
      noValidate
    >
      <section className="space-y-4" aria-labelledby="schedule-mode-title">
        <div>
          <h2
            id="schedule-mode-title"
            className="text-lg font-semibold text-[var(--text)]"
          >
            Tipo de jornada
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Escolha configuração rápida de segunda a sexta ou horários por dia.
          </p>
        </div>

        <Controller
          control={form.control}
          name="mode"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              className="grid gap-3 sm:grid-cols-2"
              aria-label="Modo da jornada"
            >
              <label
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors',
                  field.value === 'weekday_uniform' &&
                    'border-[var(--accent)] bg-[var(--accent-soft)]',
                )}
              >
                <RadioGroupItem value="weekday_uniform" className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text)]">
                    Segunda a sexta
                  </span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Mesmos horários nos dias úteis selecionados.
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors',
                  field.value === 'custom' &&
                    'border-[var(--accent)] bg-[var(--accent-soft)]',
                )}
              >
                <RadioGroupItem value="custom" className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text)]">
                    Personalizada
                  </span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Horários e carga diferentes por dia da semana.
                  </span>
                </span>
              </label>
            </RadioGroup>
          )}
        />
      </section>

      {mode === 'weekday_uniform' ? (
        <section className="space-y-4" aria-labelledby="uniform-days-title">
          <div>
            <h2
              id="uniform-days-title"
              className="text-lg font-semibold text-[var(--text)]"
            >
              Dias trabalhados
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Marque os dias e defina a fita de horários padrão.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {weekdays?.map((day, index) => (
              <label
                key={day.weekday}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm transition-colors',
                  day.enabled &&
                    'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]',
                )}
              >
                <Checkbox
                  checked={day.enabled}
                  onCheckedChange={(checked) =>
                    form.setValue(`weekdays.${index}.enabled`, checked === true, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  aria-label={WEEKDAY_LABELS[day.weekday]}
                />
                {WEEKDAY_LABELS[day.weekday]}
              </label>
            ))}
          </div>
          <FieldError
            message={form.formState.errors.weekdays?.message as string | undefined}
          />

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <p className="mb-4 text-sm font-medium text-[var(--text)]">Horários padrão</p>
            <Controller
              control={form.control}
              name="uniform"
              render={({ field }) => (
                <TimesFields
                  values={field.value ?? uniform}
                  onChange={(next) => {
                    field.onChange(next)
                    const current = form.getValues('weekdays')
                    form.setValue(
                      'weekdays',
                      current.map((day) => ({
                        ...day,
                        clockIn: next.clockIn,
                        breakStart: next.breakStart,
                        breakEnd: next.breakEnd,
                        clockOut: next.clockOut,
                        expectedDailyMinutes: next.expectedDailyMinutes,
                        expectedManual: next.expectedManual,
                      })),
                      { shouldDirty: true },
                    )
                  }}
                  errors={form.formState.errors.uniform}
                  namePrefix="uniform"
                />
              )}
            />
          </div>
        </section>
      ) : (
        <section className="space-y-4" aria-labelledby="custom-days-title">
          <div>
            <h2
              id="custom-days-title"
              className="text-lg font-semibold text-[var(--text)]"
            >
              Jornada por dia
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ative cada dia e ajuste entrada, intervalo, saída e carga.
            </p>
          </div>

          <div className="space-y-3">
            {weekdays?.map((day, index) => (
              <div
                key={day.weekday}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text)]">
                  <Checkbox
                    checked={day.enabled}
                    onCheckedChange={(checked) =>
                      form.setValue(`weekdays.${index}.enabled`, checked === true, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {WEEKDAY_LABELS[day.weekday]}
                </label>

                {day.enabled ? (
                  <Controller
                    control={form.control}
                    name={`weekdays.${index}`}
                    render={({ field }) => (
                      <TimesFields
                        values={{
                          clockIn: field.value.clockIn,
                          breakStart: field.value.breakStart,
                          breakEnd: field.value.breakEnd,
                          clockOut: field.value.clockOut,
                          expectedDailyMinutes: field.value.expectedDailyMinutes,
                          expectedManual: field.value.expectedManual,
                        }}
                        onChange={(next) => field.onChange({ ...field.value, ...next })}
                        errors={form.formState.errors.weekdays?.[index]}
                        namePrefix={`weekdays.${index}`}
                      />
                    )}
                  />
                ) : (
                  <p className="text-sm text-[var(--muted)]">Dia de descanso.</p>
                )}
              </div>
            ))}
          </div>
          <FieldError
            message={form.formState.errors.weekdays?.message as string | undefined}
          />
        </section>
      )}

      {showPreferences ? (
        <section className="space-y-6" aria-labelledby="prefs-title">
          <div>
            <h2 id="prefs-title" className="text-lg font-semibold text-[var(--text)]">
              Preferências
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Tema da interface e comportamento de faltas.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text)]">Tema</p>
            <Controller
              control={form.control}
              name="theme"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-2"
                  aria-label="Tema"
                >
                  {(
                    [
                      ['system', 'Sistema'],
                      ['light', 'Claro'],
                      ['dark', 'Escuro'],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm',
                        field.value === value &&
                          'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]',
                      )}
                    >
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text)]">Faltas sem marcações</p>
            <Controller
              control={form.control}
              name="absencePolicy"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3"
                  aria-label="Política de faltas"
                >
                  {ABSENCE_POLICY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4',
                        field.value === option.value &&
                          'border-[var(--accent)] bg-[var(--accent-soft)]',
                      )}
                    >
                      <RadioGroupItem value={option.value} className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--text)]">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-sm text-[var(--muted)]">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-5 text-sm text-[var(--negative)]">
          {rootError && form.formState.isSubmitted ? rootError : null}
        </div>
        <Button type="submit" disabled={submitting} className="sm:min-w-40">
          {submitting ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
