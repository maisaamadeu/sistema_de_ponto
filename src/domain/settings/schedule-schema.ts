import { z } from 'zod'

import { computeExpectedMinutesFromTimes } from '@/domain/calculation'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const timeStringSchema = z
  .string()
  .regex(TIME_RE, 'Informe um horário válido no formato HH:mm.')

export const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
])

export const scheduleModeSchema = z.enum(['weekday_uniform', 'custom'])

export const themePreferenceSchema = z.enum(['system', 'light', 'dark'])

export const absencePolicySchema = z.enum(['no_debit', 'confirm_to_debit', 'auto_debit'])

const weekdayTimesSchema = z
  .object({
    clockIn: timeStringSchema,
    breakStart: timeStringSchema,
    breakEnd: timeStringSchema,
    clockOut: timeStringSchema,
    expectedDailyMinutes: z
      .number({ error: 'Informe a carga esperada em minutos.' })
      .int('A carga deve ser um número inteiro.')
      .min(0, 'A carga não pode ser negativa.')
      .max(24 * 60, 'A carga não pode passar de 24 horas.'),
    expectedManual: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const toMin = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    const clockIn = toMin(value.clockIn)
    const breakStart = toMin(value.breakStart)
    const breakEnd = toMin(value.breakEnd)
    const clockOut = toMin(value.clockOut)

    if (!(clockIn < breakStart)) {
      ctx.addIssue({
        code: 'custom',
        path: ['breakStart'],
        message: 'O início do intervalo deve ser depois da entrada.',
      })
    }
    if (!(breakStart < breakEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['breakEnd'],
        message: 'O fim do intervalo deve ser depois do início.',
      })
    }
    if (!(breakEnd < clockOut)) {
      ctx.addIssue({
        code: 'custom',
        path: ['clockOut'],
        message: 'A saída deve ser depois do fim do intervalo.',
      })
    }

    if (!value.expectedManual) {
      const auto = computeExpectedMinutesFromTimes(value)
      if (value.expectedDailyMinutes !== auto) {
        ctx.addIssue({
          code: 'custom',
          path: ['expectedDailyMinutes'],
          message: 'Recalcule a carga automática ou marque ajuste manual.',
        })
      }
    }
  })

export const weekdayScheduleFormSchema = z.object({
  weekday: weekdaySchema,
  enabled: z.boolean(),
  clockIn: timeStringSchema,
  breakStart: timeStringSchema,
  breakEnd: timeStringSchema,
  clockOut: timeStringSchema,
  expectedDailyMinutes: z
    .number({ error: 'Informe a carga esperada em minutos.' })
    .int('A carga deve ser um número inteiro.')
    .min(0, 'A carga não pode ser negativa.')
    .max(24 * 60, 'A carga não pode passar de 24 horas.'),
  expectedManual: z.boolean(),
})

type TimesInput = z.input<typeof weekdayTimesSchema>

function addTimesIssues(
  times: TimesInput,
  ctx: z.RefinementCtx,
  pathPrefix: Array<string | number>,
) {
  const parsed = weekdayTimesSchema.safeParse(times)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    ctx.addIssue({
      code: 'custom',
      message: issue.message,
      path: [...pathPrefix, ...issue.path],
    })
  }
}

export const workScheduleFormSchema = z
  .object({
    mode: scheduleModeSchema,
    timezone: z.string().min(1, 'Informe o fuso horário.'),
    uniform: z.object({
      clockIn: timeStringSchema,
      breakStart: timeStringSchema,
      breakEnd: timeStringSchema,
      clockOut: timeStringSchema,
      expectedDailyMinutes: z
        .number({ error: 'Informe a carga esperada em minutos.' })
        .int('A carga deve ser um número inteiro.')
        .min(0, 'A carga não pode ser negativa.')
        .max(24 * 60, 'A carga não pode passar de 24 horas.'),
      expectedManual: z.boolean(),
    }),
    weekdays: z
      .array(weekdayScheduleFormSchema)
      .length(7, 'Configure os 7 dias da semana.'),
    theme: themePreferenceSchema,
    absencePolicy: absencePolicySchema,
    weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'weekday_uniform') {
      addTimesIssues(value.uniform, ctx, ['uniform'])
      const enabled = value.weekdays.filter((day) => day.enabled)
      if (enabled.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['weekdays'],
          message: 'Selecione ao menos um dia trabalhado.',
        })
      }
      return
    }

    const enabled = value.weekdays.filter((day) => day.enabled)
    if (enabled.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['weekdays'],
        message: 'Ative ao menos um dia na jornada personalizada.',
      })
    }

    value.weekdays.forEach((day, index) => {
      if (!day.enabled) return
      addTimesIssues(day, ctx, ['weekdays', index])
    })
  })

export type WorkScheduleFormValues = z.infer<typeof workScheduleFormSchema>
export type WeekdayScheduleFormValues = z.infer<typeof weekdayScheduleFormSchema>
export type WeekdayTimesFormValues = z.infer<typeof weekdayTimesSchema>

export const WEEKDAY_LABELS: Record<0 | 1 | 2 | 3 | 4 | 5 | 6, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

export const ABSENCE_POLICY_OPTIONS: Array<{
  value: z.infer<typeof absencePolicySchema>
  label: string
  description: string
}> = [
  {
    value: 'no_debit',
    label: 'Não debitar',
    description: 'Dias sem marcações ficam com saldo zero até você decidir.',
  },
  {
    value: 'confirm_to_debit',
    label: 'Debitar só com falta confirmada',
    description: 'O débito só aparece depois de marcar a falta no dia.',
  },
  {
    value: 'auto_debit',
    label: 'Debitar automaticamente',
    description: 'Dia útil sem marcações gera débito da carga esperada.',
  },
]

export function defaultWeekdayTimes(): WeekdayTimesFormValues {
  return {
    clockIn: '08:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    clockOut: '17:00',
    expectedDailyMinutes: 480,
    expectedManual: false,
  }
}

export function defaultWorkScheduleFormValues(
  partial?: Partial<WorkScheduleFormValues>,
): WorkScheduleFormValues {
  const uniform = { ...defaultWeekdayTimes(), ...partial?.uniform }
  const weekdays =
    partial?.weekdays ??
    ([0, 1, 2, 3, 4, 5, 6] as const).map((weekday) => ({
      weekday,
      enabled: weekday >= 1 && weekday <= 5,
      ...uniform,
    }))

  return {
    mode: partial?.mode ?? 'weekday_uniform',
    timezone:
      partial?.timezone ??
      (Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'),
    uniform,
    weekdays,
    theme: partial?.theme ?? 'system',
    absencePolicy: partial?.absencePolicy ?? 'no_debit',
    weekStartsOn: partial?.weekStartsOn ?? 1,
  }
}

export function syncAutoExpected(times: WeekdayTimesFormValues): WeekdayTimesFormValues {
  if (times.expectedManual) return times
  try {
    return {
      ...times,
      expectedDailyMinutes: computeExpectedMinutesFromTimes(times),
    }
  } catch {
    return times
  }
}

export function formatMinutesAsHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours}h`
  return `${hours}h${String(rest).padStart(2, '0')}`
}
