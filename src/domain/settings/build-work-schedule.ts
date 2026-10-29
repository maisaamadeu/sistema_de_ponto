import type {
  CreateWorkScheduleInput,
  Weekday,
  WeekdaySchedule,
  WorkSchedule,
} from '@/domain/entities'
import { weekdayToPeriods } from '@/domain/calculation'

import type { WorkScheduleFormValues } from './schedule-schema'

function buildWeekdaysFromForm(values: WorkScheduleFormValues): WeekdaySchedule[] {
  if (values.mode === 'weekday_uniform') {
    return values.weekdays
      .filter((day) => day.enabled)
      .map((day) => ({
        weekday: day.weekday,
        clockIn: values.uniform.clockIn,
        breakStart: values.uniform.breakStart,
        breakEnd: values.uniform.breakEnd,
        clockOut: values.uniform.clockOut,
        expectedDailyMinutes: values.uniform.expectedDailyMinutes,
        expectedManual: values.uniform.expectedManual,
      }))
  }

  return values.weekdays
    .filter((day) => day.enabled)
    .map((day) => ({
      weekday: day.weekday,
      clockIn: day.clockIn,
      breakStart: day.breakStart,
      breakEnd: day.breakEnd,
      clockOut: day.clockOut,
      expectedDailyMinutes: day.expectedDailyMinutes,
      expectedManual: day.expectedManual,
    }))
}

/** Converte o formulário em input de criação versionada. */
export function buildCreateWorkScheduleInput(input: {
  userId: string
  values: WorkScheduleFormValues
  effectiveFrom: string
}): CreateWorkScheduleInput {
  const weekdays = buildWeekdaysFromForm(input.values)
  const representative = weekdays[0]
  const periods = representative
    ? weekdayToPeriods(representative)
    : [
        { start: input.values.uniform.clockIn, end: input.values.uniform.breakStart },
        { start: input.values.uniform.breakEnd, end: input.values.uniform.clockOut },
      ]

  const workweekDays = weekdays.map((day) => day.weekday) as Weekday[]
  const expectedDailyMinutes =
    representative?.expectedDailyMinutes ?? input.values.uniform.expectedDailyMinutes

  return {
    userId: input.userId,
    mode: input.values.mode,
    weekdays,
    periods,
    workweekDays,
    timezone: input.values.timezone,
    expectedDailyMinutes,
    effectiveFrom: input.effectiveFrom,
  }
}

/** Preenche o formulário a partir de uma escala persistida. */
export function workScheduleToFormValues(
  schedule: WorkSchedule,
  extras?: Partial<WorkScheduleFormValues>,
): WorkScheduleFormValues {
  const byWeekday = new Map(schedule.weekdays.map((day) => [day.weekday, day]))
  const first = schedule.weekdays[0]
  const uniform = first
    ? {
        clockIn: first.clockIn,
        breakStart: first.breakStart,
        breakEnd: first.breakEnd,
        clockOut: first.clockOut,
        expectedDailyMinutes: first.expectedDailyMinutes,
        expectedManual: first.expectedManual,
      }
    : {
        clockIn: schedule.periods[0]?.start ?? '08:00',
        breakStart: schedule.periods[0]?.end ?? '12:00',
        breakEnd: schedule.periods[1]?.start ?? '13:00',
        clockOut: schedule.periods[1]?.end ?? '17:00',
        expectedDailyMinutes: schedule.expectedDailyMinutes ?? 480,
        expectedManual: schedule.expectedDailyMinutes !== undefined,
      }

  const weekdays = ([0, 1, 2, 3, 4, 5, 6] as const).map((weekday) => {
    const day = byWeekday.get(weekday)
    if (!day) {
      return {
        weekday,
        enabled: false,
        ...uniform,
      }
    }
    return {
      weekday,
      enabled: true,
      clockIn: day.clockIn,
      breakStart: day.breakStart,
      breakEnd: day.breakEnd,
      clockOut: day.clockOut,
      expectedDailyMinutes: day.expectedDailyMinutes,
      expectedManual: day.expectedManual,
    }
  })

  return {
    mode: schedule.mode ?? 'weekday_uniform',
    timezone: schedule.timezone,
    uniform,
    weekdays,
    theme: extras?.theme ?? 'system',
    absencePolicy: extras?.absencePolicy ?? 'no_debit',
    weekStartsOn: extras?.weekStartsOn ?? 1,
  }
}

/** Data local yyyy-MM-dd. */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
